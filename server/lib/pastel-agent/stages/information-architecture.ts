import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { iaSystemPrompt, iaUserPrompt } from "../prompts/ia";
import { informationArchitectureSchema, type InformationArchitecture, type ProductSpec } from "../schemas/plan-schemas";
import { informationArchitectureToMarkdown } from "../codegen/markdown";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 6 — Information architecture. Organises the application structurally:
 * navigation, hierarchy, grouping, content priority. Never visual.
 */

export function fallbackInformationArchitecture(spec: ProductSpec): InformationArchitecture {
  const names = spec.screens.map((s) => s.name);
  const appLike = /dashboard|admin|saas|analytics|crm|billing|settings/i.test(spec.title + spec.summary);
  return {
    navigation: {
      type: appLike ? "sidebar" : "topbar",
      items: names.map((name) => ({ label: name.replace(/([a-z])([A-Z])/g, "$1 $2"), screen: name })),
    },
    groups: spec.screens.length >= 5 ? [{ name: "Product", screens: names.slice(0, -1) }] : [],
    entryScreen: names[0],
    contentPriority: spec.screens.map((screen) => ({
      screen: screen.name,
      priority: [screen.userGoal, ...screen.sections.slice(0, 2).map((s) => s.purpose)],
    })),
  };
}

export async function informationArchitectureStage(ctx: StageContext): Promise<InformationArchitecture> {
  ctx.activity("Organising the information architecture");
  const brief = ctx.state.creativeBrief;
  const spec = ctx.state.productSpec;
  if (!brief || !spec) throw new Error("ia stage requires creativeBrief and productSpec in state");

  const screenNames = JSON.stringify(spec.screens.map((s) => ({ id: s.id, name: s.name, purpose: s.purpose })));
  let ia: InformationArchitecture;
  const sys = iaSystemPrompt();
  const user = iaUserPrompt(JSON.stringify(brief), JSON.stringify(spec), screenNames);
  try {
    ia = await chatJSON<InformationArchitecture>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      {
        model: "ia",
        temperature: 0.3,
        maxTokens: MAX_TOKENS_PER_CALL.ia,
        validate: (v) => {
          const parsed = informationArchitectureSchema.parse(v);
          const known = new Set(spec.screens.map((s) => s.name));
          const referenced = new Set([parsed.entryScreen, ...parsed.navigation.items.flatMap((i) => [i.screen, ...(i.children ?? []).map((c) => c.screen)]), ...parsed.contentPriority.map((c) => c.screen)]);
          const unknown = [...referenced].filter((name) => !known.has(name));
          if (unknown.length > 0) throw new Error(`information architecture references unknown screens: ${unknown.join(", ")}`);
          const covered = new Set(parsed.navigation.items.map((i) => i.screen));
          const missing = spec.screens.filter((s) => !covered.has(s.name));
          if (missing.length > 0) throw new Error(`navigation does not cover screens: ${missing.map((s) => s.name).join(", ")}`);
          return parsed;
        },
      },
    );
    ctx.trackCost("ia", MODELS.ia, sys.length + user.length, JSON.stringify(ia).length);
  } catch (err) {
    console.warn("[pastel-agent] information architecture failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Information architecture completed with deterministic defaults");
    ia = fallbackInformationArchitecture(spec);
  }

  ctx.state.informationArchitecture = ia;
  await saveProjectState(ctx.state);

  await ctx.saveDoc({
    path: "docs/04-architecture.md",
    title: "Information Architecture",
    kind: "system",
    content: informationArchitectureToMarkdown(ia),
  });
  return ia;
}
