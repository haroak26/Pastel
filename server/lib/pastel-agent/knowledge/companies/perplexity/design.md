# Perplexity UI - Design Replication Specification

## 0. Source status

The supplied `references/home.jpg` is a Cloudflare security verification screen for `www.perplexity.ai`, not a reliable Perplexity product design source. This document specifies only the observable verification-state shell. Product UI is unknown.

## 1. CSS tokens

```css
:root {
  --page:#fff; --ink:#1f1f1f; --muted:#4b4b4b; --line:#d8d8d8;
  --link:#1a49a5; --control:#fff; --cloudflare:#f38020;
  --sans: Arial, Helvetica, sans-serif;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-6:24px; --space-8:32px; --r-sm:2px;
}
```

## 2. Observable shell

- White page, black/dark gray Arial-like type, no visible product navigation.
- Content begins around 15% from the left and 15% from the top on the 1280px reference. Use a max width around 896px.
- A small black Perplexity mark and bold `www.perplexity.ai` sit on one line.
- Heading: `Performing security verification`, 24px to 26px bold, with 16px gap below the site label.
- Body: `This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.` at 16px, 1.35 line-height.
- Verification widget is about 300px by 66px, bordered `#d8d8d8`, with a square empty checkbox, `Verify you are human`, Cloudflare mark, and tiny `Privacy`/`Help` links.
- A thin horizontal divider appears near the bottom, above centered Ray ID and `Performance and Security by Cloudflare | Privacy` text.

## 3. Interaction and responsive rules

- Checkbox is a 24px square with 2px dark border and 2px radius. Focus uses a blue 2px outline.
- Privacy and Help links use browser-like blue and underline on hover.
- Stack site label and heading naturally below 640px; widget becomes `min(300px, 100%)`.
- Do not add loading spinners, navigation, chat controls, or product cards.

## Reference Caveats

- This capture is an access/verification block controlled by Cloudflare. It cannot establish Perplexity's typography, colors, information architecture, or product interaction model.
- Product UI, homepage content, search results, account states, and error states are unknown and must not be inferred from the blank page area.
