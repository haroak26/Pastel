# Design Tokens Contract

`src/styles.css` defines the full token set as CSS custom properties on `:root`. Treat these tokens as the single source of truth — every color, font, size, and radius in every file references them.

## Token shape

```css
:root {
  /* Colors — hex values from the design system doc */
  --color-background: #faf9f7;
  --color-surface: #ffffff;
  --color-text: #1a1815;
  --color-text-muted: #6b675f;
  --color-border: #e8e5e0;
  --color-accent: #c2553a;
  --color-accent-foreground: #ffffff;

  /* Fonts — Google Fonts family names */
  --font-display: "Fraunces", serif;
  --font-body: "Inter", sans-serif;

  /* Type scale */
  --size-display: 64px;
  --size-h1: 48px;
  --size-h2: 36px;
  --size-h3: 24px;
  --size-body: 16px;
  --size-small: 14px;
  --size-caption: 12px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

## Usage rules

- Colors: `bg-[var(--color-background)]`, `text-[var(--color-text-muted)]`, `border-[var(--color-border)]`, `bg-[var(--color-accent)] text-[var(--color-accent-foreground)]`.
- Type sizes: `text-[var(--size-h2)]` or the matching Tailwind size when identical — prefer the var.
- Radius: `rounded-[var(--radius-md)]`.
- Fonts: display font is applied via inline style on headline elements; body font is inherited from the screen root.
- The accent color is used sparingly: primary buttons, key links, active states — 3 to 7 elements per screen maximum.
- Hairline dividers: `border-b border-[var(--color-border)]`.
