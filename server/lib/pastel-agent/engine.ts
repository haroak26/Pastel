import pLimit from "p-limit";
import { chatJSON, chatText, extractFencedBlock } from "./gateway";
import { planKnowledge, codeKnowledge } from "./knowledge";
import { selectStyleSeed } from "./style-seeds";
import { clarifySystemPrompt, clarifyUserPrompt } from "./prompts/clarify";
import { titleSystemPrompt, titleUserPrompt } from "./prompts/title";
import { briefSystemPrompt, briefUserPrompt } from "./prompts/brief";
import {
  designSystemSystemPrompt,
  designSystemUserPrompt,
  screenSpecSystemPrompt,
  screenSpecUserPrompt,
  componentSpecSystemPrompt,
  componentSpecUserPrompt,
} from "./prompts/plan";
import {
  sharedCodeSystemPrompt,
  sharedCodeUserPrompt,
  screenCodeSystemPrompt,
  screenCodeUserPrompt,
  fixSystemPrompt,
  fixUserPrompt,
} from "./prompts/code";
import { MODELS } from "./gateway";
import { verifyProject, listScreens, screenNameFromPath, type SandboxError } from "./sandbox";
import {
  emitEvent,
  updateRun,
  mergeManifest,
  persistDoc,
  persistFile,
} from "./run-store";
import { storage } from "../../storage";
import { calcCost, toCredits } from "../pricing";
import * as creditService from "../credit-service";
import type {
  BrandKit,
  PastelPhase,
  Sitemap,
  SitemapScreen,
  AgentManifest,
} from "./types";

const RECENT_SEEDS: string[] = [];

function trackSeed(seed: string) {
  RECENT_SEEDS.push(seed);
  if (RECENT_SEEDS.length > 5) RECENT_SEEDS.shift();
}

interface ClarifyResult {
  questions: Array<{ id: string; question: string; options?: string[] }>;
}

// ── Clarify (GPT 5.4 nano) ────────────────────────────────────────────────

