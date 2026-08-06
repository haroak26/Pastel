# Shopify UI - Design Replication Specification

## 0. Ground truth and scope

Replicate the supplied `references/home.jpg`: a very tall, mobile-width marketing homepage for Shopify. The visual language is dark, cinematic, sparse, and editorial. The page is not an admin dashboard. Use the supplied image as the authority for the visible home state.

## 1. CSS tokens

```css
:root {
  --ink: #f4f5f2;
  --ink-muted: #a6aaa7;
  --page: #02090b;
  --panel: #062324;
  --panel-deep: #001418;
  --violet: #35009b;
  --blue: #00132d;
  --line: rgba(244,245,242,.14);
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-24: 96px;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px;
  --radius-xl: 16px; --radius-full: 999px;
  --font-sans: Inter, Helvetica Neue, Arial, sans-serif;
  --max: 1200px;
}
```

Use a near-black body, white text, low-contrast copy, and restrained borders. Avoid gradients except for blurred teal light in image panels and the intentional purple section background.

## 2. Typography and layout

- Font: a clean neo-grotesk sans, preferably Shopify Sans or Inter; use `Helvetica Neue, Arial, sans-serif` fallback.
- Hero heading: 40px, weight 400, line-height 0.98, letter-spacing -0.045em.
- Section heading: 26px, weight 400, line-height 1.02, letter-spacing -0.035em.
- Body: 14px, line-height 1.35; small legal and caption text is 8-10px.
- Navigation: 8px to 10px, weight 500, with generous horizontal gaps.
- The reference is a narrow portrait capture. Desktop implementations may use a centered `min(100% - 32px, 1200px)` rail, but preserve the large empty vertical rhythm.
- Page sections use 16px side padding in the capture and 40px to 80px desktop gutters. Section spacing ranges from 72px to 180px.

## 3. Signature components

### Header

An approximately 28px high transparent header sits over the hero. Left: tiny Shopify wordmark. Center/right: `Products`, `Solutions`, `Pricing`, `Resources` links. Right: a small white `Start free trial` pill. On dark backgrounds links are muted white. Keep the header fixed only if the implementation needs it; the screenshot does not prove sticky behavior.

### Hero

Use a full-width image or dark video panel, about 136px high in the captured viewport, with a dark overlay. Place the heading `Be the next household name.` at 16px from the left and around 62px from the top. Below it use two low-contrast lines and a small light CTA plus a text link. Do not center the hero copy.

### Editorial panels

The recurring module is a dark rounded rectangle with a large empty or media area and a short text block. Use `border-radius: 5px`, 1px translucent borders only where visible, and 16px internal padding. Product UI mockups are flat dark cards with cyan or blue glow, not generic gradients.

### Three-card row

`Sell more in more places` is followed by a wide empty media tile and three equal cards. Use a 2-column desktop grid that becomes one column, with the narrow capture showing the three cards side by side. Card titles are 9px to 11px and body copy is 7px to 8px.

### CTA and footer

The `Pick a plan` control is a tiny outlined pill. The purple `Meet your secret weapon, Sidekick` band is a full-width section with two dark media cards. The footer is black, has a small Shopify mark, 4-5 link columns, legal links, social icons, and a thin top border.

## 4. Screen recipe

1. Render the dark hero and transparent header.
2. Add `Sell everywhere people shop. Online and in person.` with muted continuation copy.
3. Add the brand card, then `Sell more in more places` and its media/card grid.
4. Add `Grow around the world` with a dark map/device illustration panel.
5. Add `For anyone from entrepreneurs to enterprise`, then a centered small CTA.
6. Add the purple Sidekick section and two media tiles.
7. Add the deep-blue `Hyperdriven by AI. Commerce to the core.` product panel.
8. Add the centered `There's no better place for you to build` commerce stats section, then staggered testimonial copy.
9. Add `Build fast on Shopify` and the black footer.

## 5. Interaction and responsive rules

- Links brighten to `#ffffff`; buttons invert or gain a subtle brightness change on hover.
- Cards may lift by 2px, but no large shadow is visible in the reference.
- Media panels use `object-fit: cover`; preserve focal points and never fill a known blank capture with invented content.
- Below 700px, retain one-column text flow, 16px gutters, 28px hero type, and horizontal overflow for logo rows.
- At 700px and above, use a 12-column rail; alternate text/media alignment while keeping the generous vertical gaps.
- Keyboard focus is a 2px white outline with 3px offset.

## 6. Detailed build contract
Global shell: near-black body, exact tokens, 1200px rail, 16px capture gutters, 40-80px desktop gutters.
Recipe 1: transparent header -> dark hero -> Sell everywhere copy -> brand card -> media tile.
Recipe 2: Sell more in more places -> media tile -> three-card row -> world panel -> enterprise CTA.
Recipe 3: purple Sidekick band -> media tiles -> deep-blue AI panel -> stats/testimonials -> CTA/footer.
Header: 28px, tiny muted links, white Start free trial pill, transparent over hero.
Hero: 136px captured height, left 16px heading, muted lines, small CTA, dark overlay.
Editorial panel: 5px radius, 1px translucent border only when visible, 16px padding, reserved media area.
Three-card row: equal cards, 2-column desktop, narrow capture side by side, compact 7-11px copy.
Sidekick band: full purple section, two dark media cards, outlined Pick a plan pill.
Footer: black, thin top border, mark, 4-5 columns, legal links and social hit areas.
Use exact existing colors `--page:#02090b`, `--panel:#062324`, `--violet:#35009b`, `--line:rgba(244,245,242,.14)`.
Links brighten to white; buttons invert/brighten; cards lift at most 2px; focus is white 2px offset 3px.
Below 700px keep 16px gutters and 28px hero; above use 12-column rail and alternating media.
Voice is confident: `Be the next household name`, `Sell everywhere`, `Pick a plan`.
Hard avoids: admin dashboard, checkout, generic gradients, made-up commerce stats, or low-detail UI.
Reference Caveats

- `references/home.jpg` is a long, narrow capture; its large dark spaces may be intentional editorial pacing or below-fold media capture behavior. Do not infer missing modules from them.
- Several product panels are visibly dark/low-detail and may be lazy-loaded or video frames. Reproduce the visible frame treatment, not an imagined product UI.
- This specification covers the supplied home page only; checkout, admin, account, and product detail screens are unknown.
