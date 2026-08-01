import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { componentSystemSystemPrompt, componentSystemUserPrompt } from "../prompts/component-system";
import {
  componentSystemPlanSchema,
  type ComponentContract,
  type ComponentSystemPlan,
  type ScreenPlan,
} from "../schemas/plan-schemas";
import { componentContractsToMarkdown, formatTokensForImplementer, layoutPlanToMarkdown } from "../codegen/markdown";
import { pathForComponent, toPascalCase } from "../codegen/derive";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 10 — Component system planning. Every reusable contract: variants,
 * sizes, states, accessibility, tokens, reuse targets. No styling, no code.
 */

export function fallbackComponentContract(name: string, usedBy: string[]): ComponentContract {
  return {
    name: toPascalCase(name),
    kind: "shared",
    purpose: `A reusable ${toPascalCase(name)} component shared across the product.`,
    props: [
      { name: "children", type: "ReactNode", default: "undefined", description: "Content rendered inside the component when applicable." },
      { name: "className", type: "string", default: '""', description: "Optional layout override for screen composition." },
    ],
    variants: [{ name: "default", description: "Standard presentation" }],
    states: ["hover"],
    tokens: ["color.surface", "color.text", "color.border", "radius.md", "size.body"],
    usedBy: usedBy.length > 0 ? usedBy : ["Home"],
  };
}

export function fallbackComponentSystem(screenPlan: ScreenPlan, specScreens: Array<{ name: string; components: string[] }>): ComponentSystemPlan {
  const names = new Set<string>();
  for (const screen of screenPlan.screens) for (const c of screen.requiredComponents) names.add(c);
  for (const screen of specScreens) for (const c of screen.components) names.add(toPascalCase(c));
  if (names.size === 0) for (const name of ["Navbar", "Button", "Card", "Footer"]) names.add(name);
  return {
    components: [...names].slice(0, MAX_COMPONENT_CONTRACTS).map((name) =>
      fallbackComponentContract(
        name,
        screenPlan.screens.filter((s) => s.requiredComponents.map(toPascalCase).includes(toPascalCase(name))).map((s) => s.name),
      ),
    ),
  };
}

/** Hard inventory cap — flagship discipline: tight systems, not sprawl. */
export const MAX_COMPONENT_CONTRACTS = 12;

/** Merge near-duplicate contracts (e.g. "Button" + "PrimaryButton") deterministically. */
function mergeNearDuplicates(components: ComponentContract[]): ComponentContract[] {
  const byName = new Map<string, ComponentContract>();
  for (const contract of components) {
    const lower = contract.name.toLowerCase();
    const existing = [...byName.values()].find(
      (other) =>
        other.kind === contract.kind &&
        (lower.endsWith(other.name.toLowerCase()) || other.name.toLowerCase().endsWith(lower)),
    );
    if (existing) {
      const keep = contract.name.length <= existing.name.length ? contract : existing;
      const drop = keep === contract ? existing : contract;
      const merged: ComponentContract = {
        ...keep,
        usedBy: [...new Set([...keep.usedBy, ...drop.usedBy])].slice(0, 8),
        variants: [...keep.variants, ...drop.variants.filter((v) => !keep.variants.some((k) => k.name === v.name))].slice(0, 6),
        props: keep.props,
      };
      byName.delete(existing.name);
      byName.set(merged.name, merged);
    } else {
      byName.set(contract.name, contract);
    }
  }
  return [...byName.values()];
}

