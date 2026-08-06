# Uber UI - Replication Specification

## Scope and references
Use `references/home.jpg` and `references/riders.jpg` as two marketing/service states.
Visible UI is a white, black-type mobility site: compact black header, location crumb,
ride/search form, illustration or rider imagery, service cards, Reserve panel, compare
travel options, account/business sections, FAQ and black footer. The map in the reference
is a gray loaded placeholder and must stay a map panel, not a decorative photo.

## Tokens
```css
:root { --bg:#fff;--ink:#000;--muted:#545454;--soft:#f6f6f6;--line:#ddd;--green:#06c167;
  --red:#da291c;--font:Arial,Helvetica,sans-serif;--s1:4px;--s2:8px;--s3:12px;
  --s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;--r-sm:4px;--r-md:12px;
  --r-sheet:20px;--r-pill:999px;--shadow-sheet:0 -4px 20px rgba(0,0,0,.16); }
```
Type: hero `40px/1.05/700`, section `26px/1.15/700`, body `14px/1.45/400`, labels
`11px/1.2/700` uppercase, price/ETA `18px/1.1/700` tabular.

## Recipes
Header 48px black with Uber mark, Ride, Eat, Business, Uber for Business, About and right
Help, Log in, `Sign up`. `RideHero` max-width 1180px is a 2-column 520px region: left
headline "Go anywhere with Uber", pickup/dropoff fields, `See prices`; right loaded ride
illustration/photo with a small schedule card. `ServiceGrid` is 3 cards per row, pale
surface, tiny image/icon, title, description, `Details` link.

`Reserve` is a pale-blue media card with black title, date/time fields and one black CTA,
beside a white Benefits list. `Compare` is a trip form beside a gray map rectangle with
zoom controls. `AccountSplit` pairs short copy and black action with rider image. Later
sections use 3-column text blocks and one black business band. FAQ is thin white rows with
chevrons; footer is black, 4 link columns and language/location controls.

Fields are 44px, 4px radius, gray border; focus is black 2px ring. Black buttons invert
white on hover; green is reserved for confirmed/live/one primary action. Loading forms keep
their dimensions. At 900px stack hero and compare columns; at 640px use 24px gutters,
stack service cards, turn sheets into rounded-top bottom panels, and make map 280px tall.
Voice is concrete: "Pickup location", "Arriving in 3 min", "$14.20", "Reserve".

## 6. Detailed build contract
Global shell: white body, black 48px header, exact tokens, 1180px rail, 24px mobile gutters.
Recipe 1: header -> location crumb -> Go anywhere hero -> pickup/dropoff fields -> See prices -> ride media.
Recipe 2: header -> riders intro/image -> ServiceGrid -> Reserve panel -> Benefits -> business band.
Recipe 3: header -> trip form -> gray map with zoom -> travel options -> FAQ -> black footer.
Header: black 48px, mark left, section links, Help/Login/Sign up right; mobile keeps mark/menu.
Ride form: 520px left column, 44px fields, 4px radius, black CTA, tabular ETA/price.
Service card: pale surface, 12px radius, tiny image/icon, title, description, Details link; three columns.
Reserve panel: pale blue media card, 20px top radius mobile, date/time fields, black CTA.
Compare map: gray 280px minimum mobile panel, zoom controls, adjacent option rows with price/ETA.
FAQ: thin white rows with chevron and expanded body; footer has four columns and location controls.
Use exact existing colors `--ink:#000`, `--soft:#f6f6f6`, `--green:#06c167`, `--line:#ddd`.
Black actions invert on hover; focus is a black 2px ring; green is confirmed/live only.
At 900px stack hero/compare; at 640px stack cards, use rounded-top sheets, and make map 280px tall.
Loading forms retain dimensions; map controls stay in the map corner.
Voice is concrete: `Pickup location`, `Arriving in 3 min`, `$14.20`, `Reserve`.
Hard avoids: decorative map photo, fake routes, signed-in dashboard, extra blank sections, invented map labels.
Reference Caveats
- Pickup/dropoff fields retain order and dimensions while loading.
- Map controls stay inside the map rectangle and prices use tabular numerals.
- Reserve becomes a rounded-top sheet only at mobile width.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
Both captures include very large white gaps between loaded sections and a gray map block.
Those are capture/loading artifacts, not intentional blank design. Implement only visible
loaded text, forms, cards, imagery, map placeholder and footer; do not reproduce vertical
emptiness as extra sections or claim a blank hero is a product state.
