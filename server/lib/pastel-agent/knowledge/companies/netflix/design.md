# Netflix UI - Replication Specification

## Scope and reference
Replicate `references/home.jpg`: a logged-out acquisition page, not a signed-in browse
screen. It has a dark poster collage hero, red Netflix mark, language/sign-in controls,
centered email conversion, a curved red/purple transition, numbered Trending Now posters,
four benefit cards, FAQ bars, a second email CTA, and a sparse footer.

## Tokens
```css
:root { --bg:#000;--surface:#181818;--panel:#232323;--ink:#f5f5f5;--muted:#b3b3b3;
  --red:#e50914;--red-hover:#b20710;--line:#333;--font:Arial,Helvetica,sans-serif;
  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s6:24px;--s8:32px;--s12:48px;--s16:64px;
  --r-sm:2px;--r-md:4px;--shadow:0 8px 24px rgba(0,0,0,.45); }
```
Hero title `48px/1.1/700`, section `24px/1.2/700`, body `16px/1.4/400`, metadata
`14px/1.35/400`; use white, never gray for primary copy.

## Layout recipes
Header overlays hero, 72px, max-width 1120px: red wordmark left, language select and red
`Sign in` right. `Hero` is 640px with poster collage background, black overlay gradient,
centered title "Unlimited movies, TV shows, and more", price line, email field and red
`Get Started` button. At the bottom add the visible curved neon transition, not a generic
flat red band.

`OfferBanner` is a centered dark-violet rounded strip with popcorn icon, copy and gray
button. `PosterRail` max-width 1120px has heading, 5 visible 2:3 posters, large outlined
rank numbers behind images, and a right arrow. `BenefitGrid` is 4 columns, violet-black
cards, title, muted text and a small pink/orange illustration at bottom. FAQ rows are
full-width 56px dark-gray bars with white question and plus; opening adds a darker body.
Footer repeats email CTA, phone, four link columns, language select and reCAPTCHA note.

Hover poster scales to 1.04 with shadow and must not change rail height. Red buttons darken
on hover, focus gets a white/ red double ring, email invalid shows red border and inline
"Please enter a valid email". Accordions animate height in 150ms; respect reduced motion.
At 800px collapse benefit grid to 2 columns, at 560px stack header controls, use 32px hero
title, full-width form, 2-3 poster peeks, and 20px gutters. Copy is bold and reassuring,
never jokey: "Ready to watch?", "Cancel anytime."

## 6. Detailed build contract
Global shell: black body, exact tokens, 1120px rail, 72px header overlaying the 640px hero.
Recipe 1: header -> poster collage hero -> gradient -> title/price/email form -> neon transition.
Recipe 2: offer banner -> numbered poster rail -> four benefit cards -> FAQ bars.
Recipe 3: FAQ -> second email CTA -> phone/help -> four link columns -> language and reCAPTCHA note.
Header: red mark left, language selector and red sign-in right, no signed-in navigation.
Hero form: 48px title, 16px body, 44px field and red submit; preserve poster crop and overlay.
Poster rail: five 2:3 posters, rank numbers behind, right arrow, horizontal overflow, 24px heading.
Benefit card: violet-black, 4px radius, title/body top, visible small illustration anchored bottom.
FAQ row: 56px dark bar, white question, plus right, darker expanded body.
Footer repeats email CTA, phone, four columns, language control, and legal note.
Use exact existing colors `--bg:#000`, `--red:#e50914`, `--surface:#181818`, `--panel:#232323`, `--muted:#b3b3b3`.
Posters scale to 1.04 without changing rail height; buttons darken; focus uses a white/red double ring.
Invalid email gets red border and inline validation; accordions animate only when motion is allowed.
At 800px benefits become two columns; at 560px stack form, use 32px hero, 20px gutters, and poster peeks.
Voice is bold and reassuring: `Ready to watch?`, `Cancel anytime.`
Hard avoids: playback controls, signed-in sidebar, fake title metadata, invented posters, or light SaaS surfaces.
Reference Caveats
- Poster crops are source truth; preserve dark overlay and rank geometry.
- Email fields stack at 560px and retain validation dimensions.
- FAQ expansion must not change rail width or poster height.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.
Do not add a signed-in sidebar, playback controls, or title metadata not visible in the
logged-out reference. Artwork is the loaded content; preserve its dark crop and overlay.
