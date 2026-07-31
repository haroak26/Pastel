import pLimit from "p-limit";
import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import {
  componentCodeSystemPrompt,
  componentCodeUserPrompt,
  screenCodeSystemPrompt,
  screenCodeUserPrompt,
} from "../prompts/implement";
import { repairArtifact } from "./repair";
import {
  generatedFilesSchema,
  type ComponentContract,
} from "../schemas/plan-schemas";
import { designTokensToCss } from "../codegen/styles";
import {
  contractsRequiredByScreen,
  pathForComponent,
  relativeImport,
  screenSourcePath,
  toPascalCase,
} from "../codegen/derive";
import {
  formatContractForImplementer,
  formatImportContract,
  formatTokensForImplementer,
} from "../codegen/markdown";
import {
  lintComponentContract,
  lintScreenAgainstRegistry,
  type LintIssue,
} from "../codegen/lint";
import { scanAntiSlop, hasHighSeveritySlop } from "../codegen/anti-slop";
import { implementerKnowledge } from "../knowledge";
import { reusableComponent, upsertRegistryComponent } from "../registry";
import { verifyScreens } from "../sandbox";
import { persistFile } from "../run-store";
import type { StageContext } from "./context";

/**
 * Implementation — Luna generates independent, reusable components and
 * composes screens from them. styles.css is pure codegen (zero model calls).
 * Registry-validated components are reused instead of regenerated.
 */

function highIssues(issues: LintIssue[]): LintIssue[] {
  return issues.filter((i) => i.severity === "high");
}

/** Deterministic fallback component source (proven v1 template, contract-aware). */
function fallbackComponentSource(contract: ComponentContract): string {
  const name = toPascalCase(contract.name);
  const isInteractive = /button|input|link|tab|toggle|select/i.test(name) || contract.states.length > 0;
  const tag = /button/i.test(name) ? "button" : /input/i.test(name) ? "input" : "div";
  if (tag === "input") {
    return `export default function ${name}({ value = "", placeholder = "", onChange }) {
  return <input value={value} placeholder={placeholder} onChange={onChange} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--size-body)] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]" />;
}\n`;
  }
  return `export default function ${name}({ children, label, className = "", onClick }) {
  const content = children ?? label ?? "${name}";
  return <${tag} onClick={onClick} className={"inline-flex items-center justify-center ${isInteractive ? "cursor-pointer" : ""} rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--size-body)] text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] " + className}>{content}</${tag}>;
}\n`;
}

async function implementComponent(ctx: StageContext, contract: ComponentContract): Promise<void> {
  const name = toPascalCase(contract.name);
  const path = pathForComponent(name, contract.kind, contract.ownerScreen);
  const kind: "shared" | "layout" | "screen" = contract.kind;

  // Registry reuse — validated components are never regenerated.
  if (ctx.projectId) {
    const reused = reusableComponent(ctx.registry, { ...contract, name });
    if (reused) {
      ctx.registryStats.reused++;
      ctx.files[path] = reused.source;
      await ctx.saveFile({ path, kind: "component", content: reused.source });
      ctx.activity(`Reused validated component: ${name}`);
      return;
    }
  }

  let content = "";
  let status: "validated" | "fallback" = "validated";
  const sys = componentCodeSystemPrompt();
  const user = componentCodeUserPrompt(
    formatContractForImplementer({ ...contract, name }, path),
    formatTokensForImplementer(ctx.state.designSystem!),
    implementerKnowledge(),
    ctx.styleDirection,
  );
  try {
    const result = await chatJSON<{ files: Array<{ path: string; content: string }> }>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "component", temperature: 0.3, maxTokens: MAX_TOKENS_PER_CALL.component, validate: (v) => generatedFilesSchema.parse(v) },
    );
    ctx.trackCost("component", MODELS.component, sys.length + user.length, JSON.stringify(result).length);
    const file = result.files.find((f) => f.path === path) ?? result.files.find((f) => f.path.endsWith(`/${name}.jsx`));
    if (!file?.content) throw new Error(`component model did not return ${path}`);
    content = file.content;
    ctx.registryStats.generated++;
  } catch (err) {
    console.warn(`[pastel-agent] component generation failed for ${name}:`, err instanceof Error ? err.message : err);
  }

  if (content) {
    // Immediate per-artifact validation, then ONE surgical repair if needed.
    let issues = highIssues([
      ...lintComponentContract(path, content, name),
      ...scanAntiSlop(content, ctx.seed.name).filter((v) => v.severity === "high").map((v) => ({ path, message: v.message, severity: "high" as const })),
    ]);
    if (issues.length > 0) {
      const fixed = await repairArtifact(ctx, path, content, issues, formatContractForImplementer({ ...contract, name }, path));
      if (fixed) {
        issues = highIssues(lintComponentContract(path, fixed, name));
        if (issues.length === 0) content = fixed;
      }
    }
    if (highIssues(lintComponentContract(path, content, name)).length > 0) {
      console.warn(`[pastel-agent] component ${name} still failing lint — using deterministic fallback`);
      content = "";
    }
  }

  if (!content) {
    content = fallbackComponentSource({ ...contract, name });
    status = "fallback";
    ctx.registryStats.fallback++;
    ctx.activity(`${name} fell back to a safe component stub`);
  }

  ctx.files[path] = content;
  await ctx.saveFile({ path, kind: "component", content });
  if (ctx.projectId) {
    await upsertRegistryComponent(ctx.projectId, { name, kind, contract: { ...contract, name }, source: content, status });
  }
}

