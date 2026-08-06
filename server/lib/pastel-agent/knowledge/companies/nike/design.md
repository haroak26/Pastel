# Nike UI - Replication Specification

## Scope and references
`references/home.jpg` is a Nike editorial home with thin commerce nav, full-bleed campaign
photography, bold centered headings, product/editorial rails, "Best in class", and footer.
`references/shoes.jpg` is the product listing: filters left, 3-column shoe grid, gray-white
product tiles, swatches, prices, badges, related stories and footer. Build both recipes.

## Tokens
```css
:root { --bg:#fff;--ink:#111;--muted:#6b6b6b;--soft:#f4f4f4;--line:#ddd;--volt:#eaff6a;
  --green:#00b662;--orange:#ff6d00;--red:#e5383b;--font:Arial,Helvetica,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;
  --r-sm:4px;--r-md:8px;--r-card:12px;--r-pill:999px;--shadow:none; }
```
Type: condensed/heavy display `48px/0.95/800`, section `32px/1/800`, product `14px/1.25/600`,
body `14px/1.4/400`, price `14px/1.2/600`. Headings may be uppercase; metrics tabular.

## Recipes
Commerce header is 64px: swoosh left, Men/Women/Kids/ Jordan/ NikeSKIMS/Back to School/
Sale, then Find a Store, Help, Join Us, Sign in, search, heart, bag. A 36px gray promo
strip sits below. `EditorialHero` uses edge-to-edge 16:9 imagery, white overlay copy and
one black/white pill CTA. `StoryRail` is 3 cards with image, title and category.

Listing page uses 24px gutters, breadcrumb/title row, left 190px filter rail with expandable
categories and right 3-column grid. Product tiles have 1:1 `--soft` image, shoe centered,
four 44px swatches below, "Coming Soon/Just In/Best Seller" label, title, category and
price. `RelatedStories` is a 3-card rail before a 5-column footer.

Buttons are black filled, 40px, pill; hover inverts, focus is 2px black ring. Filter rows
expand with chevron and preserve selection; heart toggles outline/filled. Product tile
hover shows alternate image and cursor; image loading preserves tile aspect. At 900px hide
filter rail behind `Filters`, use 2 columns; at 600px 2 columns with 8px gap, 20px gutters,
48px mobile header, and smaller type. Voice is direct and measurable: "Best in class",
"Shop", "Men's Shoes", "Extra 25% off".

## 6. Detailed build contract
Global shell: white 64px commerce header, 36px promo strip, exact tokens, 24px desktop and 20px mobile gutters.
Recipe 1: header -> promo -> 16:9 campaign hero -> CTA -> story rail -> Best in class -> footer.
Recipe 2: header -> breadcrumb/title -> 190px filter rail -> 3-column product grid -> related stories -> footer.
Recipe 3: header -> breadcrumb -> product image -> title/category/price -> swatches/CTA -> details -> related rail.
Header: swoosh left, category links, utility links, search/heart/bag hit areas; mobile is 48px.
Hero: edge-to-edge 16:9 image, white copy, black/white 40px pill CTA, no invented overlay.
Product tile: 1:1 `--soft` image, centered shoe, 44px swatches, badge, title/category/price.
Filter rail: 190px expandable rows with chevrons and preserved selection; mobile opens from Filters.
Related stories: three image cards, title/category, horizontal overflow, before five-column footer.
Use exact existing colors `--ink:#111`, `--soft:#f4f4f4`, `--volt:#eaff6a`, `--line:#ddd`.
Black buttons invert on hover; focus is a 2px black ring; heart toggles outline to filled.
At 900px hide rail behind Filters and use two columns; at 600px use two columns, 8px gap, 20px gutters.
Preserve tile ratio during load; alternate image on hover must not shift grid geometry.
Voice is direct: `Shop`, `Men's Shoes`, `Best in class`, `Extra 25% off`.
Hard avoids: invented products, generic badges, shadows, placeholders treated as campaigns, or fake checkout UI.
Reference Caveats
- Product tiles reserve 1:1 image height and keep swatches below price.
- Filter selection persists when the rail becomes the mobile Filters control.
- Editorial imagery is edge-to-edge; catalog imagery stays in soft tiles.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
`home.jpg` contains large blank gray campaign tiles and long white intervals where imagery
did not load. Treat them as capture/loading caveats: reproduce only visible loaded image,
headings, buttons, rails, product UI and footer. Do not turn gray placeholders or whitespace
into intentional monochrome sections, brand blocks, or extra content.
