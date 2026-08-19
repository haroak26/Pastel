import type { CompanyManifest } from "../knowledge/manifest-schema";
import { themeFromDesignTokens } from "../knowledge/index";
import { designTokensFromManifest } from "../agents/design";
import type { DesignTokens, ResolvedTheme } from "../schemas";
import { contrastRatio, darken, hexToHsl, hslToHex, lighten, relativeLuminance, rotateHue } from "./colors";
import {
  blueprintSchema,
  type Concept,
  type DesignBlueprint,
  type DerivedBlueprint,
  type ManifestComponent,
} from "./blueprint";

/**
 * Maxi Agent v25 — deterministic blueprint derivation.
 *
 * Everything here runs AFTER the single Direction call and BEFORE any file
 * is authored, with ZERO model calls:
 *
 *   1. WCAG repair — every concept palette's contrast pairs are enforced
 *      by HSL adjustment (v24's post-hoc review finding, now impossible).
 *   2. Divergence veto — the model's chosen concept is rejected if it is a
 *      near-sibling of another concept; the most distinctive concept wins.
 *   3. Token expansion — the 11-color concept palette grows into the full
 *      23-token DesignTokens system (status colors, chart ramp, radius /
 *      type / control scales derived from the concept's axes).
 *   4. Manifest lint — identifier safety, usedBy reconciliation, the
 *      Button-primitive floor.
 *   5. Fallback blueprint — when the Direction call fails entirely, a
 *      single-concept blueprint derives from the inspiration manifest.
 */

// ── 1. WCAG repair ─────────────────────────────────────────────────────────

const PAIR_MIN = 4.5;

function adjustForContrast(fg: string, bg: string, min = PAIR_MIN): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  const fgLighter = relativeLuminance(fg) > relativeLuminance(bg);
  const { h, s } = hexToHsl(fg);
  let l = hexToHsl(fg).l;
  for (let i = 0; i < 14 && contrastRatio(hslToHex(h, s, l), bg) < min; i++) {
    l = fgLighter ? Math.min(98, l + 4) : Math.max(2, l - 4);
  }
  return hslToHex(h, s, l);
}

function repairPalette(palette: Concept["palette"], notes: string[], label: string): Concept["palette"] {
  const p = { ...palette };
  const fix = (key: keyof Concept["palette"], bgKey: keyof Concept["palette"], what: string) => {
    const fixed = adjustForContrast(p[key], p[bgKey]);
    if (fixed !== p[key]) {
      notes.push(`${label}: ${what} contrast repaired (WCAG AA)`);
      p[key] = fixed;
    }
  };
  fix("foreground", "background", "foreground/background");
  fix("mutedForeground", "background", "muted-foreground/background");
  fix("mutedForeground", "card", "muted-foreground/card");
  fix("primary", "background", "primary/background");
  fix("primaryForeground", "primary", "primary-foreground/primary");
  fix("accentForeground", "accent", "accent-foreground/accent");
  // The ring must be visible against the background (focus indicator).
  if (contrastRatio(p.ring, p.background) < 1.6) {
    p.ring = adjustForContrast(p.ring, p.background, 1.6);
    notes.push(`${label}: ring contrast repaired`);
  }
  // The card must read as a surface, not dissolve into the background.
  if (Math.abs(relativeLuminance(p.card) - relativeLuminance(p.background)) < 0.025) {
    const { h, s } = hexToHsl(p.card);
    const lighter = relativeLuminance(p.background) > 0.5;
    p.card = hslToHex(h, Math.min(20, s), lighter ? Math.min(100, hexToHsl(p.card).l + 3) : Math.max(0, hexToHsl(p.card).l - 3));
    notes.push(`${label}: card separated from background`);
  }
  return p;
}

// ── 2. Divergence scoring ──────────────────────────────────────────────────

function hueOf(hex: string): number {
  return hexToHsl(hex).h;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d) / 180; // 0..1
}

/** 0 (identical) … 1 (maximally distinct) across the concept axes. */
export function conceptDivergence(a: Concept, b: Concept): number {
  const hue = hueDistance(hueOf(a.palette.primary), hueOf(b.palette.primary));
  const fonts =
    (a.fonts.display !== b.fonts.display ? 0.5 : 0) + (a.fonts.body !== b.fonts.body ? 0.5 : 0);
  const axes =
    (a.density !== b.density ? 1 / 3 : 0) +
    (a.cornerLanguage !== b.cornerLanguage ? 1 / 3 : 0) +
    (a.motion !== b.motion ? 1 / 3 : 0);
  const bgLum = Math.min(
    1,
    Math.abs(relativeLuminance(a.palette.background) - relativeLuminance(b.palette.background)) * 2,
  );
  return 0.4 * hue + 0.25 * fonts + 0.2 * axes + 0.15 * bgLum;
}

