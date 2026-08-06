# MEGADESIGN — Universal Product Design Law (V10)

> This document is the global design law for every product the Pastel Agent
> builds. It applies to ALL companies and ALL screens, on top of the
> selected company's `design.md`. If a company file conflicts with this
> document, THIS document wins. Every agent receives these rules; every
> review pass checks against them.

## 1. Accessibility (non-negotiable)

- Every text-on-color pair must meet **WCAG AA** contrast (≥4.5:1 body, ≥3:1 large type).
- Every interactive element has a visible **focus ring** (`outline: 2px solid var(--ring)`), a
  hover state, and an active/pressed state.
- Hit targets are ≥ 32×32px. Icon buttons carry an accessible label.
- Form inputs have visible labels; icon-only controls have `aria-label`.
- Do not rely on color alone to convey meaning — pair with text, icons, or patterns.
- Respect `prefers-reduced-motion`: transitions still exist but nothing pulses or autoplays.

## 2. Token discipline

- **Never hardcode colors.** Every color comes from a CSS custom property:
  `--background, --foreground, --card, --primary, --secondary, --muted, --accent,
  --destructive, --success, --warning, --border, --input, --ring, --chart-N`.
- **Never hardcode fonts.** `var(--font-display)` for headings, `var(--font-body)` for body.
- **Never hardcode spacing/radius.** Use the theme's radius scale
  (`rounded-[var(--radius-md)]`, etc.) and the 8px spacing rhythm.
- Never use `Inter`, `Roboto`, or `system-ui` as a display font. Body may inherit the theme body font.
- No `<style>` tags, no gradients (unless a company explicitly permits them), no drop-shadows on
  static content panels, no `position: fixed` overlays except modals.

## 3. Anti-slop

- No AI-slop copy: no "Unlock your potential", "Enterprise-grade", "Seamless experience",
  "Game-changer", "Revolutionize", "Cutting-edge", "Supercharge".
- No lorem ipsum, no placeholder text. Every screen is filled with **real, specific copy and data**
  before it ships.
- No gradient backgrounds, no floating geometric blobs/dots as decoration.
- No uniform card grids (3+ identical cards). Vary composition; give every screen ONE dominant
  moment.
- No "Get started" + "Learn more" default CTA pairs unless the product genuinely asks for it.
- Section padding uses the theme rhythm (`var(--section-padding-y)`, `var(--section-gap)`); never
  invent huge paddings (`py-20`, `py-32`).

## 4. Layout & spacing law (V10 — the ground rule for every screen)

Every screen is drawn on an invisible **8px grid** with a vertical rhythm. A screen that
ignores rhythm reads as a template; a screen that follows it reads as designed.

- **Vertical rhythm.** Sections stack in alternating padding steps from the theme's
  ladder: `lg` (32px, `py-8`) and `xl` (48px, `py-12`) alternate down the page; the
  screen's ONE dominant moment and deliberate full-bleed accent bands take the
  `2xl` step (64px, `py-16`). Adjacent sections NEVER use the same step — the
  composer's rhythm function assigns the step by section index; do not override it
  with arbitrary `py-N` values (any `py-14`/`py-20`+ is a defect). Section separation
  is never below 32px.
- **Type ladder.** Exactly one size per level, per screen:
  - Dominant moment (hero metric, scoreboard, statement band): display scale, `text-4xl`+ —
    the LARGEST text on the page, always.
  - Section headings: `text-2xl`. Body: base. Labels/captions: `text-xs`/`text-sm`.
  - Hierarchy is monotonic: nothing below a section heading may be larger than it.
- **Container law.** Content lives in `max-w-[1280px]` (`pastel-frame`), centered, `px-6 md:px-8`.
  Full-bleed is reserved for deliberate accent bands or the dominant moment — never the whole screen.
- **Gutters & grids.** Section-to-section gap ≥ 32px. Two-up grid rows use `gap-8`; card grids
  use `gap-5`/`gap-6`. Paired columns stretch to equal height (never `items-start` on a two-up
  row with cards of different heights).
- **Whitespace is structure.** Blocks of content are separated by rhythm, not by empty shells.
  No two sections touch flush; no section is a floating orphan of unrelated padding.
- **Sizing.** Cards: grid cards ~`p-5`, feature cards `p-6`, tiles keep fixed aspect ratios
  (16/10 tiles, 4/3 gallery, 1/1 avatars). Buttons: explicit sizes. Charts ≥ 300px tall.
- **Alignment.** Sections, cards, and rows start on the 8px grid. Left/right insets match the
  frame. Nothing hangs off-grid by 2–6px "because it looked fine".

## 4b. Per-surface guide (when each surface is legal)

- **band** — tonal (`bg-muted/50`, `bg-foreground` inverted, `bg-accent`) full-width section for
  dominant moments, charts, stats, and closing CTAs. No card outline.
- **card** — scarce, deliberate. The product grid on a browse home and the ONE summary card on
  the detail screen are the only card clusters. Never wrap a list in cards when divided rows exist.
- **rows** — `divide-y border-t` divided lists for reviews, activity, details. No card surface.
- **tiles** — image/icon tiles in a mosaic or strip. No text cards.
- **toolbar** — search + one Select + one button. Only on screens whose purpose genuinely
  browses; never chip groups.
- **gallery** — a photo mosaic of ONE item's images (only for media-rich detail items).

## 5. Component standards

- Screens compose **shared components** (`src/components/*.jsx`). Never duplicate navbars, buttons,
  or tables inline.
- Interactive elements: hover + focus + active. Buttons have explicit sizes; badges have tones
  (success/warning/destructive/secondary/muted).
