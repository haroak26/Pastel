# Linear UI - Replication Specification

## Scope and reference
`references/home.jpg` is Linear's dark product-development marketing page. It uses a black
topbar, left-aligned white section titles, dark UI screenshots, thin dividers, alternating
feature rows, small "Learn more" links, changelog/testimonial tiles and a minimal footer.

## Tokens
```css
:root { --bg:#080b0d;--elevated:#111518;--ink:#f5f6f7;--muted:#8c9095;--faint:#555b61;
  --indigo:#5e6ad2;--indigo-hover:#525dc4;--green:#46a758;--yellow:#ffb224;--red:#e5484d;
  --line:#202529;--font:Inter,Arial,sans-serif;--mono:"JetBrains Mono",monospace;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;
  --r-sm:6px;--r-md:10px;--r-pill:999px;--shadow:none; }
```
Type: hero `40px/1.05/600`, section `24px/1.1/500`, body `14px/1.45/400`, label
`11px/1.2/500`, mono `12px/1.35/500`. Keep app-like density, even on marketing sections.

## Page recipe
Topbar is 48px, tiny Linear mark and links Product, Resources, Customers, Pricing, Company,
right `Get started`. Hero is 2-column with 42px title "The product development system for
teams and agents", muted paragraph, small `Get started` link, and a dark framed product UI
screenshot. Subsequent `FeatureRow`s alternate text and UI screenshot, but remain left aligned
and max-width 1160px; each has a short eyebrow, title, paragraph, learn link and 2-3 small
metrics. A changelog row uses thin timeline points. Final testimonials are dark colored
tiles, then centered "Built for the future" CTA and 5-column footer.

UI screenshot frames use `--elevated`, 1px border, 6px radius and no shadow. Links are
indigo. Buttons are 34px, 6px radius; hover darkens, focus has a 2px indigo ring, pressed
state scales only 0.99. Respect reduced motion. At 800px stack feature rows, at 560px use
24px gutters, 32px hero and let screenshots overflow-x within a clipped frame. Voice is
precise and technical: "Move work forward", "Understand progress at scale".

## 6. Detailed build contract
Global shell: dark `--bg`, exact tokens, 1160px rail, 48px topbar, 24px gutters below 560px.
Recipe 1: topbar -> two-column system hero -> product frame -> FeatureRows -> changelog -> testimonials -> footer.
Recipe 2: topbar -> eyebrow/title -> screenshot -> metrics -> next FeatureRow -> future CTA.
Recipe 3: topbar -> changelog heading -> timeline rows -> testimonial tiles -> five-column footer.
Topbar: 48px, small mark/links, 34px action, 6px radius; headings remain left aligned.
FeatureRow: 50/50 columns, 24px title, 14px body, 11px eyebrow, 12px metrics.
ScreenshotFrame: `--elevated`, 1px `--line`, 6px radius, no shadow, clipped on narrow screens.
MetricRow: 2-3 tabular values with muted labels and 1px separators.
TimelineRow: point, date, title, category, indigo learn link, compact line-height.
TestimonialTile: dark colored surface, 16px padding, quote then attribution, no large portrait.
Use exact existing colors `--bg:#080b0d`, `--ink:#f5f6f7`, `--indigo:#5e6ad2`, `--line:#202529`.
Indigo links darken on hover; pressed buttons scale .99; focus is a 2px indigo ring; honor reduced motion.
At 800px stack rows; at 560px use 32px hero, 24px gutters, horizontally clipped frames.
Voice is precise: `Move work forward`, `Understand progress at scale`, `Learn more`.
Hard avoids: light SaaS cards, fake issue data, gradients, invented empty panels, dense nav.
Keep loading frames dimensioned and empty rather than inserting UI or data.
Reference Caveats
- Preserve dark frames even when internal UI is not legible.
- Keep timeline points and rules aligned to the same rail.
- Status colors are semantic, not decoration; controls retain 34px targets.
- Frames may clip horizontally on mobile without shifting surrounding rows.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
The screenshot is an unusually tall capture with dark empty intervals around some loaded
feature modules. Treat those as capture composition/loading artifacts. Reproduce the visible
headings, screenshot frames, metrics, quotes, links and footer, not invented empty panels.
