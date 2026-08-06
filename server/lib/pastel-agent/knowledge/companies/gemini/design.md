# Gemini UI - Design Replication Specification

## 0. Ground truth and scope

Replicate `references/home.jpg`, a sparse Gemini landing shell. The page is white with a soft blue atmospheric glow behind the composer. It contains no visible conversation history or answer content.

## 1. CSS tokens

```css
:root {
  --page:#fff; --ink:#303038; --muted:#66666d; --blue:#d8efff;
  --composer:#fff; --line:#e4e4e7; --link:#414148;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;
  --r-md:12px; --r-lg:28px; --r-full:999px;
  --sans: Google Sans, Inter, Arial, sans-serif;
}
```

## 2. Typography and layout

- Use Google Sans or a rounded sans fallback. Hero heading `Where should we start?` is 30px, weight 400, line-height 1.2, centered.
- Nav links are 16px, muted dark gray. Composer text is 16px. Footer legal text is 13px.
- Header is 64px high with 24px horizontal padding. The main composer zone is centered both horizontally and approximately vertically, with a broad pale blue glow extending around it.

## 3. Signature components

### Brand rail

Top-left has the multicolor Gemini sparkle icon and a smaller gray circular assistant/utility icon below it. Top-right links read `About Gemini`, `Get Gemini App`, `Subscriptions`, `For Business`, followed by a pale blue `Sign in` pill.

### Composer

Center heading above a 660px by 64px desktop pill. The pill is white, has a subtle gray border and shadow, and contains plus icon, `Ask Gemini`, `Flash-Lite`, a down chevron, and microphone icon. On mobile it is full width with 16px side margins.

### Legal/footer controls

Bottom-left has gear and account icons. Bottom center has `Google Terms and the Google Privacy Policy apply. Gemini is AI and can make mistakes.` with underlined policy links. Keep it pinned to the viewport only if the page has no scrollable content, matching this shell.

## 4. Screen recipe

Render the white viewport -> header links -> centered blue glow -> heading -> composer -> bottom legal notice and utility icons. Do not add suggested prompts, chat history, cards, or an answer panel because none are visible.

## 5. Interaction and responsive rules

- Composer receives a soft blue focus ring and grows in height when text wraps.
- Sign-in pill changes to a slightly darker blue on hover. Header links underline on hover.
- On screens below 700px, hide secondary nav links behind a menu or allow horizontal wrapping, make composer `calc(100% - 32px)`, and keep the heading at 26px.
- Respect safe-area insets for bottom legal text.

## 6. Detailed build contract
Global shell: white viewport, exact existing tokens, 64px header, 24px padding, centered composer.
Recipe 1: header -> blue glow -> heading -> composer -> utility icons and legal notice.
Recipe 2: focused heading -> expanded composer -> wrapped input state -> legal notice.
Recipe 3: mobile header/menu -> 26px heading -> full-width composer -> safe-area legal text.
Header geometry: mark and utility left, secondary links right, pale blue sign-in pill, no product sidebar.
Composer geometry: 660x64px desktop, white, 1px line, 28px radius, plus/model/mic hierarchy.
Legal geometry: 13px centered copy, 480px maximum, underlined policy links, safe-area bottom padding.
Use exact existing colors `--page:#fff`, `--ink:#303038`, `--blue:#d8efff`, `--line:#e4e4e7`.
Typography uses the existing Google Sans fallback and stated 30px heading, 16px composer, 13px legal sizes.
Spacing uses the existing 4px scale; do not add visible cards around the atmospheric glow.
Focus gives the composer a soft blue ring; links underline on hover; keyboard focus is a 2px blue outline.
Below 700px hide or wrap secondary links and set composer width to `calc(100% - 32px)`.
Keep controls reachable and never let legal text overlap the composer or utility buttons.
Voice is neutral and helpful: `Ask Gemini`, `About Gemini`, and the exact visible disclaimer.
Hard avoids: suggested prompts, answer cards, chat history, settings panels, sidebar, or fabricated illustration.
Loading must preserve composer height and never turn blank white space into a content module.
Reference Caveats
- Composer remains the only primary input and retains its desktop width until mobile.
- Plus, model, chevron, and microphone remain one control hierarchy.
- The blue area is a soft glow with no hard-edged illustration.
- Legal copy must not imply signed-in history or available answers.
- Reference Caveats: blank and unloaded intervals are excluded from design inference.

- Only the unauthenticated landing shell is visible in `home.jpg`. Product conversations, settings panels, model selection menus, and signed-in states are unknown.
- The blue area is a soft atmospheric background glow, not evidence of a specific illustration or gradient card.
