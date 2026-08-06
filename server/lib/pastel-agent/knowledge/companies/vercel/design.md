# Vercel UI - Design Replication Specification

## 0. Ground truth and scope

Replicate `references/home.jpg`. It is a stark white Vercel marketing page for agentic infrastructure. The page uses a black triangle motif, very large whitespace, thin typography, customer logos, alternating product narratives, and sparse product screenshots.

## 1. CSS tokens

```css
:root {
  --black: #000; --ink: #171717; --muted: #666; --page: #fff;
  --line: #eaeaea; --soft: #fafafa;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;
  --r-sm: 4px; --r-md: 6px; --r-full: 999px;
  --sans: Geist, Inter, Arial, sans-serif; --max: 1200px;
}
```

## 2. Typography and layout

- Geist or a close grotesk. Hero heading: 44px, weight 500, line-height .95, letter-spacing -.055em.
- Section headings: 32px, weight 500, line-height .98, tight tracking. Body: 13px, line-height 1.35.
- Nav and feature labels are 10px to 12px. Use black text and no decorative color except the black triangle.
- Use a `max-width:1200px` rail and 10px desktop gutters in the screenshot. Mobile uses 16px gutters.
- Layout deliberately uses 120px to 260px blank gaps between narrative blocks. Do not compact it into a normal SaaS landing page.

## 3. Signature components

### Header

Minimal white header, 28px to 32px high. Left links: `Products`, `Resources`, `Enterprise`, `Pricing`. Right: `Get a Demo`, `Log in`, black `Sign Up`. Text is tiny and gray/black.

### Hero

Three-column feel: left `Agentic Infrastructure`, center solid black equilateral triangle, right lines `For coding agents`, `To ship apps and agents`, `Automated by agents`. CTA buttons sit under the left heading. The triangle must be geometric, flat black, and centered vertically.

### Logo strip

A one-line row of monochrome customer marks, evenly distributed with large gaps. Use actual supplied logos only when available; otherwise use text placeholders with matching visual weight.

### Narrative feature blocks

Use oversized headings such as `Build agents on infrastructure that thinks like them` and `Ship apps that scale from zero to millions instantly`. Alternate left/right copy and media. Product captures are pale, thinly bordered browser-like panels with very low contrast.

## 4. Screen recipe

Header -> hero -> logo strip -> agent infrastructure block with a Notion-like screenshot -> shipping block with Zapier copy -> continued narrative sections -> lower CTA/footer. The visible screenshot ends with large white areas after the shipping copy; preserve their proportions rather than filling them with invented content.

## 5. Interaction and responsive rules

- Primary CTA is black with white text; secondary CTA is white with a 1px gray border.
- Links underline on hover. Buttons darken by 8% on hover and compress 1px on press.
- Preserve the triangle at desktop; on mobile reduce it to 96px and place it between hero copy and supporting copy.
- Alternating feature blocks become one column below 760px. Keep media after its corresponding copy.
- Use 1px black focus outline with 2px offset.

## 6. Detailed build contract
Global shell: white page, exact tokens, 1200px rail, tiny header, 10px desktop and 16px mobile gutters.
Recipe 1: header -> three-column triangle hero -> CTA pair -> logo strip -> infrastructure narrative -> footer.
Recipe 2: shipping heading -> pale product frame -> Zapier/copy block -> visible narrative -> CTA/footer.
Recipe 3: centered demo title -> CTA buttons -> customer marks -> sparse narrative rows -> black footer.
Header: 32px, tiny gray/black links, black 34px Sign Up, 10-12px labels.
Triangle hero: left 44px heading/CTAs, centered flat black equilateral triangle, right supporting lines.
Logo strip: one line, monochrome marks, evenly distributed, horizontal scroll below 760px.
Narrative block: alternating copy/media, 32px heading, 13px body, thin pale browser-like frame.
CTA button: black filled or white 1px line, 34-40px high, 4-6px radius, 1px press compression.
Footer: sparse links, legal copy, black mark, only visible navigation/customer groups.
Use exact existing colors `--black:#000`, `--ink:#171717`, `--muted:#666`, `--line:#eaeaea`.
Links underline on hover; buttons darken 8% and press 1px; focus is a 1px black outline offset 2px.
Below 760px stack blocks with media after copy and triangle at 96px; at 480px use 16px gutters.
Frames stay low contrast and dimensioned while loading; do not brighten them into dashboards.
Voice is sparse and technical: `Agentic Infrastructure`, `Build agents`, `Ship apps that scale`.
Hard avoids: billing UI, fake agent workflow, colorful gradients, rounded dashboard panels, invented white-space content.
Reference Caveats
- The triangle is flat geometry with no texture, glow, or gradient.
- Customer marks match visual weight and remain monochrome.
- Pale frames reserve dimensions but never reveal invented dashboard content.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.

- The large Nike-like blank lower sections in `home.jpg` are capture caveats, not design requirements or intentional empty components.
- The screenshot proves only the visible homepage narrative and header. Do not infer a dashboard, billing UI, or a specific agent workflow from blank regions.
- Pale product frames may be deliberately low contrast or incomplete captures; preserve that uncertainty.
