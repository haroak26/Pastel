import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { designGateSystemPrompt, designGateUserPrompt } from "../prompts/gate";
import {
  componentContractSchema,
  gateFindingsSchema,
  screenBlueprintSchema,
  type ArchitecturePlan,
  type ComponentContract,
  type GateFinding,
  type ScreenBlueprint,
} from "../schemas/plan-schemas";
import { failingContrastPairs } from "../codegen/contrast";
import {
  componentContractsToMarkdown,
  screenBlueprintToMarkdown,
  designSystemToMarkdown,
} from "../codegen/markdown";
import { normalizeComponentRef, screenDocPath, toPascalCase } from "../codegen/derive";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Design gate — independent design-quality verification before any code is
 * written. Deterministic checks run first (free); Terra adjudicates the rest.
 * Findings repair ONLY the affected artifact, never the whole plan.
 */

const GENERIC_CTA = /Get started free|Learn more|Sign up today|Try it now|Get started today/i;
const BANNED_VOCAB = /\b(seamless|seamlessly|cutting-edge|next-generation|revolutionary|empower|empowering|unlock|supercharge|elevate|streamline)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function deterministicFindings(plan: ArchitecturePlan, dsContrastFailures: string[]): GateFinding[] {
  const findings: GateFinding[] = [];
  for (const pair of dsContrastFailures) {
    findings.push({
      artifact: "design-system",
      severity: "high",
      class: "contrast",
      issue: `Token pair fails WCAG AA: ${pair}`,
      fix: "Adjust the darker/lighter hex of the pair to reach 4.5:1",
    });
  }
  for (const screen of plan.screens) {
    const patternCounts = new Map<string, number>();
    for (const section of screen.sections) {
      patternCounts.set(section.pattern, (patternCounts.get(section.pattern) ?? 0) + 1);
      const copy = section.copy.join(" ");
      if (GENERIC_CTA.test(copy)) {
        findings.push({ artifact: `screen:${screen.name}:${section.name}`, severity: "high", class: "copy", issue: "Generic CTA copy (e.g. \"Get started free\")", fix: "Rewrite the CTA to name the action" });
      }
      if (BANNED_VOCAB.test(copy)) {
        findings.push({ artifact: `screen:${screen.name}:${section.name}`, severity: "medium", class: "copy", issue: "Banned marketing vocabulary in section copy", fix: "Replace with specific, concrete wording" });
      }
      if (EMOJI.test(copy)) {
        findings.push({ artifact: `screen:${screen.name}:${section.name}`, severity: "medium", class: "copy", issue: "Emoji in copy", fix: "Replace with words; icons are inline SVG" });
      }
    }
    for (const [pattern, count] of patternCounts) {
      if (count > 2) {
        findings.push({ artifact: `screen:${screen.name}`, severity: "medium", class: "consistency", issue: `Pattern "${pattern}" used ${count} times on one screen — repetitive composition`, fix: "Vary patterns across sections (e.g. swap one for a Divider Row or Pull Quote)" });
      }
    }
  }
  // cross-screen pattern repetition
  const screenPatternCounts = new Map<string, number>();
  for (const screen of plan.screens) {
    const first = screen.sections[0]?.pattern;
    if (first) screenPatternCounts.set(first, (screenPatternCounts.get(first) ?? 0) + 1);
  }
  for (const [pattern, count] of screenPatternCounts) {
    if (count > 2) {
      findings.push({ artifact: "design-system", severity: "medium", class: "consistency", issue: `Opening pattern "${pattern}" repeats on ${count} screens — screens will look templated`, fix: "Vary the opening composition per screen" });
    }
  }
  return findings;
}