/** Deterministic normalization: PascalCase names + guaranteed use sites + inventory discipline. */
function normalizeComponentSystem(plan: ComponentSystemPlan, screenPlan: ScreenPlan): ComponentSystemPlan {
  const seen = new Set<string>();
  let components: ComponentContract[] = [];
  for (const contract of plan.components) {
    const name = toPascalCase(contract.name);
    if (seen.has(name)) continue;
    seen.add(name);
    let usedBy = contract.usedBy.map(toPascalCase).filter(Boolean);
    if (usedBy.length === 0) {
      usedBy = screenPlan.screens.filter((s) => s.requiredComponents.map(toPascalCase).includes(name)).map((s) => s.name);
    }
    if (usedBy.length === 0) usedBy = [screenPlan.screens[0]?.name ?? "Home"];
    components.push({
      ...contract,
      name,
      ownerScreen: contract.kind === "screen" ? toPascalCase(contract.ownerScreen ?? usedBy[0]) : contract.ownerScreen ?? null,
      usedBy,
    });
  }
  // Screens must be able to satisfy their requiredComponents.
  const contracted = new Set(components.map((c) => c.name));
  const sharedHints = new Set(deriveSharedComponentsFromPlan(screenPlan));
  for (const hint of [...sharedHints]) {
    if (!contracted.has(hint)) {
      const usedBy = screenPlan.screens.filter((s) => s.requiredComponents.map(toPascalCase).includes(hint)).map((s) => s.name);
      components.push(fallbackComponentContract(hint, usedBy));
      contracted.add(hint);
    }
  }

  components = mergeNearDuplicates(components);

  // Inventory discipline: rank by screen demand and cap. Layout + shared
  // components required by the screen plan are never dropped.
  const demand = new Map<string, number>();
  for (const screen of screenPlan.screens) {
    for (const ref of screen.requiredComponents.map(toPascalCase)) {
      demand.set(ref, (demand.get(ref) ?? 0) + 1);
    }
  }
  const ranked = [...components].sort((a, b) => {
    const da = (demand.get(a.name) ?? 0) * 10 + (a.kind === "layout" ? 5 : 0);
    const db = (demand.get(b.name) ?? 0) * 10 + (b.kind === "layout" ? 5 : 0);
    return db - da;
  });
  components = ranked.slice(0, MAX_COMPONENT_CONTRACTS);
  return { ...plan, components };
}

function deriveSharedComponentsFromPlan(screenPlan: ScreenPlan): string[] {
  const usage = new Map<string, number>();
  for (const screen of screenPlan.screens) {
    for (const component of new Set(screen.requiredComponents.map(toPascalCase))) {
      usage.set(component, (usage.get(component) ?? 0) + 1);
    }
  }
  return [...usage.entries()].filter(([, count]) => count >= 2).map(([name]) => name);
}

export async function componentSystemStage(ctx: StageContext): Promise<ComponentSystemPlan> {
  ctx.activity("Specifying the component system");
  const ds = ctx.state.designSystem;
  const screenPlan = ctx.state.screenPlan;
  const spec = ctx.state.productSpec;
  if (!ds || !screenPlan || !spec) throw new Error("component-system stage requires designSystem, screenPlan and productSpec in state");

  let plan: ComponentSystemPlan;
  const sys = componentSystemSystemPrompt();
  const layoutText = ctx.state.layoutPlan ? layoutPlanToMarkdown(ctx.state.layoutPlan) : "No layout plan available.";
  const user = componentSystemUserPrompt(JSON.stringify(screenPlan), layoutText, formatTokensForImplementer(ds), ctx.styleDirection);
  try {
    plan = await chatJSON<ComponentSystemPlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "componentSystem", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.componentSystem, validate: (v) => componentSystemPlanSchema.parse(v) },
    );
    ctx.trackCost("componentSystem", MODELS.componentSystem, sys.length + user.length, JSON.stringify(plan).length);
  } catch (err) {
    console.warn("[pastel-agent] component system failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Component system completed with deterministic defaults");
    plan = fallbackComponentSystem(screenPlan, spec.screens);
  }

  plan = normalizeComponentSystem(plan, screenPlan);

  // Stage 10's artifact is persisted as the component half of the assembled
  // architecture (the composition stage completes it with screens).
  ctx.state.architecture = {
    fileTree: deriveFileTree(plan),
    components: plan.components,
    screens: [],
    hooks: plan.hooks ?? undefined,
    lib: plan.lib ?? undefined,
  };
  ctx.state.decisionLog = [
    ...ctx.state.decisionLog,
    `Component system: ${plan.components.length} components (${plan.components.filter((c) => c.kind === "shared").length} shared, ${plan.components.filter((c) => c.kind === "layout").length} layout, ${plan.components.filter((c) => c.kind === "screen").length} screen-local)`,
  ];
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/07-components.md",
    title: "Component Specifications",
    kind: "component-spec",
    content: componentContractsToMarkdown(plan.components),
  });
  ctx.activity(`Component system ready — ${plan.components.length} reusable contracts`);
  return plan;
}

function deriveFileTree(plan: ComponentSystemPlan): string[] {
  return [
    "src/styles.css",
    ...plan.components.map((c) => pathForComponent(c.name, c.kind, c.ownerScreen)),
  ];
}
