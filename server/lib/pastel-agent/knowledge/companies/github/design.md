# GitHub UI - Design Replication Specification

## 0. Ground truth and scope

Use `references/home.jpg` and `references/features.jpg`. The home capture is a black developer-platform marketing page with electric purple/blue light, tiny utility navigation, centered copy, large media frames, feature grids, and a green-accent footer. The features capture confirms the same system with category sections.

## 1. CSS tokens

```css
:root {
  --bg: #000000; --surface: #071109; --surface-2: #11151f;
  --white: #f0f0f0; --muted: #9a9a9a; --green: #3fb950;
  --purple: #8250df; --blue: #2f81f7; --border: #242424;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;
  --space-16: 64px; --space-24: 96px;
  --r-sm: 4px; --r-md: 6px; --r-lg: 8px; --r-full: 999px;
  --sans: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
  --max: 1160px;
}
```

## 2. Typography and global layout

- Use GitHub system sans. Hero heading is 28px to 34px, weight 600, line-height 1.05, centered.
- Section headings are 20px to 24px, weight 500, centered. Body is 10px to 13px with 1.35 line-height.
- All text is white or gray on black. Green is reserved for accents and footer borders; purple and cyan belong to media artwork.
- Main rail is `min(100% - 32px, 1160px)`. Sections have 72px to 128px vertical padding.

## 3. Signature components

### Header and hero

The header is approximately 30px tall, with GitHub mark at left, small links (`Solutions`, `Resources`, `Open Source`, `Enterprise`, `Pricing`), and compact outlined/sign-in controls at right. Hero reads `The future of building happens together`, followed by two lines, two compact CTAs, and a purple/blue framed media area.

### Media frame

Use a black or very dark rectangle with a 1px gray border, 4px radius, and a large blurred purple-to-blue glow behind the lower edge. In the capture, some frames are empty dark placeholders. Keep those placeholders empty. Add a tiny circular control at the bottom-right only where visible.

### Feature cards

Cards are dark green-black rectangles with 1px `#18301e` borders, 4px radius, and compact green kicker text. Feature grids are 3 columns on desktop, 2 on tablet, 1 on mobile. Text is left aligned and dense.

### Category sections

Features uses centered category headings (`Collaborative Coding`, `Automation and CI/CD`, `Application security`, `Client apps`, `Project management`, `Governance and administration`, `Community`), followed by a wide colorful media frame and a grid of dark feature cards. Keep media and card grids visually separate.

### Footer

Use a near-black footer with a 1px green top edge, GitHub mark, several small link columns, social icons, and legal text. The footer is much denser than the body.

## 4. Screen recipes

### Home

Header -> centered hero -> large framed product placeholder -> trusted-logo row -> `Accelerate your entire workflow` -> media frame -> two-column feature summary -> `Built-in application security` -> media frame -> `Work together, achieve more` -> three-card enterprise row -> footer.

### Features

Header -> `The tools you need to build what you want` hero -> `Collaborative Coding` category -> purple editor frame and grid -> repeat the category template for automation, security, client apps, projects, governance, and community -> `Ready to get started?` CTA -> footer.

## 5. Interaction and responsive rules

- Buttons use green fill for primary actions and transparent dark fills with borders for secondary actions.
- Media frames can glow brighter on hover; cards use border color `#3fb950` or `#8250df` only on focus/hover.
- Category grids collapse to one column below 700px; media frames retain a minimum 220px height.
- Desktop hero and category headings stay centered. Feature card copy remains left aligned.
- Focus: 2px green outline, 2px offset. Respect reduced motion by disabling glow transitions.

## 6. Detailed build contract
Global shell: black body, exact tokens, 1160px rail, compact utility header, 72-128px section rhythm.
Recipe 1: header -> centered hero -> purple/blue media -> logo row -> workflow/security frames -> cards -> footer.
Recipe 2: header -> features hero -> visible category frame and cards -> repeat grounded categories -> CTA/footer.
Recipe 3: category title -> wide media frame -> three-column feature grid -> compact CTA -> green-edged footer.
Header geometry: tiny mark/links, outlined secondary controls, compact green primary action.
Media frame: dark rectangle, 1px border, 4px radius, minimum 220px mobile height, glow only behind media.
Feature card: dark green-black, 1px `#18301e` border, 4px radius, 16px padding, green kicker then copy.
Category section: centered heading, wide frame, then 3-column cards with consistent gaps.
Footer: near-black surface, 1px green top edge, mark, link columns, social icons, legal copy.
Use exact existing colors `--bg:#000000`, `--white:#f0f0f0`, `--green:#3fb950`, `--purple:#8250df`, `--blue:#2f81f7`.
Typography follows the existing system sans sizes; card copy stays compact and left aligned.
Hover brightens media glow or border; focus is a 2px green outline offset 2px; reduced motion disables glow.
At 700px grids become one column while media stays at least 220px; headings remain centered.
Voice is collaborative and technical: `Build together`, `Automate`, `Ready to get started?`.
Hard avoids: repository dashboard, fake IDE contents, broad gradients, pricing, or invented screens.
Empty frames remain empty; loading preserves frame dimensions and border treatment.
Reference Caveats

- `home.jpg` and `features.jpg` contain dark/empty product frames. Those are visible placeholders or capture states, not permission to invent IDE screens.
- The long lower portions may be cropped or lazy-loaded. Only the named category structure and visible footer are grounded.
- Pricing, repository UI, sign-in, and authenticated dashboard states are not specified by these references.
