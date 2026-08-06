# Cursor UI - Design Replication Specification

## 0. Ground truth and scope

Use `references/home.jpg`. This is a warm off-white, editorial product-marketing page for the Cursor coding agent. It mixes dark small nav text, large product screenshots, orange links, testimonial cards, release rows, and generous whitespace.

## 1. CSS tokens

```css
:root {
  --page: #f8f8f5; --panel: #f1efec; --ink: #20201d; --muted: #6f706c;
  --orange: #e97745; --line: #dfddd8; --white: #fff;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;
  --r-sm: 3px; --r-md: 6px; --r-lg: 10px; --r-full: 999px;
  --sans: Inter, Helvetica Neue, Arial, sans-serif; --max: 1180px;
}
```

## 2. Typography and global layout

- Use a quiet grotesk. Hero: 15px to 18px in the narrow capture, 46px desktop, weight 400, line-height 1.0, tight tracking.
- Feature headings: 22px to 32px. Body: 12px to 14px. Captions and dates: 9px to 11px.
- Main rail is 16px mobile and 32px to 64px desktop. Sections have 48px to 120px vertical spacing.
- The overall tone is low contrast and lightly textured; avoid pure bright white cards except where a screenshot panel requires it.

## 3. Signature components

### Header and hero

Header contains Cursor wordmark at left, `Models`, `Product`, `Enterprise`, `Pricing`, `Resources`, and right-side `Sign in`, `Contact sales`, `Download`. Hero says `Cursor is your coding agent for building ambitious software.` with a dark `Download for macOS` pill and pale `Request a demo` pill. Keep hero left aligned.

### Product screenshot frame

Large screenshots sit in pale gray or warm-gray rectangles with 4px to 8px radius. The actual IDE surface is a white/gray floating window with dark text, tabs, code blocks, and soft drop shadows. Never use a generic dashboard card. Surrounding image padding is visible.

### Logo strip and two-column stories

Use a thin logo strip (`stripe`, `Linear`, `NVIDIA`, `Figma`, etc.) in monochrome. Feature stories alternate copy and screenshots. Orange `Learn about agents` and `Explore enterprise` links are the only strong color.

### Testimonials and releases

Testimonials are three pale cards with compact quoted text and author rows. The release/news row is a four-column low-contrast grid with date, title, and muted category. Use 1px lines, not heavy shadows.

## 4. Screen recipe

Header -> hero and screenshot -> logo strip -> `Agents turn ideas into code` story -> `Works autonomously, runs in parallel` story -> `In every tool, at every step` story -> `Fix it failures on main` story -> `The new way to build software.` testimonials -> `Stay on the frontier` cards -> research block -> `Try Cursor now.` CTA -> multi-column footer.

## 5. Interaction and responsive rules

- Orange links underline on hover. Dark CTA brightens slightly; pale CTA gains a darker border.
- Screenshot frames scale on hover by no more than 1%; do not add glossy motion.
- Below 720px, stories become one column with copy above media, logo strip scrolls horizontally, and testimonials become a horizontal snap row.
- Navigation condenses to wordmark, download button, and menu button below 600px.
- Focus ring: 2px orange, 2px offset.

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
- Keep screenshot frames at their ratios and reserve height before loading.
- Align story copy and release rows to the same max rail with 1px rules.
- Orange is the only strong UI accent outside screenshot artwork.
- Keep download, sign-in, and menu actions at 36px minimum hit areas.
- Empty IDE frames remain empty and low contrast.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.

- Several long gaps and pale media surfaces are visible in the supplied capture. They may represent deliberate editorial spacing, unloaded media, or the capture ending; do not populate them with speculative sections.
- The reference covers marketing pages, not the Cursor desktop application itself. IDE panels shown in screenshots are illustrative media only.
