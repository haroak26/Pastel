import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { architectureSystemPrompt, architectureUserPrompt } from "../prompts/architecture";
import {
  architecturePlanSchema,
  type ArchitecturePlan,
  type ComponentContract,
  type ProductSpec,
  type ScreenBlueprint,
} from "../schemas/plan-schemas";
import { architectureKnowledge } from "../knowledge";
import {
  architectureToMarkdown,
  componentContractsToMarkdown,
  formatTokensForImplementer,
  screenBlueprintToMarkdown,
} from "../codegen/markdown";
import {
  deriveSharedComponents,
  normalizeComponentRef,
  screenDocPath,
  toPascalCase,
  validateArchitecture,
} from "../codegen/derive";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Architecture — one Terra call produces the complete component contract set
 * and a composition blueprint per screen. Screens are assembled from contract
 * components; nothing is rebuilt per screen.
 */

const BLUEPRINT_PATTERNS = [
  "Split Hero",
  "Full-Bleed Statement",
  "Alternating Rows",
  "Bento Grid",
  "Divider Row",
  "Stat Block",
  "Pull Quote",
  "Statement + Button",
] as const;

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

export function fallbackBlueprint(screen: ProductSpec["screens"][number], shared: string[]): ScreenBlueprint {
  const patterns: Record<number, (typeof BLUEPRINT_PATTERNS)[number]> = { 0: "Split Hero", 1: "Stat Block" };
  return {
    name: screen.name,
    sections: screen.sections.slice(0, 8).map((section, index) => ({
      name: section.name,
      pattern: patterns[index] ?? (index === screen.sections.length - 1 ? "Statement + Button" : "Alternating Rows"),
      components: index === 0 ? shared.filter((c) => /nav|header/i.test(c)).slice(0, 1) : [],
      copy: [index === 0 ? screen.purpose : `${section.name} — ${section.purpose}`],
      notes: section.purpose,
    })),
    responsive: {
      tablet: "768px: reduce gutters and stack multi-column content.",
      mobile: "375px: single column, primary actions remain visible.",
    },
  };
}

export function fallbackArchitecture(spec: ProductSpec): ArchitecturePlan {
  const shared = deriveSharedComponents(spec);
  const screens = spec.screens.map((screen) => fallbackBlueprint(screen, shared));
  return {
    fileTree: [
      "src/styles.css",
      ...spec.screens.map((s) => `src/screens/${s.name}.jsx`),
      ...shared.map((c) => `src/components/${c}.jsx`),
    ],
    components: shared.map((name) =>
      fallbackComponentContract(
        name,
        spec.screens.filter((s) => s.components.map(toPascalCase).includes(name)).map((s) => s.name),
      ),
    ),
    screens,
  };
}

/** Deterministic normalization + merge with spec coverage guarantees. */
function normalizeArchitecture(plan: ArchitecturePlan, spec: ProductSpec): ArchitecturePlan {
  const planScreens = new Set(plan.screens.map((screen) => screen.name));
  const shared = deriveSharedComponents(spec);
  const screens: ScreenBlueprint[] = spec.screens.map((specScreen) => {
    const found = plan.screens.find((s) => s.name === specScreen.name);
    if (!found) return fallbackBlueprint(specScreen, shared);
    return {
      ...found,
      sections: found.sections.map((section) => ({
        ...section,
        components: section.components.map(normalizeComponentRef),
      })),
    };
  });
  for (const extra of [...planScreens]) {
    if (!spec.screens.some((s) => s.name === extra)) {
      // Blueprints for screens outside the spec are dropped — scope discipline.
    }
  }
  return { ...plan, screens };
}

export async function architectureStage(ctx: StageContext): Promise<ArchitecturePlan> {
  ctx.activity("Planning the React architecture");

  const spec = ctx.state.productSpec;
  const ds = ctx.state.designSystem;
  if (!spec || !ds) throw new Error("architecture stage requires productSpec and designSystem in state");

  let plan: ArchitecturePlan;
  const sys = architectureSystemPrompt();
  const user = architectureUserPrompt(JSON.stringify(spec), formatTokensForImplementer(ds), ctx.styleDirection, architectureKnowledge());
  try {
    const result = await chatJSON<ArchitecturePlan>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "architecture",
        temperature: 0.4,
        maxTokens: MAX_TOKENS_PER_CALL.architecture,
        validate: (v) => {
          const parsed = architecturePlanSchema.parse(v);
          const issues = validateArchitecture(parsed, spec);
          if (issues.length > 0) {
            throw new Error(`architecture plan failed structural validation: ${issues.map((i) => i.message).join("; ")}`);
          }
          return parsed;
        },
      },
    );
    plan = result;
    ctx.trackCost("architecture", MODELS.architecture, sys.length + user.length, JSON.stringify(result).length);
  } catch (err) {
    console.warn("[pastel-agent] architecture failed, using deterministic fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Architecture completed with deterministic defaults");
    plan = fallbackArchitecture(spec);
  }

  plan = normalizeArchitecture(plan, spec);
  ctx.state.architecture = plan;
  ctx.state.decisionLog = [
    ...ctx.state.decisionLog,
    `Architecture: ${plan.components.length} components (${plan.components.filter((c) => c.kind === "shared").length} shared, ${plan.components.filter((c) => c.kind === "layout").length} layout, ${plan.components.filter((c) => c.kind === "screen").length} screen-local) for ${plan.screens.length} screens`,
  ];
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/02-architecture.md",
    title: "Architecture Plan",
    kind: "system",
    content: architectureToMarkdown(plan),
  });
  await ctx.saveDoc({
    path: "docs/02-components.md",
    title: "Component Specifications",
    kind: "component-spec",
    content: componentContractsToMarkdown(plan.components),
  });
  // Screen docs land early — the client lists screens from these paths.
  await Promise.all(
    plan.screens.map((blueprint) =>
      ctx.saveDoc({
        path: screenDocPath(blueprint.name),
        title: `${blueprint.name} Screen Spec`,
        kind: "screen-spec",
        content: screenBlueprintToMarkdown(blueprint, spec.screens.find((s) => s.name === blueprint.name)),
      }),
    ),
  );
  ctx.activity(`Architecture ready — ${plan.components.length} components, ${plan.screens.length} blueprints`);
  return plan;
}
