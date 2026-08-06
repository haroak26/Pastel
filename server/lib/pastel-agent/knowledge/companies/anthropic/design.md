# Anthropic UI - Design Replication Specification

## 0. Ground truth and scope

Use `references/home.jpg` for the Anthropic corporate site and `references/claude.jpg` for the Claude plans page. The shared language is warm ivory, black ink, editorial serif display type paired with a compact sans, rounded black or beige panels, and restrained orange Claude sun marks.

## 1. CSS tokens

```css
:root {
  --ivory:#f7f5ef; --paper:#fffefa; --ink:#171714; --muted:#64635d;
  --beige:#e7decd; --black:#151612; --orange:#df8b66; --line:#d9d4c9;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px;
  --space-8:32px; --space-12:48px; --space-16:64px; --space-24:96px;
  --r-sm:6px; --r-md:12px; --r-lg:18px; --r-full:999px;
  --sans: Inter, Arial, sans-serif; --serif: Georgia, Times New Roman, serif;
  --max: 1180px;
}
```

## 2. Typography and layout

- Corporate hero heading: sans, 44px to 56px, weight 700, line-height .98. Editorial supporting headings and Claude page hero use serif, 40px to 58px, weight 400.
- Body is 14px to 16px. Nav is 11px to 13px. Buttons are 12px to 14px.
- Use 42px page gutters in the corporate screenshot and 32px in Claude. Mobile uses 20px.
- Cards and panels use 12px to 18px radius. Avoid drop shadows except subtle plan-card elevation.

## 3. Signature components

### Header

Corporate header: `ANTHROPIC` at left, `Research`, `Policy`, `Commitments`, `Learn`, `News`, and black `Try Claude` control at right. Claude header uses orange sun + `Claude` wordmark at left and a minimal nav.

### Corporate hero and feature panel

Two-column hero: bold sans headline `AI research and products that put safety at the frontier` left, serif mission copy right. Below is a large black rounded panel with centered white serif copy `Anthropic is built on hard questions.` and a white `Learn more` button.

### Release cards and link list

Three beige release cards with title, serif/sans body, metadata rules, date/category rows, and black `Read announcement` buttons. Below, a two-column statement plus horizontal topic rows.

### Claude plans

Centered serif `Question what's next`, subtitle, sign-in card, and download button. `Explore plans` toggle sits over three equal bordered plan cards: Free, Pro, Max. Cards have branch/tree line icons, prices, black full-width buttons, checkmark lists, and a small legal note. FAQ is centered rows with plus icons.

## 4. Screen recipes

### Corporate home

Header -> split hero -> black research panel -> `Latest releases` cards -> statement/topic list -> black multi-column footer.

### Claude plans

Claude header -> login panel beside a faded image -> plans heading/toggle -> three plan cards -> usage note -> FAQ -> light footer.

## 5. Interaction and responsive rules

- Black buttons invert to ivory or brighten subtly on hover; beige cards darken their border.
- FAQ rows expand with a vertical height transition and rotate plus to x.
- Plan toggle changes active tab with a white fill and dark text; inactive tab uses pale gray.
- Below 760px, split hero becomes one column, plan cards stack, and nav collapses to logo plus menu.
- Preserve serif display faces; do not replace them with all-sans typography.
- Focus ring is 2px orange, 2px offset.

## 6. Detailed build contract
Global shell: use the existing page background, exact token colors, centered max rail, and compact header.
Recipe 1: header -> primary hero -> first visible feature panel -> card/list section -> footer.
Recipe 2: header -> secondary product/account hero -> visible cards -> FAQ or proof rows -> footer.
Recipe 3: header -> detail title and metadata -> visible media -> related content -> footer.
Header geometry: keep the supplied height, horizontal padding, brand left, navigation center, actions right.
Hero geometry: use the supplied heading size, two-column desktop layout, and one-column mobile layout.
Feature geometry: use visible panel radius, 1px rules, explicit padding, and stable media aspect ratios.
Card hierarchy: eyebrow or metadata, title, short body, then one clear action; do not add secondary noise.
Use exact existing CSS custom properties for every color; do not introduce approximate inline hex values.
Typography follows the existing font pairing and stated sizes/line-heights; headings retain their visual family.
Spacing follows the existing 4px-based scale; section gaps are deliberate and not replaced with arbitrary margins.
Radii follow the existing small/medium/large/full scale; shadows are only used where the existing spec names one.
Focus is a 2px contrasting ring with 2px offset; hover changes color/border before adding motion.
Pressed controls move at most 1-2px; disabled controls use reduced opacity and retain their geometry.
Keyboard order follows visual order; all icon-only actions have 32-44px hit areas and accessible labels.
At the desktop breakpoint keep the full shell and multi-column recipes from the source specification.
At the tablet breakpoint stack secondary columns, preserve media ratios, and reduce gutters rather than content.
At the mobile breakpoint collapse navigation, use 16-24px gutters, and make primary actions full width.
Never let loading media collapse its reserved box; show only the source-grounded placeholder treatment.
Content voice is short, concrete, and faithful to visible labels; do not add marketing claims.
Hard avoids: invented dashboards, fake data, extra navigation, decorative gradients, and unsupported imagery.
Hard avoids: using blank capture areas as components, adding controls not visible in the reference, or changing page genre.
Reference Caveats

- The corporate and Claude captures show marketing/account-plan surfaces, not the Claude chat application or API console.
- The faded image in `claude.jpg` is low-contrast supplied media; do not treat its indistinct contents as a known interface.
- Any content below the visible footer is unknown.
