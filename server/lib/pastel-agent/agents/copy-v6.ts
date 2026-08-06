import { chatJSON, MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import { copyPlanSchema, type CopyPlan, type ProductBrief, type WireframePlan, type ResolvedTheme } from "../schemas-v6";
import { mockDataset, datasetPrompt, normalizeUnit, type MockDataset } from "../lib/content";

/**
 * V6 Copy agent — writes the product's copy (headlines, CTAs, empty states)
 * for the assembled screens, voiced in the company's style. Bounded schema;
 * deterministic domain-aware template fallback.
 *
 * v7: the copy plan now drives EVERY recipe slot (stat labels, chart
 * titles/units, table titles, detail fields, settings sections, slogans,
 * search placeholders) so no SaaS framing can leak into the screens. The
 * dataset summary is included so labels match the domain data.
 *
 * v8: `sanitizeCopyPlan` makes label/unit coherence impossible to break:
 * statLabels must line up with the domain metrics 1:1 (count AND unit), and
 * chartTitle/chartUnit must reference an existing series. On any mismatch the
 * offending fields are dropped and the composer falls back to the domain's
 * own labels — the "Best 5K 18.2 km" / "Weekly distance on kcal data" class
 * of bug can no longer reach a screen.
 */

export interface CopyInput {
  brief: ProductBrief;
  wireframe: WireframePlan;
  theme: ResolvedTheme;
  /** Shared domain dataset (also used by the composer). */
  data: MockDataset;
  onUsage?: OnUsage;
}

/**
 * Deterministic label/unit sanitizer — run against BOTH model and fallback
 * copy plans. Drops any statLabels that do not match the domain metrics
 * (count + normalized units), and drops chart fields that reference no
 * existing series. Returns the plan plus which screens were corrected.
 */
export function sanitizeCopyPlan(plan: CopyPlan, data: MockDataset): { plan: CopyPlan; corrected: string[] } {
  const corrected: string[] = [];
  const metricUnits = data.metrics.map((m) => normalizeUnit(m.unit));

  for (const screen of plan.screens) {
    // Stat labels: must be 1:1 with the metrics and carry the metric's unit.
    if (screen.statLabels) {
      const bad =
        screen.statLabels.length !== data.metrics.length ||
        screen.statLabels.some(
          (l, i) => l.unit !== undefined && normalizeUnit(l.unit) !== (metricUnits[i] ?? ""),
        );
      if (bad) {
        delete screen.statLabels;
        corrected.push(screen.screenId);
      }
    }

    // Chart fields: title and unit must reference the SAME existing series
    // (a "Weekly distance" title over kcal data is the v7 issue #3 class).
    if (screen.chartUnit !== undefined || screen.chartTitle !== undefined) {
      const labelMatch = (seriesLabel: string, title?: string): boolean =>
        title !== undefined && title !== "" &&
        (seriesLabel.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(seriesLabel.toLowerCase()));
      const byUnit = screen.chartUnit !== undefined && screen.chartUnit !== ""
        ? data.series.find((s) => normalizeUnit(s.unit) === normalizeUnit(screen.chartUnit))
        : undefined;
      const byTitle = screen.chartTitle !== undefined
        ? data.series.find((s) => labelMatch(s.label, screen.chartTitle))
        : undefined;
      const series = byUnit ?? byTitle;
      if (!series) {
        delete screen.chartUnit;
        delete screen.chartTitle;
        delete screen.chartSubtitle;
        corrected.push(screen.screenId);
      } else {
        if (screen.chartUnit !== undefined && normalizeUnit(screen.chartUnit) !== normalizeUnit(series.unit)) {
          delete screen.chartUnit;
          corrected.push(screen.screenId);
        }
        if (screen.chartTitle !== undefined && !labelMatch(series.label, screen.chartTitle)) {
          delete screen.chartTitle;
          delete screen.chartSubtitle;
          corrected.push(screen.screenId);
        }
      }
    }
  }

  return { plan, corrected };
}

export function fallbackCopy(brief: ProductBrief, wireframe: WireframePlan, data: MockDataset): CopyPlan {
  const title = brief.title;
  const metrics = data.metrics.map((m) => ({ label: m.label, unit: m.unit }));
  // Domain-aware default CTAs — the fallback must never shout "Get started"
  // on a product screen (v8: generic-CTAs bug).
  const DOMAIN_CTA: Record<string, { primary: string; secondary: string }> = {
    fitness: { primary: "Start training", secondary: "View plans" },
    ecommerce: { primary: "Shop now", secondary: "Explore" },
    finance: { primary: "Open account", secondary: "Compare plans" },
    media: { primary: "Start listening", secondary: "Browse" },
    social: { primary: "Join in", secondary: "Discover" },
    productivity: { primary: "Create your first", secondary: "Learn more" },
    travel: { primary: "Plan a trip", secondary: "Explore stays" },
  };
  const cta = DOMAIN_CTA[data.domain] ?? { primary: "Get started", secondary: "Learn more" };
  const fitness = data.domain === "fitness";
  return {
    productTitle: title,
    tagline: brief.description.slice(0, 120),
    screens: wireframe.screens.map((s) => ({
      screenId: s.id,
      headline: fitness ? (s.id === "home" ? "Train with your AI coach" : "Build better reps") : (s.title === "Landing" ? title : `${title} · ${s.title}`).slice(0, 60) || title,
      overline: fitness ? (s.id === "home" ? "Wednesday plan" : "Guided exercise") : brief.productType,
      description: fitness ? (s.id === "home" ? "A focused session built from your recovery, goals, and form history." : "Clear targets and form cues for the next movement in your plan.") : s.purpose.slice(0, 160),
      primaryCta: fitness ? "Start workout" : cta.primary,
      secondaryCta: fitness ? "Message coach" : cta.secondary,
      tableColumns: data.rows.length > 0 ? ["Name", "Detail", data.rows[0].amount.startsWith("$") ? "Amount" : "Value", "Status", "Date"] : ["Name", "Detail", "Value", "Status", "Date"],
      emptyTitle: data.emptyTitle,
      emptyBody: data.emptyBody,
      statLabels: metrics,
      chartTitle: data.series[0]?.label,
      chartSubtitle: data.series[0]?.label,
      chartUnit: data.series[0]?.unit ?? "",
      detailFields: data.detailFields,
      settingsSections: data.settingsSections,
      slogan: s.title.split(" ")[0].toUpperCase().slice(0, 8),
      searchPlaceholder: data.searchPlaceholder,
    })),
  };
}

export async function runCopy(input: CopyInput): Promise<CopyPlan> {
  const screensBlock = input.wireframe.screens
    .map((s) => `- ${s.id} (${s.archetype}): ${s.purpose}`)
    .join("\n");

  const system = `You are a senior product copywriter. Write specific, human, honest copy for a product's UI in the voice of the company design language provided.

NEVER write AI-slop copy: no "Enterprise-grade security", no "Unlock your potential", no exclamation-mark hype, no alliteration chains. Write like a real product team: specific, calm, useful.

For each screen provide:
- headline: what the user sees at the top (≤ 60 chars, specific)
- overline: a short kicker (≤ 40 chars)
- description: one or two plain sentences about what this screen is for
- primaryCta / secondaryCta: action labels (verb-first, ≤ 24 chars)
- tableColumns: 5-6 column labels for the data table (adapt to the product AND the provided data)
- tableTitle: short title for the data table section
- emptyTitle + emptyBody: what the user sees when there is no data yet (specific, calm)
- bullets: 3-5 short capability lines for marketing screens
- statLabels: label (+ unit when it has one) for each stat slot — the labels MUST be distinct, match the product domain, and align 1:1 with the provided metrics (e.g. fitness: Weekly distance/km, Avg pace/min/km, Streak/days, Calories/kcal). The metrics list is the source of truth: same count, and each unit must match the metric's own unit exactly (never invent or mangle units like "min·km").
- chartTitle + chartSubtitle + chartUnit: what the chart shows, in the product's units (never "$" unless the product is financial/shopping). The chartUnit MUST be the unit of one of the provided time series, and the title should match that series' label.
- detailFields: 4-5 field labels for a detail panel (product fields, never generic Amount/Owner unless financial)
- settingsSections: 2-3 sections of { title, items: [{ label, value, control: "toggle"|"select"|"text" }] } for a settings screen — product-relevant (goals, units, notifications for fitness; NEVER billing/payment/invoice sections unless the product is financial/shopping)
- slogan: a single short word or punchy phrase (≤ 8 chars) for a statement band, on-voice for the brand
- searchPlaceholder: what the user types in search (product-specific)`;

  const voice = `COMPANY VOICE & TONE:\n${input.theme.manifest.voiceAndTone}`;

  const data = input.data;

  try {
    const plan = await chatJSON<CopyPlan>(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: `PRODUCT: ${input.brief.title} — ${input.brief.productType}\n${input.brief.description}\n\nFEATURES:\n${input.brief.features.map((f) => `- ${f.name}: ${f.description}`).join("\n")}\n\nSCREENS:\n${screensBlock}\n\n${voice}\n\n${datasetPrompt(data)}\n\nWrite the copy plan as JSON matching: { "productTitle", "tagline"?, "screens": [{ "screenId", "headline", "overline"?, "description"?, "primaryCta"?, "secondaryCta"?, "tableColumns"?, "tableTitle"?, "emptyTitle"?, "emptyBody"?, "bullets"?, "statLabels"?, "chartTitle"?, "chartSubtitle"?, "chartUnit"?, "detailFields"?, "settingsSections"?, "slogan"?, "searchPlaceholder"? }] } — one entry per screen id.`,
        },
      ],
      {
        model: "copy",
        temperature: 0.5,
        maxTokens: MAX_TOKENS_PER_CALL.copy,
        validate: (v) => copyPlanSchema.parse(v),
        onUsage: input.onUsage,
      },
    );
    const { plan: clean, corrected } = sanitizeCopyPlan(plan, data);
    if (corrected.length > 0) {
      console.warn(`[pastel v6] copy sanitizer corrected screens: ${corrected.join(", ")}`);
    }
    return clean;
  } catch (err) {
    console.warn("[pastel v6] copy failed, using template fallback:", err instanceof Error ? err.message : err);
    return sanitizeCopyPlan(fallbackCopy(input.brief, input.wireframe, data), data).plan;
  }
}