/** Concepts closer than this read as siblings — the veto line. */
export const SIBLING_THRESHOLD = 0.35;

/**
 * The model picks; the scorer vetoes. A chosen concept below the sibling
 * threshold against ANY other concept is swapped for the concept with the
 * highest minimum divergence from the others.
 */
export function resolveChosenConcept(concepts: Concept[], modelPick: number, notes: string[]): number {
  if (concepts.length !== 3) return Math.min(modelPick, Math.max(0, concepts.length - 1));
  const chosen = concepts[modelPick] ?? concepts[0]!;
  const tooClose = concepts.some((c, i) => i !== modelPick && conceptDivergence(chosen, c) < SIBLING_THRESHOLD);
  if (!tooClose) return modelPick;

  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < concepts.length; i++) {
    const minDist = Math.min(
      ...concepts.filter((_, j) => j !== i).map((c) => conceptDivergence(concepts[i]!, c)),
    );
    if (minDist > bestScore) {
      bestScore = minDist;
      best = i;
    }
  }
  notes.push(
    `Concept veto: the model's pick was a near-sibling of another concept — the most distinctive concept (${concepts[best]!.name}) was chosen instead`,
  );
  return best;
}

// ── 3. Token expansion ─────────────────────────────────────────────────────

const RADIUS_BY_CORNER: Record<Concept["cornerLanguage"], [number, number, number, number]> = {
  sharp: [2, 4, 8, 12],
  soft: [6, 10, 14, 20],
  pill: [14, 20, 28, 36],
};

const TYPE_SCALE_BY_DENSITY: Record<Concept["density"], DesignTokens["typeScale"]> = {
  compact: { xs: 11, sm: 13, base: 15, lg: 16, xl: 18, "2xl": 22, "3xl": 26, "4xl": 34 },
  balanced: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 40 },
  airy: { xs: 12, sm: 14, base: 16, lg: 18, xl: 21, "2xl": 26, "3xl": 32, "4xl": 46 },
};

const RHYTHM_BY_DENSITY: Record<Concept["density"], { pad: number; gap: number }> = {
  compact: { pad: 40, gap: 24 },
  balanced: { pad: 56, gap: 32 },
  airy: { pad: 72, gap: 48 },
};

export function expandTokens(concept: Concept): DesignTokens {
  const p = concept.palette;
  const dark = relativeLuminance(p.background) < 0.35;
  const radius = RADIUS_BY_CORNER[concept.cornerLanguage];
  const popover = dark ? lighten(p.card, 0.04) : darken(p.card, 0.02);
  // Status pairs must clear WCAG AA against their subtle backgrounds — the
  // audit gate checks exactly these pairs, so enforce them at generation.
  const successSubtle = hslToHex(142, 30, dark ? 14 : 93);
  const warningSubtle = hslToHex(32, 60, dark ? 16 : 94);
  const success = adjustForContrast(hslToHex(142, 64, dark ? 50 : 32), successSubtle);
  const warning = adjustForContrast(hslToHex(32, 90, dark ? 55 : 38), warningSubtle);
  const destructive = adjustForContrast(hslToHex(0, 72, dark ? 55 : 45), "#FFFFFF");
  const chart = [
    p.primary,
    p.accent,
    rotateHue(p.primary, 40),
    rotateHue(p.accent, -40),
    p.mutedForeground,
    rotateHue(p.primary, 200),
  ].slice(0, 6);

  const tokens: DesignTokens = {
    version: "1.0.0",
    mode: dark ? "dark" : "light",
    colors: {
      background: p.background,
      foreground: p.foreground,
      card: p.card,
      cardForeground: adjustForContrast(p.foreground, p.card),
      popover,
      popoverForeground: adjustForContrast(p.foreground, popover),
      primary: p.primary,
      primaryForeground: p.primaryForeground,
      secondary: p.muted,
      secondaryForeground: p.foreground,
      muted: p.muted,
      mutedForeground: p.mutedForeground,
      accent: p.accent,
      accentForeground: p.accentForeground,
      destructive,
      destructiveForeground: "#FFFFFF",
      success,
      successSubtle,
      warning,
      warningSubtle,
      border: p.border,
      input: adjustForContrast(p.border, p.background, 1.25),
      ring: p.ring,
      chart,
    },
    radius: { sm: radius[0], md: radius[1], lg: radius[2], xl: radius[3], full: 9999 },
    typeScale: TYPE_SCALE_BY_DENSITY[concept.density],
    control: { sm: 32, md: 40, lg: 48 },
    sectionPaddingY: RHYTHM_BY_DENSITY[concept.density].pad,
    sectionGap: RHYTHM_BY_DENSITY[concept.density].gap,
    fonts: { ...concept.fonts },
    rationale: concept.thesis.slice(0, 240),
  };
  return tokens;
}