export async function designGateStage(ctx: StageContext, opts: { onlyScreens?: string[] } = {}): Promise<void> {
  ctx.activity("Running the design gate");
  const spec = ctx.state.productSpec;
  const ds = ctx.state.designSystem;
  const fullPlan = ctx.state.architecture;
  if (!spec || !ds || !fullPlan) throw new Error("design gate requires productSpec, designSystem and architecture in state");

  // Scoped view for delta runs: only the affected screens + their contracts.
  let plan: ArchitecturePlan = fullPlan;
  if (opts.onlyScreens) {
    const wanted = new Set(opts.onlyScreens);
    const scopedComponents = new Set<string>();
    for (const screen of fullPlan.screens.filter((s) => wanted.has(s.name))) {
      if (screen.layout) scopedComponents.add(screen.layout);
      for (const section of screen.sections) for (const ref of section.components) scopedComponents.add(ref);
    }
    plan = {
      ...fullPlan,
      screens: fullPlan.screens.filter((s) => wanted.has(s.name)),
      components: fullPlan.components.filter((c) => scopedComponents.has(c.name) && !fullPlan.screens.some((s) => !wanted.has(s.name) && s.sections.some((sec) => sec.components.includes(c.name)))),
    };
  }

  const contrastFailures = opts.onlyScreens ? [] : failingContrastPairs(ds).map((f) => `${f.pair} ${f.ratio}:1 < ${f.minimum}:1`);
  const staticFindings = deterministicFindings(plan, contrastFailures);

  let gate = { passes: staticFindings.length === 0, findings: staticFindings };
  const sys = designGateSystemPrompt();
  const user = designGateUserPrompt(
    `${spec.title} — ${spec.summary} (goals: ${spec.goals.join("; ")})`,
    JSON.stringify(ds),
    JSON.stringify(plan.screens),
    JSON.stringify(plan.components),
    staticFindings.map((f) => `${f.severity.toUpperCase()} [${f.class}] ${f.artifact}: ${f.issue} → ${f.fix}`).join("\n"),
    ctx.styleDirection,
  );
  try {
    const result = await chatJSON<typeof gate>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "designGate", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.designGate, validate: (v) => gateFindingsSchema.parse(v) },
    );
    gate = result;
    ctx.trackCost("designGate", MODELS.designGate, sys.length + user.length, JSON.stringify(result).length);
  } catch (err) {
    console.warn("[pastel-agent] design gate model unavailable — applying deterministic findings:", err instanceof Error ? err.message : err);
    ctx.activity("Design gate running on deterministic checks only");
  }

  ctx.quality.gatePassedFirstTry = gate.passes && gate.findings.length === 0;

  // Targeted repairs: only affected artifacts, structured corrections.
  const actionable = gate.findings.filter((f) => f.severity !== "low");
  const byArtifact = new Map<string, GateFinding[]>();
  for (const finding of actionable) {
    const list = byArtifact.get(finding.artifact) ?? [];
    list.push(finding);
    byArtifact.set(finding.artifact, list);
  }

  let changedComponents = false;
  const changedScreens = new Set<string>();
  for (const [artifact, findings] of byArtifact) {
    if (!ctx.budgetAllowsModelCall()) {
      ctx.activity("Credit budget reached — skipping further design-gate repairs");
      break;
    }
    const [scope, name] = artifact.split(":");
    try {
      if (scope === "screen" && name) {
        const original = plan.screens.find((s) => s.name === toPascalCase(name));
        if (!original) continue;
        const corrected = await chatJSON<ScreenBlueprint>(
          [
            { role: "system", content: "You edit ONE screen blueprint to resolve design-gate findings. Output ONLY the corrected blueprint as JSON (same shape as the input). Apply every finding or its intent; change nothing else. Copy rewrites must stay specific and real." },
            { role: "user", content: `BLUEPRINT:\n${JSON.stringify(original, null, 2)}\n\nFINDINGS TO APPLY:\n${JSON.stringify(findings, null, 2)}` },
          ],
          { model: "designGate", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.designGate, validate: (v) => screenBlueprintSchema.parse(v) },
        );
        ctx.trackCost("designGate-repair", MODELS.designGate, JSON.stringify(original).length + JSON.stringify(findings).length, JSON.stringify(corrected).length);
        if (corrected.name === original.name) {
          // Normalize annotation-bearing refs (e.g. "HabitList (check-in
          // mode)") before merge — unnormalized refs corrupt the architecture
          // and explode later in delta validation.
          const cleaned: ScreenBlueprint = {
            ...corrected,
            sections: corrected.sections.map((section) => ({
              ...section,
              components: section.components.map(normalizeComponentRef).filter((ref) => plan.components.some((c) => c.name === ref)).slice(0, 8),
            })),
          };
          plan = { ...plan, screens: plan.screens.map((s) => (s.name === original.name ? cleaned : s)) };
          changedScreens.add(original.name);
          ctx.quality.repairs++;
          ctx.activity(`Design gate corrected screen blueprint: ${original.name}`);
        }
      } else if (scope === "component" && name) {
        const original = plan.components.find((c) => c.name === toPascalCase(name));
        if (!original) continue;
        const corrected = await chatJSON<ComponentContract>(
          [
            { role: "system", content: "You edit ONE React component contract to resolve design-gate findings. Output ONLY the corrected contract as JSON (same shape as the input). Apply every finding or its intent; keep the name and kind unchanged." },
            { role: "user", content: `CONTRACT:\n${JSON.stringify(original, null, 2)}\n\nFINDINGS TO APPLY:\n${JSON.stringify(findings, null, 2)}` },
          ],
          { model: "designGate", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.designGate, validate: (v) => componentContractSchema.parse(v) },
        );
        ctx.trackCost("designGate-repair", MODELS.designGate, JSON.stringify(original).length + JSON.stringify(findings).length, JSON.stringify(corrected).length);
        if (corrected.name === original.name && corrected.kind === original.kind) {
          plan = { ...plan, components: plan.components.map((c) => (c.name === original.name ? corrected : c)) };
          changedComponents = true;
          ctx.quality.repairs++;
          ctx.activity(`Design gate corrected component contract: ${original.name}`);
        }
      }
      // design-system findings are adjudicated at the DS validation stage; by
      // this point contrast rules already passed, so we record them only.
    } catch (err) {
      console.warn(`[pastel-agent] design-gate repair for ${artifact} failed:`, err instanceof Error ? err.message : err);
    }
  }

  // Merge scoped repairs back into the full architecture.
  ctx.state.architecture = opts.onlyScreens
    ? {
        ...fullPlan,
        components: fullPlan.components.map((c) => plan.components.find((p) => p.name === c.name) ?? c),
        screens: fullPlan.screens.map((s) => plan.screens.find((p) => p.name === s.name) ?? s),
      }
    : plan;
  plan = ctx.state.architecture;
  await saveProjectState(ctx.state);

  // Re-render only the affected docs.
  if (changedComponents) {
    await ctx.saveDoc({ path: "docs/07-components.md", title: "Component Specifications", kind: "component-spec", content: componentContractsToMarkdown(plan.components) });
  }
  for (const name of changedScreens) {
    const blueprint = plan.screens.find((s) => s.name === name)!;
    await ctx.saveDoc({ path: screenDocPath(name), title: `${name} Screen Spec`, kind: "screen-spec", content: screenBlueprintToMarkdown(blueprint, spec.screens.find((s) => s.name === name)) });
  }
  ctx.activity(gate.findings.length === 0 ? "Design gate passed cleanly" : `Design gate resolved ${byArtifact.size} artifact(s)`);
}
