# Apple UI - Replication Specification

## Scope and references
Use `references/home.jpg` for the Apple store-style home and `references/iphone.jpg` for
the iPhone catalog. Both are pale neutral, product-first pages with a black global nav,
small blue pill links, centered type, large photography, tiled promos, legal copy, and a
many-column footer. The product, not the chrome, is the visual hero.

## Tokens
```css
:root { --bg:#fff; --wash:#f5f5f7; --ink:#1d1d1f; --muted:#6e6e73;
  --blue:#0071e3; --line:#d2d2d7; --black:#000; --error:#ff3b30;
  --font:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;--s24:96px;
  --r-sm:8px;--r-md:12px;--r-card:18px;--r-pill:999px;--shadow:none; }
```
Types: nav `12px/1.2/400`, body `17px/1.45/400`, product label `14px/1.3/500`,
section title `32px/1.1/600`, hero `48px/1.05/600`, legal `11px/1.45/400`.
Use tight tracking only for headlines and tabular numerals for specs.

## Layout recipes
`GlobalNav` is 44px black, centered max-width 1024px: Apple mark, Store, Mac, iPad,
iPhone, Watch, Vision, AirPods, TV & Home, Entertainment, Accessories, Support, search,
bag. On mobile show mark, search, bag, menu. `PromoBar` is a 36px pale strip with centered
underlined copy and chevrons when present.

`Hero`: full-width 500-620px, centered title/subtitle/blue CTA over a product or editorial
image. In the home reference the first hero is a dark stadium image with white title and
blue/white buttons; subsequent heroes alternate white and `--wash`. Use `object-fit:cover`
and a subtle black readability gradient only on photographic hero sections.

`ProductFeature`: centered title, 17px subhead, compact blue `Learn more` and outlined
`Buy`, then a product image. `PromoGrid` is a 2-column desktop grid with 4px gutters,
min-height 390px, centered title/buttons and alternating white, wash, and black cells.
`ProductRail` on iPhone is a heading row plus 3-4 cards, image, model, price, and links.
Footer uses legal text first, then 5 columns of 11px links and a thin bottom line.

## Components, states, responsive
Links are blue and underlined only in prose; buttons are 28-34px capsule, blue fill or
white with blue border. Hover darkens blue, focus is a 2px blue ring, disabled drops to
40% opacity. Cards have no shadow and only the `--wash` surface. Product image loading
keeps its allocated aspect ratio with a neutral placeholder. Carousel arrows are small
gray circles at the rail edge and disappear when the rail fits.

At 1024px reduce nav items and hero height; at 734px use a 48px mobile nav, one-column
promo grid, 36px hero, and 20px gutters. At 480px product rails show one full card plus
peek, centered body copy remains max 330px. Voice is calm, factual, short: "iPhone",
"Explore the lineup", "Up to 30 hours of battery life." No hype or exclamation marks.

## Reference Caveats
- Keep source image aspect ratios and reserve height before loading.
- Use semantic heading order and never promote legal copy to display type.
- Align desktop content to the 1024px rail and mobile content to 20px gutters.
- Keep product links blue and concise; preserve 28-34px capsule geometry.
- Footer columns may collapse only below the mobile breakpoint.
- Empty media stays neutral `--wash`; never add invented imagery.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
`iphone.jpg` contains extremely tall pale/white intervals and dense legal copy near the
bottom. They are capture proportions and unloaded/low-information space, not a design
instruction to add blank sections. Reproduce visible catalog cards, imagery, headings,
legal text, and footer only. Do not invent extra product imagery.

## 6. AI build contract
### Global shell
- Use a white page, 1024px rail, 44px black nav, and 36px promo strip; mobile reduces to mark, search, bag, menu.
- Use `--wash` only for visible product tiles and legal bands; no card shadow is permitted.
### Screen recipes
1. Store home: nav -> promo -> dark stadium hero -> product feature -> alternating hero -> promo grid -> footer.
2. iPhone catalog: nav -> catalog title -> product rail -> product cards -> comparison/legal copy -> footer.
3. Product detail: nav -> breadcrumb/title -> hero product image -> feature copy/blue links -> specs -> related rail -> footer.
### Components
- GlobalNav: 44px, 1024px max, 12px labels, 24px padding; links have 28px hit areas.
- PromoBar: 36px pale strip, centered 12px copy, underlined link, optional chevrons.
- Hero: 500-620px, centered 48px heading, 17px subhead, blue 28-34px capsule links; image fills its ratio.
- ProductCard: 1:1 image, no shadow, 18px radius only when visible, 14px label, price, blue links.
- PromoGrid: two columns, 4px gutters, 390px minimum cells; centered title and CTA.
- LegalFooter: legal text first, 11px links in five columns, thin bottom rule.
### States, responsive, and voice
- Blue links darken on hover; focus is a 2px blue ring; disabled is 40% opacity.
- Preserve image ratios while loading with `--wash`; rail arrows are 40px gray circles and hide when unnecessary.
- At 1024px reduce nav/hero; at 734px use 48px nav and one-column promos; at 480px use 20px gutters.
- Voice is factual: `Explore the lineup`, `Learn more`, `Up to 30 hours of battery life.`
- Hard avoids: no dark app sidebar, gradients, generic SaaS cards, invented products, or extra imagery in blank intervals.
## Reference Caveats
White, pale, unloaded, and legal-heavy intervals are excluded from design inference. Reproduce visible product imagery and copy only; do not add blank sections or invent content for empty areas.