- Dense data lives in **tables** with hairline dividers, right-aligned numerics, status badges.
- Data screens have a toolbar: search + filter + primary action.
- Empty states are compact and actionable: icon, one sentence, one button.
- Charts use `--chart-N` palette, subtle gridlines, faint axis labels.

## 6. Copy quality

- Specific, calm, useful. Write like a real product team — not a marketing agency.
- Headlines ≤ 60 chars, specific to the product. CTAs are verb-first, ≤ 24 chars.
- Numbers and dates are concrete. No filler adjectives.
- Voice and tone follow the selected company's `design.md` voice section.
- **Content relevance (hard):** every metric, row, chart, and activity line must belong to the
  product's domain (a fitness app shows km/pace/streaks — never companies, invoices, currency, or
  B2B workspace activity). Finance content is only legal in financial or shopping products.
- Every stat slot gets a DISTINCT label; never repeat the same label across a screen's stats.

## 6b. UX simplification

- Filters are **Select dropdowns**. Never build multi-chip filter groups (more than 3 chips in a
  row) — a search bar is input + one dropdown + one button.
- One dominant control per toolbar; prefer the simplest control that does the job.
- Components are building blocks, never pages: no fixed overlays, bottom sheets, full-page empty
  states, or giant paddings/type inside components. A small display slot renders small.

## 6c. Card budget

- Card surfaces are scarce: ≤ 4 per screen. Prefer divided rows (`divide-y rounded-xl border
  bg-card`), tonal bands (`bg-muted/50`), and plain sections over wrapped cards for lists and
  stats.
- Give every screen exactly ONE dominant moment (hero, scoreboard, or statement band) — the
  company's signature move — and keep the rest of the page quiet.

## 6d. Composition & energy

A screen must feel designed, not assembled from a template — confident and premium, never
playful or cute, never plain or repetitive.

- **Hero-scale data.** The dominant moment's numbers are the biggest thing on the page
  (display/scoreboard scale, ~text-5xl+). Charts stand at least ~300px tall with legible axes.
  If a metric matters, make it large; a screen full of small labels reads as a template.
- **Never two identical sections in a row.** Every adjacent section uses a different surface:
  alternate inverted bands, tonal bands, divided rows, and cards. Do not stack
  card-headers-with-rows three times down a page.
- **Charts are branded product moments, not stock widgets.** Give the chart a real header
  (title + unit that matches its data), use the theme's chart palette, and let it be the focus
  of its section — never bury it as a small ornament. Multi-series and end-point labels are
  welcome; decorative gradients are not.
- **No blank sections.** Every section renders real content; remove empty shells.
- **Secondary actions are quiet.** Prefer text links or small filled buttons over outline
  button pairs. Two outline buttons side by side read as scaffolding.
- **One screen, one story.** Everything on the page serves the dominant moment; trim blocks
  that compete with it.

## 6e. Creative direction (V10)

Designs must feel authored by a professional, not generated from a catalog:

- Every screen carries **one signature element** — a moment a Figma art-director would call out
  (a giant tabular stat, a photo mosaic, a statement band, a tight feature strip). Everything
  else stays quiet so the signature reads.
- **Prefer distinctive structures over extra components.** Two well-placed sections with
  different surfaces beat five generic cards. Asymmetry is welcome when intentional (one
  column 2/3, the other 1/3 — never centered-everything).
- **Product-specific components** (an amenity grid for a stay, a stat ring for a runner) are
  the way to differentiate — never generic primitives (Button/Card/Input) listed as "custom".
- Do NOT add decorations: no floating blobs, no stock icons as fillers, no gratuitous
  border-radii. "More" means more considered structure, not more stuff.
- Two identical adjacent surfaces are a defect (§6d), not a theme.

## 7. Motion

- Transitions: 120–200ms, `cubic-bezier(0.22, 1, 0.36, 1)` for enters, `ease-out` for hovers.
- No autoplaying carousels, no infinite animations. Subtle hover lifts are fine.

## 8. Cross-screen integrity & the detail screen (V14 — hard)

- **A screen shows ONLY its own data.** Every screen reads from its OWN scoped data view
  (`DATA.screens.<screen-id>`): home renders its primary workflow; detail renders ONE item and
  nothing else. Catalog grids, search bars, and metric bands NEVER appear on the detail screen;
  the detail screen's photos/fields/reviews NEVER appear on home.
- **The detail screen is ONE item.** Its gallery (when media-rich), fact rows, reviews, and price
  all describe that item — never other items from the catalog.
- **Detail-screen law (V14, product-led):** the detail screen serves the brief's focused
  secondary workflow — for a media-rich item (listing, episode, product, photo-driven item):
  gallery (dominant moment) → summary card (the ONE card, sticky on desktop) → fact rows →
  reviews as divided rows → one quiet trust band. For a record/task/exercise: info pane
  (dominant moment) → one primary action → fact rows. A booking summary (price + dates + guests)
  is ONLY legal for commerce/travel products; a coaching or dashboard detail must never render
  "Reserve", "Verified host", guest counts, or an Airbnb-shaped summary card.
- **Media & imagery:** photo-first rendering. Every tile is a real visual — scene art or a
  photograph — never a colored block with a letter. Tiles keep fixed aspect ratios; overlay
  text sits on a scrim (`bg-background/90`) with AA contrast; heart/save controls float on
  tiles with focus + pressed states.
- **No dead links** (`onClick={(e) => e.preventDefault()}`), no console errors, no blank sections.

## 9. Self-sufficiency

- Every screen renders correctly standalone at 1440px and 375px.
- No horizontal overflow: `overflow-x-hidden` on the root, `min-w-0` on flex/grid children,
  `break-words` on long text, `truncate`/`line-clamp` on long labels.
- Body copy max-width ~65ch. Headings use `text-balance`.
- Mock data is realistic and product-relevant (names, amounts, statuses, dates from the run's
  content generator).
