# Notion UI - Replication Specification

## Scope and reference
`references/home.jpg` is the current Notion marketing home: tiny logo/nav, centered black
headline "AI can't replace teamwork.", grayscale collage/video hero, trust logos, "Built for
teams" feature cards with product screenshots, colorful testimonial cards, a warm CTA band,
and a quiet multi-column footer. This is marketing, not the in-app page tree.

## Tokens
```css
:root { --bg:#fff;--paper:#fbfaf8;--ink:#37352f;--muted:#6e6b66;--blue:#2383e2;
  --line:#e9e9e7;--cream:#f7f6f3;--red:#eb5757;--gold:#f0a21a;--font:Arial,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;
  --r-sm:4px;--r-md:8px;--r-card:8px;--r-pill:999px;--shadow:0 1px 3px rgba(0,0,0,.06); }
```
Type: hero `48px/1.05/700`, section `32px/1.1/700`, card `16px/1.3/600`, body
`14px/1.5/400`, caption `12px/1.35/400`.

## Layout recipes
Header 64px, logo left and compact links Product, Solutions, Resources, Developers,
Enterprise, Pricing, Request a demo; right Log in and blue `Get Notion free`. Hero max
width 1180px, centered title/subtitle and grayscale collage: central 16:9 video frame,
smaller offset photos, white play circle. Trust line and logos follow with hairline divider.
`FeatureSection` has section heading, short black rule, then 2-column pale cards with eyebrow,
bold claim, circular arrow and overlapping UI image. A wide third card follows. `UseCaseRail`
is 5 small hairline cards. `TestimonialGrid` uses three tall red/blue/gold gradient cards
with quote and attribution. CTA is warm paper band, centered title and blue/outline buttons.

Cards use hairlines and 8px radius, no strong shadows. Blue is used for links/primary CTA;
hover raises arrow and tints paper, focus is a 2px blue ring. Mobile at 760px stacks hero
collage, feature cards and testimonials; at 480px use 24px gutters, 34px hero, one card
per rail with peek. Voice is plain: "Built for teams", "Start writing", "Get Notion free".

## 6. Detailed build contract
Global shell: white page, exact tokens, 1180px rail, 64px header, 24px mobile gutters; marketing only.
Recipe 1: header -> centered headline/collage -> trust logos -> Built for teams cards -> footer.
Recipe 2: section heading/rule -> two pale screenshot cards -> wide card -> use-case rail -> testimonials -> CTA.
Recipe 3: header -> resource title/eyebrow -> grayscale media -> copy/blue links -> related cards -> footer.
Header: 64px, compact links, blue 36px Get Notion free, login right; no workspace switcher.
Collage: centered title, 16:9 central media, offset grayscale images, white play circle.
Feature card: pale surface, 8px radius, hairline, eyebrow/claim/arrow, reserved UI image ratio.
Use-case rail: five small hairline cards, 16px title, 14px body, horizontal overflow with mobile peek.
Testimonial card: tall red/blue/gold surface, quote first, attribution bottom, light shadow only.
Footer: quiet columns, language/social controls, warm paper CTA above legal copy.
Use exact existing colors `--ink:#37352f`, `--blue:#2383e2`, `--cream:#f7f6f3`, `--line:#e9e9e7`.
Blue links tint paper and raise arrows; focus is a 2px blue ring; cards remain shadow-light.
At 760px stack collage/cards/testimonials; at 480px use 34px hero, 24px gutters, one rail card plus peek.
Voice is plain: `Built for teams`, `Start writing`, `Get Notion free`.
Hard avoids: app page tree, fake workspace content, glassmorphism, gradients, or invented media.
Reference Caveats
- Keep grayscale media literal and reserve aspect ratio before load.
- Testimonial colors identify cards only, not navigation or buttons.
- Mobile rails show one complete card plus a peek and retain hairlines.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
The grayscale collage and product screenshots are loaded visual assets; do not replace them
with generic illustrations. Any large pale area in the tall capture is capture proportion,
not an instruction for empty product space. Include only visible loaded sections and footer.
