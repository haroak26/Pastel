# Replit UI - Design Replication Specification

## 0. Ground truth and scope

Use `references/home.jpg` and `references/ai.jpg`. The system is warm off-white with bright orange/red actions, rounded editorial cards, dark navy and coral feature panels, and a strong builder-first message. The AI page uses the same header and footer but a much more sparse, pale capture with some washed-out media.

## 1. CSS tokens

```css
:root {
  --page: #faf7f2; --paper: #fff; --ink: #171723; --muted: #77747a;
  --orange: #ff4f18; --coral: #ffad98; --red: #ff6540; --lavender: #ded9d8;
  --navy: #282733; --line: #e7dfd9;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px;
  --space-8:32px; --space-12:48px; --space-16:64px; --space-24:96px;
  --r-sm:6px; --r-md:12px; --r-lg:22px; --r-full:999px;
  --sans: Inter, Arial, sans-serif; --max: 1180px;
}
```

## 2. Typography and layout

- Use a rounded modern sans. Main hero is 42px to 52px, weight 400, line-height .98, centered. Section headings are 26px to 34px.
- Body is 13px to 15px, line-height 1.35. CTA labels are 11px to 13px, medium.
- Use 20px mobile gutters and a 32px to 56px desktop rail. Rounded panels are a defining characteristic.

## 3. Signature components

### Header

White/warm header: Replit orange cross plus wordmark at left, `Products`, `For Work`, `Resources`, `Security`, `Pricing`, `Careers`, orange `Agent` badge, `Contact sales`, `Log in`, and outlined/orange `Create account` or `Sign up` button.

### Builder prompt

Centered `What will you build?` hero with small subtitle and a large rounded prompt input. Input has a plus icon, placeholder `Build a website for...`, orange circular action at right, and small capability icons below. Follow with a grayscale customer logo strip.

### Agent 4 feature mosaic

`Meet Agent 4` sits above four irregular rounded tiles: large coral `Design Freely`, pale gray `Move faster`, dark navy `Ship Anything`, and bright orange `Build together`. Tiles use large type, tiny explanatory copy, and simple line illustrations.

### Platform cards and proof

Four equal rounded cards under `Powered by the Replit platform` use white, gray, pale coral, and orange surfaces. Testimonial is a white rounded panel. A later `Start Small. Scale Fast.` panel is a large white rounded rectangle with a mostly empty media area.

## 4. Screen recipes

### Home

Header -> prompt hero -> logos -> `Meet Agent 4` mosaic -> platform cards -> trusted-by testimonial -> large scale panel -> `What are you waiting for?` orange CTA -> footer.

### AI

Header -> centered `The best Agent for building production-ready apps` -> orange CTA -> partner logos -> alternating sparse capability copy and pale media blocks -> testimonials -> `What is Replit Agent?` FAQ accordion -> CTA -> footer.

## 5. Interaction and responsive rules

- Orange buttons darken slightly on hover and use a 1px downward press movement.
- Rounded tiles can lift 2px; do not add shadows to every card.
- Prompt field expands vertically when focused and keeps the action button visible.
- Below 760px, mosaic tiles become one column, platform cards become a horizontal snap row or one column, and nav links collapse behind a menu.
- FAQ rows have 48px minimum height and a plus icon that rotates to an x when open.
- Focus ring is orange with 2px offset.

## 6. Detailed build contract
Global shell: warm off-white page, exact tokens, 1180px rail, 32-56px desktop and 20px mobile gutters.
Recipe 1: header -> builder prompt -> logos -> Agent mosaic -> platform cards -> testimonial -> scale panel -> CTA/footer.
Recipe 2: header -> Agent hero -> CTA -> partner logos -> alternating media/copy -> testimonials -> FAQ -> footer.
Recipe 3: header -> feature title -> capability media -> four platform cards -> proof -> scale panel -> footer.
Header: 64px, orange cross/wordmark, product links, Agent badge, login, account CTA right.
Builder prompt: centered heading, 56px rounded input, plus left, placeholder, orange circular action right.
Agent mosaic: four irregular rounded tiles with coral, gray, navy, orange surfaces and short copy.
Platform card: 22px radius, 24px padding, white/gray/coral/orange surface, title and body.
FAQ row: 48px minimum, plus right, expanded body below, no editor controls.
Footer: warm/dark contrast, link columns, legal/social row, one final CTA where visible.
Use exact existing colors `--orange:#ff4f18`, `--navy:#282733`, `--coral:#ffad98`, `--line:#e7dfd9`.
Orange buttons darken and press down; tiles lift 2px; focus is orange with 2px offset.
Prompt expands while focused; below 760px mosaic stacks and nav collapses; cards snap or stack.
Keep media proportions while loading; never fill empty panels with speculative code or charts.
Voice is builder-first: `What will you build?`, `Ship anything`, `Start small. Scale fast.`
Hard avoids: editor, file tree, billing table, excessive shadows, or invented washed-out media.
Reference Caveats

- The AI reference contains washed-out and blank-looking media panels. Treat these as incomplete/blocked capture states, not deliberate blank product surfaces.
- The large blank lower panel in the home reference is visible but does not establish its contents. Preserve its container proportions without inventing a chart or demo.
- Authenticated workspace, editor, and billing views are outside the supplied marketing references.