export async function runClarify(userPrompt: string, userId?: string): Promise<ClarifyResult> {
  const result = await chatJSON<ClarifyResult>(
    [
      { role: "system", content: clarifySystemPrompt() },
      { role: "user", content: clarifyUserPrompt(userPrompt) },
    ],
    { model: "clarify", temperature: 0.7, maxTokens: 1500 },
  );

  if (userId) {
    const modelId = MODELS.clarify;
    const cost = calcCost(modelId, clarifySystemPrompt().length + clarifyUserPrompt(userPrompt).length, JSON.stringify(result).length);
    creditService.deductCredits(userId, cost.credits, "Pastel Agent: Clarify", { model: modelId, costDollars: cost.costDollars }).catch(() => {});
  }

  if (!Array.isArray(result.questions)) return { questions: [] };
  return { questions: result.questions.slice(0, 4) };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toPascalCase(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  const pascal = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return pascal || "Screen";
}

function fallbackSitemap(prompt: string): Sitemap {
  const p = prompt.toLowerCase();
  let screens: SitemapScreen[];
  if (/dashboard|admin|saas|analytics/.test(p)) {
    screens = [
      { id: "dashboard", name: "Dashboard", purpose: "Main overview", sections: ["Header", "Overview", "Content", "Footer"], components: ["Navbar", "Card", "Button"] },
      { id: "settings", name: "Settings", purpose: "Account settings", sections: ["Header", "Settings form", "Footer"], components: ["Navbar", "Input", "Button"] },
    ];
  } else if (/shop|store|commerce|product/.test(p)) {
    screens = [
      { id: "home", name: "Home", purpose: "Storefront", sections: ["Header", "Hero", "Featured products", "Footer"], components: ["Navbar", "Card", "Button", "Footer"] },
      { id: "products", name: "Products", purpose: "Product listing", sections: ["Header", "Product grid", "Footer"], components: ["Navbar", "Card", "Footer"] },
    ];
  } else {
    screens = [
      { id: "home", name: "Home", purpose: "Landing page", sections: ["Header", "Hero", "Features", "Footer"], components: ["Navbar", "Button", "Footer"] },
      { id: "about", name: "About", purpose: "About page", sections: ["Header", "Story", "Team", "Footer"], components: ["Navbar", "Footer"] },
    ];
  }
  const components = [...new Set(screens.flatMap((s) => s.components))];
  return { screens, components };
}

function parseSitemap(briefDoc: string, prompt: string): Sitemap {
  const block = extractFencedBlock(briefDoc, "json sitemap");
  if (block) {
    try {
      const parsed = JSON.parse(block) as Sitemap;
      if (Array.isArray(parsed.screens) && parsed.screens.length > 0) {
        const screens = parsed.screens.slice(0, 6).map((s, i) => ({
          id: s.id || `screen-${i}`,
          name: toPascalCase(s.name || `Screen${i + 1}`),
          purpose: s.purpose || "",
          sections: Array.isArray(s.sections) ? s.sections : [],
          components: Array.isArray(s.components) ? s.components : [],
        }));
        const components = Array.isArray(parsed.components) && parsed.components.length > 0
          ? parsed.components.map((c) => toPascalCase(c))
          : [...new Set(screens.flatMap((s) => s.components.map(toPascalCase)))];
        return { screens, components };
      }
    } catch {
      // fall through to fallback
    }
  }
  return fallbackSitemap(prompt);
}

function parseBrandKit(designSystemDoc: string): BrandKit | null {
  const block = extractFencedBlock(designSystemDoc, "json tokens");
  if (!block) return null;
  try {
    const parsed = JSON.parse(block) as BrandKit;
    if (parsed && parsed.colors && parsed.fonts) {
      return {
        colors: parsed.colors ?? {},
        fonts: parsed.fonts ?? {},
        sizes: parsed.sizes ?? {},
        radius: parsed.radius ?? {},
      };
    }
  } catch {
    // fall through
  }
  return null;
}

/** Retry a model call once on failure (JSON parse, empty response, etc). */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[pastel-agent] ${label} failed, retrying once:`, err instanceof Error ? err.message : err);
    return await fn();
  }
}

// ── Cost tracking within a run ────────────────────────────────────────────

interface CostEntry {
  modelId: string;
  inputChars: number;
  outputChars: number;
  credits: number;
}

// ── The agent loop ────────────────────────────────────────────────────────

export async function startAgentLoop(
  runId: string,
  prompt: string,
  answers: Record<string, string>,
  projectId?: string,
  holdId?: string,
  userId?: string,
): Promise<void> {
  const emit = (event: Parameters<typeof emitEvent>[1]) => emitEvent(runId, event);
  const activity = (message: string) => emit({ type: "activity", message });

  const costEntries: CostEntry[] = [];

  const trackCost = (modelId: string, inputChars: number, outputChars: number) => {
    const c = calcCost(modelId, inputChars, outputChars);
    costEntries.push({ modelId, inputChars, outputChars, credits: c.credits });
  };

  const totalUsedCredits = (): number => {
    return Math.round(costEntries.reduce((s, e) => s + e.credits, 0) * 100) / 100;
  };

  const setPhase = async (phase: PastelPhase, status: "running" | "done" | "error") => {
    emit({ type: "phase", phase, status });
    const manifest = (await mergeManifest(runId, { phases: { [phase]: status } as AgentManifest["phases"] }));
    await updateRun(runId, { phase, manifest: manifest as unknown as Record<string, unknown> });
  };

  const saveDoc = async (doc: { path: string; title: string; kind: string; content: string }) => {
    await persistDoc(runId, doc);
    emit({ type: "doc", doc });
    const state = await mergeManifest(runId, {});
    const docs = [...new Set([...(state.docs ?? []), doc.path])];
    await mergeManifest(runId, { docs });
  };

  const saveFile = async (file: { path: string; kind: string; content: string }) => {
    await persistFile(runId, file);
    emit({ type: "file", file });
  };

  try {
    // ── Title (GPT 5.4 nano, background) ──────────────────────────────
    const titlePromise = (async () => {
      try {
        const promptSys = titleSystemPrompt();
        const promptUser = titleUserPrompt(prompt);
        const t = await chatJSON<{ title: string }>(
          [
            { role: "system", content: promptSys },
            { role: "user", content: promptUser },
          ],
          { model: "title", temperature: 0.3, maxTokens: 100 },
        );
        trackCost(MODELS.title, promptSys.length + promptUser.length, JSON.stringify(t).length);
        const title = (t.title || "").trim().slice(0, 60);
        if (title) {
          await updateRun(runId, { title });
          emit({ type: "title", title });
          if (projectId) {
            try { await storage.updateProject(projectId, { name: title }); } catch {}
          }
        }
      } catch (err) {
        console.warn("[pastel-agent] title generation failed:", err instanceof Error ? err.message : err);
      }
    })();

    // ── Phase 1: Brief (Claude Haiku 4.5) ─────────────────────────────
    await setPhase("brief", "running");
    activity("Writing the build brief");

    const seed = selectStyleSeed(RECENT_SEEDS);
    trackSeed(seed.name);
    const styleDirection = `Style: ${seed.name}. Mood: ${seed.mood.join(", ")}. Spatial: ${seed.spatialPhilosophy}. Typography: ${seed.typographicAttitude}. Colors: ${seed.colorTemperature}. Direction: ${seed.creativeDirection}`;

    const briefSysPrompt = briefSystemPrompt();
    const briefUserPromptText = briefUserPrompt(prompt, answers, styleDirection);
    const briefDoc = await withRetry(
      () =>
        chatText(
          [
            { role: "system", content: briefSysPrompt },
            { role: "user", content: briefUserPromptText },
          ],
          { model: "brief", temperature: 0.7, maxTokens: 4000 },
        ),
      "brief",
    );
    trackCost(MODELS.brief, briefSysPrompt.length + briefUserPromptText.length, briefDoc.length);

    const sitemap = parseSitemap(briefDoc, prompt);
    await saveDoc({ path: "docs/00-brief.md", title: "Build Brief", kind: "brief", content: briefDoc });
    activity(`Brief ready — ${sitemap.screens.length} screens, ${sitemap.components.length} shared components`);
    await setPhase("brief", "done");

    // ── Phase 2: Plan (Claude Sonnet 5) ───────────────────────────────
    await setPhase("plan", "running");
    activity("Defining the design system");

    const knowledge = planKnowledge();

    const designSysPrompt = designSystemSystemPrompt();
    const designUserPromptText = designSystemUserPrompt(briefDoc, knowledge);
    const designSystemDoc = await withRetry(
      () =>
        chatText(
          [
            { role: "system", content: designSysPrompt },
            { role: "user", content: designUserPromptText },
          ],
          { model: "plan", temperature: 0.6, maxTokens: 4000 },
        ),
      "design-system",
    );
    trackCost(MODELS.plan, designSysPrompt.length + designUserPromptText.length, designSystemDoc.length);
    await saveDoc({ path: "docs/01-design-system.md", title: "Design System", kind: "system", content: designSystemDoc });

    const brandKit = parseBrandKit(designSystemDoc);
    if (brandKit) {
      await mergeManifest(runId, { brandKit });
    }

    const planLimit = pLimit(3);

    // Component spec doc + per-screen spec docs, in parallel
    const componentSpecPromise = planLimit(async () => {
      activity("Specifying shared components");
      try {
        const compSysPrompt = componentSpecSystemPrompt();
        const compUserPromptText = componentSpecUserPrompt(briefDoc, designSystemDoc, sitemap.components);
        const doc = await withRetry(
          () =>
            chatText(
              [
                { role: "system", content: compSysPrompt },
                { role: "user", content: compUserPromptText },
              ],
              { model: "plan", temperature: 0.5, maxTokens: 6000 },
            ),
          "component-spec",
        );
        trackCost(MODELS.plan, compSysPrompt.length + compUserPromptText.length, doc.length);
        await saveDoc({ path: "docs/02-components.md", title: "Component Specifications", kind: "component-spec", content: doc });
        return doc;
      } catch (err) {
        activity("Component spec failed — continuing with screen specs");
        console.error("[pastel-agent] component spec failed:", err instanceof Error ? err.message : err);
        return `# Components\n\n${sitemap.components.join(", ")}\n`;
      }
    });

    const screenSpecPromises = sitemap.screens.map((screen) =>
      planLimit(async () => {
        activity(`Writing spec: ${screen.name}`);
        try {
          const ssSysPrompt = screenSpecSystemPrompt();
          const ssUserPromptText = screenSpecUserPrompt(briefDoc, designSystemDoc, screen.name, screen.purpose, screen.sections, screen.components);
          const doc = await withRetry(
            () =>
              chatText(
                [
                  { role: "system", content: ssSysPrompt },
                  { role: "user", content: ssUserPromptText },
                ],
                { model: "plan", temperature: 0.5, maxTokens: 6000 },
              ),
            `screen-spec-${screen.name}`,
          );
          trackCost(MODELS.plan, ssSysPrompt.length + ssUserPromptText.length, doc.length);
          await saveDoc({
            path: `docs/screens/${screen.name}.md`,
            title: `${screen.name} Screen Spec`,
            kind: "screen-spec",
            content: doc,
          });
          return { screen, doc };
        } catch (err) {
          activity(`Spec for ${screen.name} failed — retrying`);
          console.error(`[pastel-agent] screen spec ${screen.name} failed:`, err instanceof Error ? err.message : err);
          try {
            const ssSysPrompt2 = screenSpecSystemPrompt();
            const ssUserPromptText2 = screenSpecUserPrompt(briefDoc, designSystemDoc, screen.name, screen.purpose, screen.sections, screen.components);
            const doc = await chatText(
              [
                { role: "system", content: ssSysPrompt2 },
                { role: "user", content: ssUserPromptText2 },
              ],
              { model: "plan", temperature: 0.5, maxTokens: 6000 },
            );
            trackCost(MODELS.plan, ssSysPrompt2.length + ssUserPromptText2.length, doc.length);
            await saveDoc({ path: `docs/screens/${screen.name}.md`, title: `${screen.name} Screen Spec`, kind: "screen-spec", content: doc });
            return { screen, doc };
          } catch (err2) {
            activity(`Skipping ${screen.name} — spec generation failed`);
            return null;
          }
        }
      }),
    );

    const [componentSpecDoc, ...screenSpecResults] = await Promise.all([
      componentSpecPromise,
      ...screenSpecPromises,
    ]);
    const screenSpecs = screenSpecResults.filter((r): r is { screen: SitemapScreen; doc: string } => r !== null);

    if (screenSpecs.length === 0) {
      throw new Error("All screen specifications failed to generate");
    }
    await setPhase("plan", "done");

    // ── Phase 3: Build (GPT 5.6 Terra) ──────────────────────────────────
    await setPhase("build", "running");
    const codeKb = codeKnowledge();
    const files: Record<string, string> = {};

    // 3a. Shared foundation: styles.css + all shared components (one call —
    //     components and tokens are interdependent)
    activity("Building shared foundation (styles + components)");
    const sharedSysPrompt = sharedCodeSystemPrompt();
    const sharedUserPromptText = sharedCodeUserPrompt(briefDoc, designSystemDoc, componentSpecDoc, codeKb, sitemap.components);
    const sharedResult = await withRetry(
      () =>
        chatJSON<{ files: Array<{ path: string; content: string }> }>(
          [
            { role: "system", content: sharedSysPrompt },
            { role: "user", content: sharedUserPromptText },
          ],
          { model: "code", temperature: 0.4, maxTokens: 12000 },
        ),
      "shared-code",
    );
    trackCost(MODELS.code, sharedSysPrompt.length + sharedUserPromptText.length, JSON.stringify(sharedResult).length);

    for (const f of sharedResult.files ?? []) {
      if (!f.path || !f.content) continue;
      const kind = f.path.endsWith(".css") ? "style" : "component";
      files[f.path] = f.content;
      await saveFile({ path: f.path, kind, content: f.content });
    }

    if (!files["src/styles.css"]) {
      files["src/styles.css"] = defaultStylesCss(brandKit);
      await saveFile({ path: "src/styles.css", kind: "style", content: files["src/styles.css"] });
    }
    activity(`Foundation ready — ${Object.keys(files).length} files`);

    // 3b. Screens in parallel
    const buildLimit = pLimit(3);
    await Promise.all(
      screenSpecs.map(({ screen, doc }) =>
        buildLimit(async () => {
          activity(`Coding screen: ${screen.name}`);
          try {
            const scSysPrompt = screenCodeSystemPrompt();
            const scUserPromptText = screenCodeUserPrompt(briefDoc, designSystemDoc, doc, codeKb, screen.name, sitemap.components);
            const result = await withRetry(
              () =>
                chatJSON<{ files: Array<{ path: string; content: string }> }>(
                  [
                    { role: "system", content: scSysPrompt },
                    { role: "user", content: scUserPromptText },
                  ],
                  { model: "code", temperature: 0.4, maxTokens: 10000 },
                ),
              `screen-code-${screen.name}`,
            );
            trackCost(MODELS.code, scSysPrompt.length + scUserPromptText.length, JSON.stringify(result).length);
            for (const f of result.files ?? []) {
              if (!f.path || !f.content) continue;
              const canonical = `src/screens/${screen.name}.jsx`;
              files[canonical] = f.content;
              await saveFile({ path: canonical, kind: "screen", content: f.content });
            }
            activity(`Coded ${screen.name}`);
          } catch (err) {
            activity(`Coding ${screen.name} failed — will attempt repair in verify`);
            console.error(`[pastel-agent] screen code ${screen.name} failed:`, err instanceof Error ? err.message : err);
          }
        }),
      ),
    );
    await setPhase("build", "done");

    // ── Phase 4: Verify + fix loop (sandbox) ──────────────────────────
    await setPhase("verify", "running");
    activity("Verifying the build in the sandbox");

    let verify = await verifyProject(files);
    let round = 0;
    const MAX_FIX_ROUNDS = 3;

    while (!verify.ok && round < MAX_FIX_ROUNDS) {
      round++;
      const errorSummary = summarizeErrors(verify.errors);
      activity(`Found ${verify.errors.length} issue${verify.errors.length === 1 ? "" : "s"} — fix round ${round}/${MAX_FIX_ROUNDS}: ${errorSummary}`);

      try {
        const fixSysPromptText = fixSystemPrompt();
        const fixUserPromptText = fixUserPrompt(verify.errors, files, codeKb);
        const fixResult = await chatJSON<{ files: Array<{ path: string; content: string }> }>(
          [
            { role: "system", content: fixSysPromptText },
            { role: "user", content: fixUserPromptText },
          ],
          { model: "code", temperature: 0.2, maxTokens: 12000 },
        );
        trackCost(MODELS.code, fixSysPromptText.length + fixUserPromptText.length, JSON.stringify(fixResult).length);

        let fixedAny = false;
        for (const f of fixResult.files ?? []) {
          if (!f.path || !f.content) continue;
          const kind = f.path.includes("/screens/") ? "screen" : f.path.endsWith(".css") ? "style" : "component";
          files[f.path] = f.content;
          await saveFile({ path: f.path, kind, content: f.content });
          fixedAny = true;
        }
        if (!fixedAny) break;

        verify = await verifyProject(files);
        if (verify.ok) {
          activity(`All screens verified after fix round ${round}`);
        }
      } catch (err) {
        activity(`Fix round ${round} failed: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
    }

    // Persist compiled bundles for the preview route
    const builtScreens: string[] = [];
    for (const [screenName, js] of Object.entries(verify.bundles)) {
      if (!js) continue;
      builtScreens.push(screenName);
      await persistFile(runId, { path: `.build/${screenName}.js`, kind: "build", content: js });
    }

    const failedScreens = verify.ok
      ? []
      : [...new Set(verify.errors.map((e) => e.file).filter((f): f is string => !!f && f.includes("/screens/")))].map(screenNameFromPath);

    if (verify.ok) {
      activity("Build verified — every screen compiles and renders");
    } else {
      activity(`Verified with warnings — ${failedScreens.length} screen(s) still have issues`);
      console.error("[pastel-agent] residual sandbox errors:", JSON.stringify(verify.errors.slice(0, 10)));
    }
    await setPhase("verify", verify.ok ? "done" : "error");

    // ── Phase 5: Present ──────────────────────────────────────────────
    await setPhase("present", "running");

    const state = await mergeManifest(runId, {});
    const docPaths = state.docs ?? [];
    const manifest: AgentManifest = {
      screens: builtScreens.length > 0 ? builtScreens : listScreens(files).map(screenNameFromPath),
      docs: docPaths,
      brandKit: brandKit ?? null,
      phases: { brief: "done", plan: "done", build: "done", verify: verify.ok ? "done" : "error", present: "done" },
      failedScreens,
    };
    await updateRun(runId, {
      status: "done",
      phase: "present",
      manifest: manifest as unknown as Record<string, unknown>,
    });

    await titlePromise.catch(() => {});

    emit({
      type: "done",
      result: {
        screens: manifest.screens,
        docs: docPaths,
        brandKit,
        failedScreens,
      },
    });
    activity("Design ready");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pastel-agent] run failed:", message);
    await updateRun(runId, { status: "error", error: message });
    emit({ type: "error", message });
  }

  // ── Settle the credit hold ─────────────────────────────────────────
  if (holdId && userId) {
    const actualCredits = totalUsedCredits();
    try {
      await creditService.releaseHold(holdId, actualCredits);
    } catch (err) {
      console.error("[pastel-agent] failed to release credit hold:", err);
    }
  }
}

function summarizeErrors(errors: SandboxError[]): string {
  const first = errors[0];
  if (!first) return "";
  const loc = first.file ? `${first.file}: ` : "";
  const msg = first.message.length > 80 ? first.message.slice(0, 80) + "…" : first.message;
  return `${loc}${msg}`;
}

function defaultStylesCss(brandKit: BrandKit | null): string {
  const colors = brandKit?.colors ?? {};
  const fonts = brandKit?.fonts ?? {};
  const sizes = brandKit?.sizes ?? {};
  const radius = brandKit?.radius ?? {};
  const lines = [
    ":root {",
    ...Object.entries(colors).map(([k, v]) => `  --color-${k}: ${v};`),
    ...Object.entries(fonts).map(([k, v]) => `  --font-${k}: "${v}", sans-serif;`),
    ...Object.entries(sizes).map(([k, v]) => `  --size-${k}: ${v};`),
    ...Object.entries(radius).map(([k, v]) => `  --radius-${k}: ${v};`),
    "}",
    "",
    "* { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { font-family: var(--font-body, sans-serif); background: var(--color-background, #fff); color: var(--color-text, #111); }",
  ];
  return lines.join("\n") + "\n";
}