// ── 4. Manifest lint ───────────────────────────────────────────────────────

const IDENT_RE = /^[A-Z][A-Za-z0-9]*$/;

export function lintManifest(manifest: ManifestComponent[], screenIds: string[], notes: string[]): ManifestComponent[] {
  const out: ManifestComponent[] = [];
  const seen = new Set<string>();
  for (const c of manifest) {
    if (!IDENT_RE.test(c.name)) {
      notes.push(`Manifest: dropped "${c.name}" (not a PascalCase identifier)`);
      continue;
    }
    if (seen.has(c.name)) {
      notes.push(`Manifest: dropped duplicate "${c.name}"`);
      continue;
    }
    const usedBy = c.usedBy.filter((sid) => screenIds.includes(sid));
    if (usedBy.length === 0) {
      notes.push(`Manifest: dropped "${c.name}" (mounted by no screen)`);
      continue;
    }
    seen.add(c.name);
    out.push({ ...c, usedBy });
  }

  // The Button-primitive floor: every product needs at least one action
  // control, and screens code against the manifest — so it must exist there.
  if (!out.some((c) => c.kind === "primitive" && /button/i.test(c.name))) {
    out.unshift({
      name: "Button",
      kind: "primitive",
      props: [
        { name: "label", type: "string", required: true },
        { name: "variant", type: "string", required: false },
        { name: "size", type: "string", required: false },
        { name: "onClick", type: "func", required: false },
      ],
      intent: `The concept's action control — ${"carry the concept's corner language and weight"}.`,
      usedBy: [...screenIds],
    });
    notes.push("Manifest: Button primitive added (the action-control floor)");
  }
  return out;
}

// ── The derive entry point ────────────────────────────────────────────────

export interface BlueprintDerivation {
  blueprint: DesignBlueprint;
  chosenIndex: number;
  concept: Concept;
  tokens: DesignTokens;
  theme: ResolvedTheme;
  notes: string[];
}

export function deriveBlueprint(
  raw: unknown,
  hintManifest: CompanyManifest,
): BlueprintDerivation {
  const notes: string[] = [];
  const bp = blueprintSchema.parse(raw);

  const concepts = bp.concepts.map((c, i) => ({
    ...c,
    palette: repairPalette(c.palette, notes, `Concept ${i + 1} (${c.name})`),
  }));

  const chosenIndex = resolveChosenConcept(concepts, bp.chosenConcept, notes);
  const concept = concepts[chosenIndex]!;

  const tokens = expandTokens(concept);
  const theme = themeFromDesignTokens(tokens, hintManifest);

  const screenIds = bp.screens.map((s) => s.id);
  const manifest = lintManifest(bp.componentManifest, screenIds, notes);

  const blueprint: DesignBlueprint = {
    ...bp,
    concepts,
    chosenConcept: chosenIndex,
    componentManifest: manifest,
  };

  return { blueprint, chosenIndex, concept, tokens, theme, notes };
}

// ── 5. Fallback blueprint ──────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic single-concept blueprint when the Direction call fails
 * entirely. Derived from the inspiration manifest's tokens — a real design
 * system, just not an adventurous one. Flagged in the run notes.
 */
