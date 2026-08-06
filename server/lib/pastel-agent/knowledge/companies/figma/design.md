# Figma UI - Replication Specification

## Scope and reference reading
Replicate the marketing home in `references/home.jpg` and the community home in
`references/community.jpg`. The home is a white, editorial landing page: a very small
utility nav, oversized left headline, centered dark video panel, a purple campaign strip,
large vertical gaps, resource rails, proof logos, community cards, and a black footer.
The community page is a dense white discovery catalog with a centered search hero, image
cards, creator rows, and blue links. Do not invent an app canvas when reproducing these
captures.

## Tokens
```css
:root {
  --bg: #fff; --ink: #000; --muted: #666; --faint: #f5f5f5;
  --blue: #0d99ff; --blue-hover: #007be6; --purple: #c9a0d6;
  --line: #e5e5e5; --dark: #050505; --white: #fff;
  --font: Inter, Arial, sans-serif; --mono: "Roboto Mono", monospace;
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s6: 24px;
  --s8: 32px; --s12: 48px; --s16: 64px; --s24: 96px; --s32: 128px;
  --r-sm: 4px; --r-md: 8px; --r-lg: 12px; --r-pill: 999px;
  --shadow-card: 0 1px 4px rgba(0,0,0,.08);
}
```
Typography: use Inter; display `48px/1.02/700`, section heading `32px/1.05/700`,
card title `16px/1.25/600`, body `15px/1.45/400`, caption `11px/1.3/500`.
Use `letter-spacing: -.04em` on display and `font-variant-numeric: tabular-nums` for counts.

## Page recipe
1. `Header`: 56px high, 16px desktop padding; tiny 10-11px links for Products,
   Solutions, Community, Resources, Pricing; right links Log in, Contact sales, and black
   `Get started for free` button. Keep the Figma wordmark at left.
2. `Hero`: max-width 1280px, min-height 360px, grid `1fr 1fr`, align center. Put the
   56px headline "The intelligent canvas for infinite creativity" at left. Put a 360x360
   dark video/error panel at center/right with a small centered error message and two dark
   buttons; black `Get started` is a separate CTA to its right at wide widths.
3. `CampaignBar`: full width, 32px lavender strip, black campaign mark left, short copy,
   black `Apply` button right and close icon. It is not a permanent product toolbar.
4. `FeatureLinks`: two small columns after a large blank-looking vertical interval,
   each with a black square icon, bold title, one muted line, and underlined arrow link.
5. `Proof`: max-width 1180px; heading "The products you love are designed in Figma",
   quote/stat two-column row, partner logos, and a 3-column resource carousel.
6. `CommunityRail`: section title plus "Browse all templates", 4-5 image cards with
   4:5 artwork, title and arrow. Use horizontal overflow, not a wrapped dense grid.
7. `Footer`: black, white Figma wordmark and social circles, 4-5 link columns, language
   selector, 56px top/bottom padding. The community footer is white with small columns.

## Components and states
Buttons are 34-40px, square radius `--r-sm`, black or `--blue`; hover darkens/fills
the border, focus uses `0 0 0 2px #fff, 0 0 0 4px var(--blue)`, disabled is 40% opacity.
Cards use hairlines, no heavy shadow; image loading uses a pale gray rectangle and keeps
the title metadata visible. Rails have left/right chevrons only when scrollable.
Search is 44px, centered, rounded `--r-pill`, blue search icon and "Search the community".
Use 1px dividers, compact labels, and black/blue underlined links. Error video is a loaded
visible state from the reference, not a reason to add a fake video.

## Responsive behavior and voice
At 1100px cap content at 1120px and reduce hero gap. At 760px collapse the hero to one
column, move CTA below video, make nav a menu button, and turn rails into horizontal scroll.
At 480px use 24px gutters, display 36px, 16px campaign text, and 2-column proof cards.
Voice is direct and creative: "Make anything", "Explore templates", "Get started".
Avoid exclamation marks, decorative gradients, and rounded SaaS dashboards.

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
`home.jpg` is a very tall capture with large white intervals and several unloaded-looking
resource tiles. Treat those as capture/loading conditions: implement only the visible
headings, links, cards, and loaded artwork described above. Do not create intentional blank
hero bands or empty gray panels to match the page height.
