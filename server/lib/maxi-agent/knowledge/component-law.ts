/**
 * V21 Component Design Law — replaces the deleted base-component library as
 * the builder's creative anchor.
 *
 * v6-v20 fed the builder a reference .jsx file and said "adapt it". Every
 * run converged on the same skeleton (topbar/badge/stat-card shapes), which
 * is why all outputs read as one template. V21 removes the code anchor: the
 * builder writes components from THIS law + the planner's spec + the run's
 * tokens/data. There is no code to copy, so the only way to produce a
 * component is to design one for this product.
 *
 * The law is compact (~2.5KB) so mechanical stages stay cheap to run —
 * full megadesign.md is reserved for design/review judgment calls.
 */

export function componentDesignLaw(): string {
  return `COMPONENT DESIGN LAW (v21) — this replaces any reference implementation. There is NO example code to adapt. You design the component from scratch for THIS product.

ONE VISUAL IDEA
- Decide the component's ONE visual idea before writing code: a display-scale number, a photo-first tile, a tight metric cluster, a progress arc, a stacked bar. That idea must be unmistakable in the output.
- Ask: "could this component ship in a different product unchanged?" If yes, it is too generic — rewrite it around THIS product's data, units, items, and actions.

STRUCTURE & PLACEMENT
- A component is a BUILDING BLOCK, never a page: no position:fixed, no modals, no page-scale empty states, no nested headers/navbars/footers.
- Vary internal layout deliberately: a left-aligned cluster, a top row + body, an asymmetric 2/3-1/3 inner split. Never center everything.
- Vary density: display-scale slots (text-3xl+) vs compact rows are different treatments, not the same resized.
- Prefer divided rows, tonal bands, and asymmetric clusters over grids of identical cards. A grid of uniform bordered cards reads as a template.

SURFACES & SHAPE
- Only ONE card-like container per component. Everything else uses flat bands, hairlines (divide-y / border-b), or no container at all.
- Radii come ONLY from the run's corner language: rounded-[var(--radius-md)] for small elements, rounded-[var(--radius-lg)] for panels, rounded-[var(--radius-xl)] only for the component's hero surface. Use them — a component with zero rounded corners reads as unfinished.
- No gradients. No drop-shadows on static elements. Elevation (V22): shadow-[var(--shadow-sm)] / shadow-[var(--shadow-md)] are reserved for floating/overlay elements and the component's ONE dominant surface — never general panels. No decorative blobs/dots.
- Interactive elements: hover + active states, focus-visible rings, control heights from var(--control-sm/md/lg).

TOKENS & TYPE
- Colors ONLY from the theme tokens (bg-card, bg-muted, bg-muted/50, bg-primary, text-foreground, text-muted-foreground, text-success, border-border, border-input...). No hex, no rgb/hsl, no raw Tailwind color utilities.
- Type: display var(--font-display) for the value/title slot; body var(--font-body) elsewhere. Labels are text-xs/text-sm text-muted-foreground. Numbers use tabular-nums.
- Accent appears 0-2 times per component. The accent never paints the whole component.

DATA & PROPS
- Every value (labels, values, units, names, counts, initials) comes from props fed by the run's DATA — never hardcoded samples, never "—", never "0.0".
- Declare the props you need; keep them simple and product-shaped (items, metrics, people, title...).
- Real data states: render 4+ rows for lists, 3+ for tables. An empty component body is a failure.

STYLE
- Tailwind utilities + CSS custom properties. No <style> tags, no external packages beyond react + lucide-react.`;
}

/** Compact stage law for mechanical agents (planner/builder/compose) — the
 * short version of megadesign.md tuned for components and section bodies. */
export function agentStageLaw(): string {
  return `AGENT STAGE LAW (v21) — compact design rules for this stage:

- Design for THIS product's one primary job. Ask: "could this output ship in a different product unchanged?" If yes, redesign it.
- 8px rhythm: section padding py-8/py-12/py-16, never two adjacent sections on the same padding. Gap between sections >= 32px.
- Colors only from theme tokens (CSS custom properties). No hex/rgb/hsl. No gradients. No floating blobs/dots. No shadows on static panels.
- Surfaces: tonal-band (bg-muted/50), soft-wash (bg-muted/30), divided-list (border-b rows), inset-panel (border bg-card), plain. Cards are SCARCE — one per component/screen max.
- Radii from var(--radius-md/lg/xl) — use them. Control heights from var(--control-sm/md/lg).
- Left-align body copy. Headings text-balance. No underlined headings. No centered paragraphs.
- Density: every section populated with real data; lists 4+ rows, tables 3+ rows; no blank sections.
- One dominant moment per screen at display scale (text-4xl+). Everything else supports it quietly.
- No marketing shapes on app screens: no centered hero + CTA, no footer, no "Get started"/"Learn more".`;
}
