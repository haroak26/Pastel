# Duolingo UI - Replication Specification

## Scope and reference
Replicate `references/home.jpg`: bright learning acquisition page with Duolingo wordmark,
language selector, friendly hero illustration and green signup CTA; alternating illustration
and copy rows; phone/app section; dark Super Duolingo band; English Test section; large green
final CTA and green footer. It is cheerful but structured, not a dashboard.

## Tokens
```css
:root { --bg:#fff;--ink:#3c3c3c;--muted:#777;--green:#58cc02;--green-dark:#46a302;
  --dark:#131f24;--blue:#1cb0f6;--purple:#9069cd;--orange:#ff9600;--red:#ea2b2b;
  --line:#e5e5e0;--lime:#58cc02;--font:Nunito,Arial,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;
  --r-sm:12px;--r-md:16px;--r-lg:20px;--r-pill:999px;--shadow:0 3px 0 rgba(0,0,0,.12); }
```
Type: hero `30px/1.08/800`, section `28px/1.1/800`, body `16px/1.45/500`, button
`12px/1/800` uppercase, caption `12px/1.3/700`. Use rounded geometric sans and bold numerals.

## Layout recipes
Header is 48px: green Duolingo mark left, "SITE LANGUAGE: ENGLISH" right. Hero max-width
1000px, 340px high, illustration left and title "The most fun way to learn languages,
chess, and more!" plus green `GET STARTED` and outlined account button right. Language strip
is a 36px white row with small flag tabs and bottom border.

`ValueRows` alternate 2-column illustration/text sections, 380-460px tall, with green
lowercase headings such as "free. fun. effective.", "backed by science", "stay motivated",
"personalized learning". `AppBand` uses pale background and floating devices; `SuperBand`
is deep navy with purple phone and `TRY IT RISK FREE`. `TestBand` is white with green heading
and character art. Final CTA is centered over a bright green wave/landscape and large phone.
Footer is green, white 5-column links, social row and legal strip.

Primary button is green, 44px+, pill, with dark bottom shadow; hover darkens and translates
down 2px, focus is blue 2px ring, completed state uses a check. Secondary is white with
green border/text. Illustration loading reserves its box and shows no gray card. At 760px
stack every row, put copy first on odd rows, use 24px gutters and 28px headings; at 480px
buttons become full width. Voice is cheerful and specific: "5 min a day", "Learn anytime".

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
- Reserve illustration dimensions before loading and never use gray skeleton cards.
- Copy precedes CTA in reading order even when desktop art appears first.
- Flags remain horizontally scrollable rather than awkwardly wrapping.
- Focus rings remain blue against green surfaces and preserve button width.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
Illustrations and green landscape are visible loaded assets and should be used as supplied.
Do not add dense progress dashboards, dark default themes, or blank sections to fill the
tall screenshot; reproduce only the visible page modules and footer.
