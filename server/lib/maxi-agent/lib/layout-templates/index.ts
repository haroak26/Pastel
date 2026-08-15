import type { ProductMode } from "../../schemas";
import type { LayoutTemplate, SectionBucket, TemplateNav } from "./types";
import { classifySectionBucket, familyForMode } from "./types";
import { LAYOUT_TEMPLATES } from "./templates";

/**
 * Maxi Agent v24 — template selection.
 *
 * `layoutForScreen` classifies the screen (mode family × nav × section
 * count), selects the matching template, and maps genome regions onto its
 * slots in order. A screen whose region count fits NO template FAILS LOUDLY
 * with the exact key that is missing — the fix is to extend the template
 * set, never to improvise a layout at runtime.
 */

export interface TemplateSelectKey {
  mode: ProductMode;
  nav: TemplateNav;
  regionCount: number;
  /** "home" | "detail" — home and detail are separate templates per key. */
  role: "home" | "detail";
}

export function selectTemplate(key: TemplateSelectKey): LayoutTemplate {
  const family = familyForMode(key.mode);
  const bucket = classifySectionBucket(key.regionCount);
  const chosen = LAYOUT_TEMPLATES.find(
    (t) => t.family === family && t.nav === key.nav && t.bucket === bucket && t.role === key.role && t.fits.includes(key.regionCount),
  );
  if (!chosen) {
    throw new Error(
      `no layout template for ${family} × ${key.nav} × ${bucket} (${key.regionCount} regions, ${key.role}) — extend lib/layout-templates/templates.ts instead of improvising a layout`,
    );
  }
  return chosen;
}

export function listTemplateKeys(): string[] {
  return LAYOUT_TEMPLATES.map((t) => `${t.family}:${t.nav}:${t.bucket}`);
}

/**
 * V24 — the layout templates' declared table/list field contract (WS5.2).
 * Every template's list/table slots render rows from these row fields, so
 * the domain-contract check validates copy table columns against THIS
 * schema before composing — a planned table can never ship rows with
 * missing values.
 */
export const TABLE_SOURCE_FIELDS = ["name", "detail", "amount", "status", "date"] as const;

export { classifySectionBucket, familyForMode };
export type { SectionBucket, TemplateNav };
export { LAYOUT_TEMPLATES };
