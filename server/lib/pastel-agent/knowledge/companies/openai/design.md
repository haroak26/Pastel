# OpenAI UI - Design Replication Specification

## 0. Source status

The supplied `references/home.jpg` is a Cloudflare verification screen with an OpenAI mark. It is not a reliable OpenAI product design source. This document specifies only the observable verification-state shell. Product UI is unknown.

## 1. CSS tokens

```css
:root {
  --page:#fff; --ink:#303030; --muted:#666; --line:#d6d6d6;
  --link:#194b9b; --sans: Arial, Helvetica, sans-serif;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --r-sm:2px;
}
```

## 2. Observable shell

- Entire viewport is white with no visible product navigation or chat UI.
- A pale gray OpenAI knot mark is centered above a Cloudflare verification widget. The screenshot places the group around the center of the viewport.
- Widget is approximately 300px by 66px, white, with a light gray border. It contains an empty square checkbox, `Verify you are human`, Cloudflare branding, and tiny `Privacy` and `Help` links.
- No heading, body paragraph, Ray ID, or footer text is visibly established in this OpenAI capture. Do not copy the Perplexity verification copy into OpenAI.

## 3. Interaction and responsive rules

- Checkbox is 24px square, 2px dark gray border, 2px radius. Use a browser-like checked state only after interaction.
- Widget remains centered and becomes full-width minus 32px on small screens.
- Privacy and Help links are blue/underlined; focus ring is 2px blue with 2px offset.
- Do not add a login button, composer, sidebar, model selector, or marketing content.

## Reference Caveats

- `home.jpg` is a Cloudflare verification screen, not an OpenAI homepage or ChatGPT product screenshot.
- OpenAI product UI, marketing typography, color system, navigation, and authenticated states are unknown from this source.
- The blank white area is the blocked verification page background, not evidence of an intentional OpenAI layout.
