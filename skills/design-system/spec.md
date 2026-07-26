# Latte Design System (LDS)

> **One unified system for every Latte page — marketing, auth, and app.**
>
> The problem we're solving: prior pages were designed in isolation. Every page
> had different paddings, different type scales, different buttons, different
> card radii. Nothing felt like the same product. LDS LDS is a single system
> every page consumes via four mechanisms only:
>
> 1. **CSS tokens** in `client/src/index.css` (`:root { --… }`)
> 2. **Utility classes** (`lds-…`) in the same file
> 3. **Design tokens** in `client/src/lib/design-tokens.ts` (for JS consumers)
> 4. **Primitives** in `client/src/components/ds.tsx`
>
> If a page needs a component not in `ds.tsx`, **add it to `ds.tsx` first** —
> do not invent a one-off styled element in the page. No exceptions.

---

## 1. Brand Identity (Preserved)

These elements of the Latte brand are frozen. Do not change them.

| Token                 | Value                 | Notes                                   |
| --------------------- | --------------------- | --------------------------------------- |
| **Logo (mark)**       | 2×2 tile grid (varying opacity) | Components: `LatteLogo`, `LatteLogoDark`, `LatteLogoMark`, `LatteLogoMarkDark` |
| **Brand color**       | `#4682B4`             | CSS: `hsl(var(--brand))` — "Latte Blue" |
| **Product wordmark**  | `Latte`, Inter 700, `-0.3px` tracking |                                  |

Everything else in this document is fair game to refine, but these are invariant.

---

## 2. Preserved Primitive Components

The four components below are **shape-locked** — they keep the same visual
API. You may only change their internals if it improves adherence to the rest
of this system.

1. `components/button.tsx` — primary button (`<Button>`)
2. `components/secondary-button.tsx` — secondary button (`<SecondaryButton>`)
3. `components/icon-button.tsx` — icon button (`<IconButton>`)
4. `components/text-input.tsx` — text input + textarea (`<TextInput>`, `<Textarea>`)

And the preserved structural components:

- `components/LatteLogo.tsx` — logo variants
- `components/Sidebar.tsx` — 220px fixed app sidebar (logo slot, nav, footer)
- `components/AppLayout.tsx` — sidebar-plus-main frame used by every app page
- Landing page (`pages/Landing.tsx`)
- Sign-in page (`pages/Login.tsx`)
- Sign-up page (`pages/Register.tsx`)

Every other page composes from the DS primitives below.

---

## 3. Foundations

### 3.1 Color

