# Stripe UI - Replication Specification

## Scope and reference
`references/home.jpg` is the source: a long marketing home for financial infrastructure.
It combines a white utility header, a blue-violet-orange ribbon hero, indigo calls to action,
product UI screenshots, large white narrative gaps, metrics, a pale feature catalog, a deep
navy proof section, testimonial/FAQ blocks, and a dense footer.

## Tokens
```css
:root { --bg:#fff;--navy:#0a2540;--ink:#0a2540;--muted:#425466;--pale:#f6f9fc;
  --indigo:#635bff;--indigo-dark:#5147e5;--cyan:#80e9ff;--pink:#ff80ff;--orange:#ffb76b;
  --line:#e3e8ef;--success:#00c48c;--danger:#eb5757;--font:Inter,Arial,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;--s24:96px;
  --r-sm:6px;--r-md:10px;--r-pill:999px;--shadow-float:0 8px 24px rgba(10,37,64,.12); }
```
Display `46px/1.05/600`, section `32px/1.1/600`, body `16px/1.5/400`, UI `14px/1.35/500`,
caption `12px/1.3/500`; monetary values use tabular numerals.

## Recipes
Header is 72px, max-width 1200px: Stripe mark, Products, Solutions, Developers, Resources,
Pricing; right `Sign in` and indigo `Contact sales`. Hero is a 2-column 600px region with
left headline, paragraph and two buttons, and a right abstract flowing ribbon gradient.
The only gradient is this brand hero/background decoration; product screens remain literal.
Below it use a 3-column product showcase: heading, short copy, links and small UI screenshots.

`MetricBand` is pale with 4 equal metrics. `FeatureGrid` is 2-3 columns of pale cards with
icon, terse title, paragraph and indigo link. `NavyProof` is full width #0a2540 with white
copy, violet metrics, and three columns. `FAQ` is left heading/right accordion rows with
1px lines. Footer is pale/white, 5 link columns, legal and small brand mark.

## Components and states
Buttons are 40px, 6px radius, indigo filled or white hairline. Hover uses `--indigo-dark`;
focus uses 2px indigo ring; loading replaces label with a spinner without changing width.
Inputs are 44px, 6px radius, line border, indigo focus. Product screenshots are cards with
10px radius and `--shadow-float`; status badges are green/amber/red only for actual state.
Accordion closed shows title and plus; open shows 16px body and rotates plus to minus.

Desktop max-width is 1200px with 24px gutters. At 900px collapse hero and feature grids;
at 640px use 24px gutters, 36px display, stacked buttons and single-column metrics. Keep
numbers exact and copy terse: "Accept payments", "Build on Stripe", "Get started".

## 6. Detailed build contract
Global shell: white page, navy ink, exact tokens, 1200px rail, 24px gutters, 72px header.
Recipe 1: header -> ribbon hero -> product showcase -> metric band -> pale feature grid.
Recipe 2: feature grid -> navy proof section -> violet metrics -> testimonial/FAQ -> footer.
Recipe 3: pricing title -> visible pricing cards/table -> FAQ rows -> indigo CTA -> footer.
Header: 72px, compact product links, navy mark, indigo 40px Contact sales action.
Hero: 600px two columns, 46px heading, 16px body, two buttons, ribbon decoration right.
Showcase: three columns with heading/copy/link and small screenshot card, 10px radius, float shadow.
Metric band: pale full width, four equal tabular metrics, 32px horizontal padding.
Feature grid: 2-3 pale cards, icon/title/body/link, 10px radius, no unsupported badges.
FAQ: left heading/right accordion, 1px rules, plus rotates to minus, 16px body open.
Footer: pale/white, five link columns, legal copy, small mark.
Use exact existing colors `--navy:#0a2540`, `--indigo:#635bff`, `--pale:#f6f9fc`, `--line:#e3e8ef`.
Indigo buttons darken; focus is 2px indigo ring; loading keeps button width with spinner.
Inputs are 44px/6px radius; at 900px hero/grid stack; at 640px use 36px display and one-column metrics.
Voice is concise: `Accept payments`, `Build on Stripe`, `Get started`.
Hard avoids: API console, excessive gradients, fake metrics, decorative blank bands, or unloaded UI.
Reference Caveats
- Product screenshots stay literal, flat, and dimensioned; only the hero uses broad gradients.
- Metrics use tabular numerals and equal columns until the mobile stack.
- Pricing uses only tiers visible in the supplied source.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
The very tall screenshot has large white intervals and blank pale screenshot placeholders.
Treat them as capture/loading artifacts. Document and build only visible loaded modules,
metrics, screenshots, proof content, FAQ and footer; never pad a page with intentional blank
sections merely to match its captured height.