export function fallbackBlueprint(
  prompt: string,
  hintManifest: CompanyManifest,
  primarySlug: string,
): BlueprintDerivation {
  const notes: string[] = [];
  const tokens = designTokensFromManifest(hintManifest, "light");
  const c = tokens.colors;

  const title = prompt.trim().split(/\s+/).slice(0, 4).map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ") || "New Product";

  const concept: Concept = {
    name: `${hintManifest.name} mood`,
    thesis: `A grounded system derived from ${hintManifest.name}'s visual language: restrained surfaces, one confident accent, and content doing the talking.`,
    palette: {
      background: c.background,
      foreground: c.foreground,
      card: c.card,
      primary: c.primary,
      primaryForeground: c.primaryForeground,
      accent: c.accent,
      accentForeground: c.accentForeground,
      muted: c.muted,
      mutedForeground: c.mutedForeground,
      border: c.border,
      ring: c.ring,
    },
    fonts: { display: tokens.fonts.display, body: tokens.fonts.body },
    density: "balanced",
    cornerLanguage: tokens.radius.md <= 4 ? "sharp" : tokens.radius.md <= 12 ? "soft" : "pill",
    motion: "subtle",
    signatureMoves: hintManifest.signatureMoves.slice(0, 3),
  };

  const end = new Date();
  const start = new Date(end.getTime() - 29 * 24 * 3600 * 1000);
  const allScreens = ["home", "detail"];

  const blueprint: DesignBlueprint = {
    version: "25.0.0",
    brief: {
      title: title.slice(0, 48),
      productType: "product",
      mode: "track",
      description: prompt.trim().slice(0, 400) || "A product with a primary workflow and a focused detail view.",
      audience: "People who use this product every week",
      copyDirection: "Specific, plain, and human. Name real things; never explain the interface.",
      inspiration: { primary: primarySlug },
    },
    concepts: [concept, concept, concept].map((x, i) => ({ ...x, name: i === 0 ? x.name : `${x.name} ${i + 1}` })),
    chosenConcept: 0,
    screens: [
      { id: "home", intent: "The primary workflow surface: an overview of what matters now, one dominant metric moment, and the main list of records.", nav: "sidebar", dominantMoment: "The headline metric block with its trend" },
      { id: "detail", intent: "The focused view of one selected record: its key fields, status, and the actions that apply to it.", nav: "sidebar", dominantMoment: "The record's title block with its status" },
    ],
    componentManifest: lintManifest(
      [
        {
          name: "Button",
          kind: "primitive",
          props: [
            { name: "label", type: "string", required: true },
            { name: "variant", type: "string", required: false },
            { name: "size", type: "string", required: false },
            { name: "onClick", type: "func", required: false },
          ],
          intent: "The primary action control — solid primary fill, quiet secondary variant.",
          usedBy: allScreens,
        },
        {
          name: "Badge",
          kind: "primitive",
          props: [
            { name: "label", type: "string", required: true },
            { name: "tone", type: "string", required: false },
          ],
          intent: "A small status chip using the theme's tonal surfaces.",
          usedBy: allScreens,
        },
        {
          name: "MetricCard",
          kind: "component",
          props: [
            { name: "label", type: "string", required: true },
            { name: "value", type: "string", required: true },
            { name: "unit", type: "string", required: false },
            { name: "delta", type: "number", required: false },
            { name: "positive", type: "boolean", required: false },
          ],
          intent: "One metric, display-scale value, trend delta with direction.",
          usedBy: ["home"],
        },
        {
          name: "RecordList",
          kind: "component",
          props: [
            { name: "rows", type: "array", required: true },
            { name: "onSelect", type: "func", required: false },
          ],
          intent: "The main record list — divided rows, primary text, meta and status per row.",
          usedBy: ["home"],
        },
        {
          name: "DetailPanel",
          kind: "component",
          props: [
            { name: "title", type: "string", required: true },
            { name: "fields", type: "array", required: true },
            { name: "status", type: "string", required: true },
          ],
          intent: "The focused record's summary: title, status, and its key fields.",
          usedBy: ["detail"],
        },
        {
          name: "ActivityFeed",
          kind: "component",
          props: [{ name: "items", type: "array", required: true }],
          intent: "A quiet chronological feed of what happened recently.",
          usedBy: ["detail"],
        },
      ],
      allScreens,
      notes,
    ),
    dataSchema: {
      units: ["%"],
      dateRange: { start: isoDate(start), end: isoDate(end) },
      people: [{ name: "Avery Quinn", role: "Owner" }],
      metrics: [
        { label: "Active items", value: "24", unit: "", delta: 8, positive: true },
        { label: "This week", value: "6", unit: "", delta: 12, positive: true },
        { label: "Completion", value: "82", unit: "%", delta: 3, positive: true },
      ],
      list: {
        name: "Records",
        rows: [
          { title: "Harbor Line", subtitle: "Reviewed twice, ready to move", meta: "Updated 2d ago", status: "Active" },
          { title: "North Peak", subtitle: "Waiting on one confirmation", meta: "Updated 5d ago", status: "Pending" },
        ],
      },
      detail: {
        title: "Harbor Line",
        fields: [
          { label: "Status", value: "Active" },
          { label: "Owner", value: "Avery Quinn" },
          { label: "Started", value: isoDate(start) },
          { label: "Items", value: "12" },
        ],
      },
      activity: [
        { actor: "Avery Quinn", action: "updated the status of", target: "Harbor Line", time: "2h ago" },
        { actor: "Avery Quinn", action: "added 3 items to", target: "North Peak", time: "1d ago" },
        { actor: "Avery Quinn", action: "created", target: "Harbor Line", time: "5d ago" },
      ],
    },
  };

  notes.push("Direction call failed — deterministic fallback blueprint used");

  return {
    blueprint,
    chosenIndex: 0,
    concept,
    tokens,
    theme: themeFromDesignTokens(tokens, hintManifest),
    notes,
  };
}