| Token                       | Value                    | Usage                                                        |
| --------------------------- | ------------------------ | ------------------------------------------------------------ |
| `--brand`                   | `207 44% 49%` (#4682B4)  | Brand accents, links, primary CTAs *in marketing context*    |
| `--brand-muted`             | `brand / 0.10`           | Brand-tinted backgrounds (chips, soft fills)                 |
| `--foreground`              | `0 0% 12%`               | Body & heading ink                                           |
| `--fg-muted`                | `225 5% 44%`             | Secondary text, body copy in dense areas                     |
| `--fg-subtle`               | `225 6% 57%`             | Tertiary text, captions, metadata                            |
| `--fg-faint`                | `220 9% 78%`             | Placeholders, disabled, faint separators                     |
| `--background`              | `0 0% 100%`              | Page canvas                                                  |
| `--surface-muted`           | `0 0% 98%`               | Soft card fills, table header rows                           |
| `--surface-subtle`          | `220 20% 97%`            | Chip pills, label pills, soft dividers                       |
| `--surface-hover`           | `220 14% 96%`            | Hover state on rows, ghost buttons, nav items                |
| `--border`                  | `220 14% 91%`            | Default hairline border                                      |
| `--border-subtle`           | `220 14% 95%`            | Inner separators in cards, row-in-row                        |
| `--primary`                 | `0 0% 12%`               | Dark-ink CTA surface (app-wide primary button)               |
| `--primary-foreground`      | `0 0% 97%`               | Text on `--primary`                                          |
| `--success`                 | `152 60% 40%` (#1F9D69)  | Resolved, connected, saved                                   |
| `--warning`                 | `32 92% 48%` (#E78A13)   | Pending, at-risk                                             |
| `--danger`                  | `0 72% 51%` (#DC2B2B)    | Errors, destructive actions, incidents                       |
| `--info`                    | = `--brand`              | Informational notes                                          |

**Rules:**

- There are two "primary" surfaces used for CTAs:
  - **In-app primary button** → `--primary` (dark ink on `--primary-foreground`).
  - **Brand accents / links / highlights** → `--brand` (the blue). Do not use
    the blue as the background of app-wide primary buttons; the preserved
    `<Button>` is dark-ink.
- Semantic tones always use their `-muted` variant as the background; never
  use full saturation as a background fill.
- Never use pure `#000` or pure `#FFFFFF` for text; always use `--foreground`.

### 3.2 Typography

Primary typeface: **Inter**, variable weights 400–900.
Serif display: **Instrument Serif** (reserved for one-off marketing moments, use sparingly).

| Class          | Size / Weight / LH / Tracking                  | Use                                           |
| -------------- | ---------------------------------------------- | --------------------------------------------- |
| `.lds-display`  | 52 / 500 / 1.05 / -0.03em                      | Marketing hero H1                             |
| `.lds-h1`       | 40 / 500 / 1.08 / -0.03em                      | Marketing section H2                          |
| `.lds-h2`       | 28 / 500 / 1.15 / -0.025em                     | Marketing small section, CTA heading          |
| `.lds-h3`       | 21 / 600 / 1.25 / -0.015em                     | App page title, modal title                   |
| `.lds-h4`       | 15 / 600 / 1.30 / -0.01em                      | App section title                             |
| `.lds-body`     | 13.5 / 500 / 1.65 / — (muted)                  | Body copy (secondary ink)                     |
| `.lds-body-primary` | 13.5 / 500 / 1.65 / — (primary)            | Body copy (primary ink)                       |
| `.lds-caption`  | 12 / 500 / 1.5 (subtle)                        | Metadata, hints                               |
| `.lds-meta`     | 11.5 / 500 / 1.4 (subtle)                      | Timestamps, version tags                      |
| `.lds-eyebrow`  | 11 / 700 / 0.1em uppercase (brand)             | Marketing section eyebrow                     |
| `.lds-section-label` | 11 / 700 / 0.08em uppercase (subtle)      | In-app section/sidebar labels                 |

Rules:
- Never use `<h1>` with ad-hoc inline font sizes. Use the `.lds-*` classes or the
  primitive that wraps them (`<PageHeading>`, `<MarketingHero>`, etc.).
- Avoid serif. Only introduce serif when there's an explicit editorial reason.
- Body copy max-width on marketing pages is ~520px. Don't let marketing body
  paragraphs span the full 1060px.

### 3.3 Spacing

4-based scale. Never invent values in between.

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`

In-app page frame:
- Content padding: **24px** (mobile) → **32px** (md+)
- Max content width for normal pages: **1060px**
- Max content width for settings / text-heavy: **720px**
- Max content width for auth forms: **400px**

### 3.4 Radius

| Token        | Value  | Used on                                         |
| ------------ | ------ | ----------------------------------------------- |
| `radius.sm`  | 6px    | Inline tags, chips-inside-chips                 |
| `radius.md`  | 8px    | Small buttons, icon buttons, small chips        |
| `radius.lg`  | 10px   | **Default** — inputs, secondary buttons, rows   |
| `radius.xl`  | 12px   | Primary buttons, cards                          |
| `radius.2xl` | 14px   | Prominent CTAs, hero cards                      |
| `radius.full`| 9999   | Pills, badges, avatars                          |

**Rule:** Cards are always `12px`. Inputs and row-level controls are always `10px`.
Buttons use `12px` at normal size and `10px` at small size. Do not mix.

### 3.5 Elevation / Borders

LDS LDS is a **hairline-border system**, not a shadow system. All shadows from
older Tailwind classes are nulled in `index.css`.

- Default surface separation: 1px `--border` hairline.
- A card never has a drop shadow.
- Hover elevation = `--surface-hover`. Never a shadow on hover.
- Exception: focus rings use a 3px `brand / 0.18` outline (baked into primitives).

### 3.6 Motion

- Transition duration defaults:
  - `transitions.fast` 120ms — micro (hover color change)
  - `transitions.normal` 150ms — buttons, inputs
  - `transitions.slow` 220ms — page enter, modal enter
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for springy enter; `ease-out` for hovers.
- Respect `prefers-reduced-motion`. Framer Motion is OK for marketing pages
  (Landing uses it), but every in-app page uses CSS transitions only.

---

## 4. Layouts

### 4.1 App Layout (every page inside `/dashboard` and `/account`)

Always wrap in `<AppLayout>` (which renders the preserved `<Sidebar>`), then
compose:

```tsx
<AppLayout>
  <AppPage>
    <AppTopbar title="Open Tickets" actions={<...>} />
    <AppBodyPadded>
      <PageHeading title="Open Tickets" description="…" actions={<...>} />
      <Section title="…" description="…">
        …
      </Section>
    </AppBodyPadded>
  </AppPage>
</AppLayout>
```

Invariants:
- The 48px **top bar** is on *every* page. It's the anchor of the app.
- Below the top bar, `<AppBodyPadded>` gives a centred 1060px column with 24/32
  padding. No page overrides this padding.
- `<PageHeading>` is the only way to render a page title inside the body.
- Sections separate with a 1px `--border` hairline, 32px vertical padding.

### 4.2 Marketing Layout

Every marketing page uses `<Layout>` from `components/Layout.tsx`, then a
sequence of `<MarketingHero>` → `<MarketingSection>`s → `<MarketingCTA>`.

Invariants:
- Hero pt 20–24, pb 16–20 on mobile → 24/20 on md+.
- Sections are separated by the shared `border-t border-border py-20 md:py-28`
  pattern (baked into `<MarketingSection>`).
- Marketing pages always end with `<MarketingCTA>`.

### 4.3 Auth Layout

Centered single-column (max 400px) on white background.
- Logo mark + wordmark as single link back to `/` (already the pattern in Login).
- Header pair: `lds-h3` title + `lds-body` subtitle.
- Stack of preserved `<TextInput>` + preserved `<Button>`.
- Tertiary link (e.g. "Don't have an account?") uses `lds-caption` + underlined link.
- Never a card on auth pages — just a plain centered stack.

---

## 5. Component Guarantees

When you build a new page, **use these components only**. Do not recreate them.

| Purpose                    | Component                  | Source                       |
| -------------------------- | -------------------------- | ---------------------------- |
| Primary CTA                | `<Button>`                 | `components/button.tsx`      |
| Secondary CTA              | `<SecondaryButton>`        | `components/secondary-button.tsx` |
| Icon-only action           | `<IconButton>`             | `components/icon-button.tsx` |
| Text input / textarea      | `<TextInput>`, `<Textarea>` | `components/text-input.tsx` |
| App page frame             | `<AppPage>`                | `components/ds.tsx`          |
| App top bar (48px)         | `<AppTopbar>`              | `components/ds.tsx`          |
| App body (scroll)          | `<AppBody>`                | `components/ds.tsx`          |
| App body (padded, 1060px)  | `<AppBodyPadded>`          | `components/ds.tsx`          |
| App body (narrow, 720px)   | `<AppBodyNarrow>`          | `components/ds.tsx`          |
| Page heading               | `<PageHeading>`            | `components/ds.tsx`          |
| Section                    | `<Section>`                | `components/ds.tsx`          |
| Card                       | `<Card>` + `<CardHeader>` + `<CardBody>` + `<CardFooter>` | `components/ds.tsx` |
| Row with label + control   | `<FieldRow>`               | `components/ds.tsx`          |
| Status badge               | `<Badge>` (tones: neutral/brand/success/warning/danger/info) | `components/ds.tsx` |
| Marketing eyebrow pill     | `<Eyebrow>`                | `components/ds.tsx`          |
| Empty state                | `<EmptyState>`             | `components/ds.tsx`          |
| Stat card                  | `<StatCard>`               | `components/ds.tsx`          |
| Data table                 | `<DataTable>`              | `components/ds.tsx`          |
| In-page toolbar            | `<Toolbar>` + `<ToolbarGroup>` | `components/ds.tsx`      |
| Filter tab chip            | `<FilterChip>`             | `components/ds.tsx`          |
| Marketing section          | `<MarketingSection>` + `<MarketingSectionHead>` | `components/ds.tsx` |
| Marketing hero             | `<MarketingHero>`          | `components/ds.tsx`          |
| Marketing bottom CTA       | `<MarketingCTA>`           | `components/ds.tsx`          |
| Feature grid (2/3 col)     | `<FeatureGrid>`            | `components/ds.tsx`          |

---

## 6. Rules of Thumb

1. **No inline `style={{ color/font/padding/border }}`** on new code. Inline
   pixel-precise width/position is fine. Everything visual goes through
   Tailwind utility classes or DS classes.
2. **No new button.** If you need a variant, either:
   - use `<Button>` or `<SecondaryButton>`, or
   - add a variant to the component itself.
3. **No new "card" component.** Use `<Card>`.
4. **No page-local `ColorMap`, `borderRadius`, `typography` objects.** All
   tokens live in `design-tokens.ts` and are reflected in CSS.
5. **Every in-app page has `<AppTopbar>`.** The only exceptions are `Login`,
   `Register`, `ForgotPassword`, `ResetPassword`, `LoadingVerification`, and
   `CompleteGithubSignup`.
6. **Empty states are `<EmptyState>`.** Not a custom div.
7. **Tables are `<DataTable>`.** Not custom `<table>`.
8. **Do not lift the sidebar.** The sidebar is preserved as-is.
9. **Accessibility is non-negotiable.** Interactive elements must have visible
   focus (handled by primitives), labelled inputs, and hit targets ≥ 32×32.
10. **Dark mode is out of scope for LDS.** We target the single light theme only.

---

## 7. Migration Checklist

When you rebuild a page:

- [ ] Replace any page-local `colors`/`typography` token usage with Tailwind
      classes or tokens imported from `design-tokens.ts`.
- [ ] Wrap the app page body with `<AppPage><AppTopbar /><AppBodyPadded>…`.
- [ ] Replace custom `<h1>` with `<PageHeading>` (app) or `.lds-display` (marketing).
- [ ] Replace ad-hoc buttons with `<Button>` / `<SecondaryButton>` / `<IconButton>`.
- [ ] Replace inline empty states with `<EmptyState>`.
- [ ] Replace inline `<table>` with `<DataTable>`.
- [ ] Replace pill/badge elements with `<Badge>`.
- [ ] Remove any `box-shadow`.
- [ ] Confirm page looks identical on mobile and desktop with zero horizontal scroll.

---

## 8. Quick Visual Check

A page passes the unified-look test when, beside any other Latte page:

- The **top bar** (in-app) is in the same place, same height, same type.
- The **page title** size is the same.
- The **buttons** are the same.
- The **cards** have the same corner radius.
- The **body copy** is the same color and size.
- The **eyebrow / section labels** are the same typographic style.

If any of those differ, the page is broken — don't ship it.
