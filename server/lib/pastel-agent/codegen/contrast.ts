import type { DesignSystemSpec } from "../schemas/plan-schemas";

/** WCAG 2.x contrast utilities — recomputed deterministically, never trusted from the model. */

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(m)) return null;
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 0;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [l1, l2] = la >= lb ? [la, lb] : [lb, la];
  return (l1 + 0.05) / (l2 + 0.05);
}

export interface ContrastCheck {
  pair: string;
  ratio: number;
  minimum: number;
  passes: boolean;
}

/** The text/background relationships every design system must satisfy (WCAG AA). */
export function checkDesignSystemContrast(ds: DesignSystemSpec): ContrastCheck[] {
  const c = ds.colors;
  const pairs: Array<{ pair: string; fg: string; bg: string; minimum: number }> = [
    { pair: "text on background", fg: c.text.hex, bg: c.background.hex, minimum: 4.5 },
    { pair: "textMuted on background", fg: c.textMuted.hex, bg: c.background.hex, minimum: 4.5 },
    { pair: "text on surface", fg: c.text.hex, bg: c.surface.hex, minimum: 4.5 },
    { pair: "textMuted on surface", fg: c.textMuted.hex, bg: c.surface.hex, minimum: 4.5 },
    { pair: "accentForeground on accent", fg: c.accentForeground.hex, bg: c.accent.hex, minimum: 4.5 },
  ];
  return pairs.map(({ pair, fg, bg, minimum }) => {
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
    return { pair, ratio, minimum, passes: ratio >= minimum };
  });
}

export function failingContrastPairs(ds: DesignSystemSpec): ContrastCheck[] {
  return checkDesignSystemContrast(ds).filter((check) => !check.passes);
}