async function implementScreen(ctx: StageContext, screenName: string): Promise<void> {
  const plan = ctx.state.architecture!;
  const ds = ctx.state.designSystem!;
  const blueprint = plan.screens.find((s) => s.name === screenName);
  if (!blueprint) return;
  const path = screenSourcePath(screenName);

  const requiredContracts = contractsRequiredByScreen(plan, screenName);
  const importContracts = requiredContracts
    .map((contract) => {
      const canonical = pathForComponent(contract.name, contract.kind, contract.ownerScreen);
      return formatImportContract(contract, relativeImport(path, canonical), canonical);
    })
    .join("\n");

  ctx.activity(`Composing screen: ${screenName}`);
  let content = "";
  const sys = screenCodeSystemPrompt();
  const user = screenCodeUserPrompt(
    screenName,
    JSON.stringify(blueprint, null, 2),
    importContracts,
    formatTokensForImplementer(ds),
    implementerKnowledge(),
    ctx.styleDirection,
  );
  try {
    const result = await chatJSON<{ files: Array<{ path: string; content: string }> }>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "screen", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.screen, validate: (v) => generatedFilesSchema.parse(v) },
    );
    ctx.trackCost("screen", MODELS.screen, sys.length + user.length, JSON.stringify(result).length);
    const file = result.files.find((f) => f.path === path) ?? result.files.find((f) => f.path.endsWith(`/${screenName}.jsx`));
    if (!file?.content) throw new Error(`screen model did not return ${path}`);
    content = file.content;
  } catch (err) {
    ctx.activity(`Composing ${screenName} failed — the verify stage will repair it`);
    console.warn(`[pastel-agent] screen generation failed for ${screenName}:`, err instanceof Error ? err.message : err);
    return;
  }

  if (content) {
    let issues = highIssues([
      ...lintScreenAgainstRegistry(screenName, content, plan),
      ...scanAntiSlop(content, ctx.seed.name).filter((v) => v.severity === "high").map((v) => ({ path, message: `Design: ${v.message}`, severity: "high" as const })),
    ]);
    if (issues.length > 0) {
      const fixed = await repairArtifact(ctx, path, content, issues, `SCREEN BLUEPRINT:\n${JSON.stringify(blueprint)}`);
      if (fixed && highIssues(lintScreenAgainstRegistry(screenName, fixed, plan)).length === 0) {
        content = fixed;
      }
    }
  }

  ctx.files[path] = content;
  await ctx.saveFile({ path, kind: "screen", content });

  // Progressive verification: bundle + smoke-render this screen immediately
  // so its preview exists while remaining screens are still composing.
  try {
    const result = await verifyScreens(ctx.files, [path]);
    if (result.ok && result.bundles[screenName]) {
      ctx.builtScreens.push(screenName);
      await persistFile(ctx.runId, { path: `.build/${screenName}.js`, kind: "build", content: result.bundles[screenName] });
      ctx.activity(`Screen verified — ${screenName} is ready to preview`);
    } else {
      ctx.activity(`Screen ${screenName} queued for verification in the verify stage`);
    }
  } catch (err) {
    console.warn(`[pastel-agent] progressive verify failed for ${screenName}:`, err instanceof Error ? err.message : err);
  }
}

export async function implementStage(ctx: StageContext, opts: { screens?: string[]; components?: string[] } = {}): Promise<void> {
  const plan = ctx.state.architecture;
  const ds = ctx.state.designSystem;
  if (!plan || !ds) throw new Error("implement stage requires designSystem and architecture in state");

  // 1. styles.css — 100% deterministic from tokens (zero model calls).
  ctx.activity("Building shared design tokens");
  ctx.files["src/styles.css"] = designTokensToCss(ds);
  await ctx.saveFile({ path: "src/styles.css", kind: "style", content: ctx.files["src/styles.css"] });

  // 2. Components — hard barrier before screens. Layouts first, then shared,
  //    then screen-local (concurrency 3).
  const limit = pLimit(3);
  const ordered = [
    ...plan.components.filter((c) => c.kind === "layout"),
    ...plan.components.filter((c) => c.kind === "shared"),
    ...plan.components.filter((c) => c.kind === "screen"),
  ].filter((contract) => !opts.components || opts.components.includes(contract.name));
  await Promise.all(ordered.map((contract) => limit(() => implementComponent(ctx, contract))));
  ctx.activity(`Component library ready — ${ordered.length} components (${ctx.registryStats.reused} reused from the registry)`);

  // 3. Screens — composed from validated components (concurrency 3).
  const screensToBuild = plan.screens.filter((blueprint) => !opts.screens || opts.screens.includes(blueprint.name));
  await Promise.all(screensToBuild.map((blueprint) => limit(() => implementScreen(ctx, blueprint.name))));

  // Ensure the registry cache reflects anything written this run.
  if (ctx.projectId) {
    for (const contract of plan.components) {
      const existing = ctx.registry.find((entry) => entry.name === toPascalCase(contract.name));
      const path = pathForComponent(contract.name, contract.kind, contract.ownerScreen);
      if (ctx.files[path] && (!existing || existing.source !== ctx.files[path])) {
        ctx.registry = ctx.registry.filter((entry) => entry.name !== toPascalCase(contract.name));
        ctx.registry.push({
          name: toPascalCase(contract.name),
          kind: contract.kind,
          ownerScreen: contract.ownerScreen ?? null,
          contract: { ...contract, name: toPascalCase(contract.name) },
          source: ctx.files[path],
          sourceHash: "",
          version: (existing?.version ?? 0) + 1,
          status: "validated",
        });
      }
    }
  }
}
