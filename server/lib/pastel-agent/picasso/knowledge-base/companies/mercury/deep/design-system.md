# Mercury Design System — Deep Dive

## Overview

This document specifies the design tokens and component patterns that define Mercury's
visual language. Every value here supports the core brand promise: financial data
presented with trust, precision, and clarity. When in doubt, lean cleaner and simpler.

---

## Color System

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--white` | `#FFFFFF` | Primary page background, card surfaces |
| `--gray-50` | `#F9FAFB` | Secondary backgrounds, table headers, sidebar |
| `--gray-100` | `#F3F4F6` | Hover states, selected rows, subtle card backgrounds |
| `--gray-200` | `#E5E7EB` | Borders, dividers, input borders |
| `--gray-300` | `#D1D5DB` | Disabled borders, stronger separators |
| `--gray-400` | `#9CA3AF` | Tertiary text, placeholder text |
| `--gray-500` | `#6B7280` | Secondary text, metadata, labels |
| `--gray-600` | `#4B5563` | Subheadings, emphasized metadata |
| `--gray-700` | `#374151` | Body text alternative (softer than gray-900) |
| `--gray-800` | `#1F2937` | Primary body text, form labels |
| `--gray-900` | `#111827` | Headings, hero numbers, high-emphasis text |
| `--gray-950` | `#030712` | Maximum contrast (use sparingly, only where required) |

### Accent

| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#3B82F6` | Primary actions, links, active states, focus rings |
| `--accent-hover` | `#2563EB` | Button hover, link hover |
| `--accent-light` | `#EFF6FF` | Accent backgrounds (info banners, selected rows) |

### Semantic (Financial)

| Token | Hex | Usage |
|---|---|---|
| `--positive` | `#059669` | Credits, incoming money, positive balances, growth indicators |
| `--positive-light` | `#ECFDF5` | Positive background treatments, credit rows |
| `--negative` | `#DC2626` | Debits, outgoing money, negative balances, declined transactions |
| `--negative-light` | `#FEF2F2` | Negative background treatments, debit rows |
| `--pending` | `#D97706` | Pending transactions, attention flags, warnings |
| `--pending-light` | `#FFFBEB` | Pending background treatments, warning banners |
| `--info` | `#2563EB` | Informational states, tips, documentation callouts |
| `--info-light` | `#EFF6FF` | Info background treatments |

### The Rules
- Clean white (`#FFFFFF`) is the default surface — never substitute with off-white, cream, or warm gray
- Accent blue is used strictly for interactive/functional purposes — never as decoration
- Semantic colors are unambiguous — green *always* means credit/positive, red *always* means debit/negative
- Never tint, shade, or mute semantic colors to the point of ambiguity
- Never use warm colors (orange, coral, yellow, pink) in the core UI — they undermine financial precision
- Never use gradient backgrounds on cards, pages, or sections (code blocks excepted)
- Dark mode is a secondary, optional mode — the primary design is light

---

## Typography Scale

### Typeface
Clean sans-serif optimized for screen — Inter, SF Pro, or system equivalent:
- Tabular figures enabled (`font-variant-numeric: tabular-nums`)
- Clean geometry, neutral design
- High legibility at small sizes (14px and below)
- Consistent x-height across weights

### Scale

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-xs` | 12px | 400/500 | 1.4 | Timestamps, table metadata, fine print |
| `--text-sm` | 14px | 400/500 | 1.4 | Table body, form labels, secondary UI, category labels |
| `--text-base` | 16px | 400/500 | 1.5 | Body text, form inputs, transaction descriptions |
| `--text-lg` | 18px | 500/600 | 1.4 | Card titles, section headings, emphasized content |
| `--text-xl` | 20px | 600 | 1.3 | Page headings, modal titles |
| `--text-2xl` | 24px | 600 | 1.3 | Dashboard section headers |
| `--text-3xl` | 30px | 600 | 1.2 | Account balance in detail views |
| `--text-4xl` | 36px | 600/700 | 1.1 | Hero balance on dashboard (primary CTA) |
| `--text-5xl` | 48px | 600/700 | 1.0 | Hero balance on marketing pages |
| `--text-6xl` | 56px | 600/700 | 1.0 | Maximum emphasis (landing page hero only) |

### Type Rules
- Tabular figures must be used for ALL numeric data displays — columns must align
- Weight hierarchy: Regular (400) for body, Medium (500) for emphasis, Semi-bold (600) for headings
- Bold (700) reserved for hero numbers only
- Never use light weights (300) — they lack the precision financial data demands
- Never use italic for emphasis — use weight or color instead
- Never center-align long text blocks — left-aligned, left-justified only
- Monospace: reserved for code snippets, API keys, routing numbers, IBAN codes (use JetBrains Mono or system monospace)
- All financial amounts: right-aligned in table columns with tabular figures

---

## Spacing Scale

### Core Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `--space-0` | 0px | Zero spacing (tight icon-to-text, table cell edges) |
| `--space-xs` | 4px | Icon gaps, inline spacing, tight groupings |
| `--space-sm` | 8px | Table cell padding, chip gaps, compact lists |
| `--space-md` | 12px | Standard table cell padding, component gaps |
| `--space-lg` | 16px | Form field spacing, card content padding |
| `--space-xl` | 24px | Card padding, section gaps in dashboards |
| `--space-2xl` | 32px | Dashboard section margins, form section gaps |
| `--space-3xl` | 48px | Page margins, major section breaks |
| `--space-4xl` | 64px | Marketing page sections |
| `--space-5xl` | 96px | Landing page hero sections |

### Density Rules
- **Transaction tables**: 8-12px cell padding — prioritize row count over comfort
- **Dashboard cards**: 24px padding — balanced density
- **Forms**: 16-24px between fields — clear visual grouping
- **Sidebar**: 8-12px item padding — compact navigation
- **Marketing pages**: 64-96px section margins — generous breathing room
- **Screen edges**: 24px minimum horizontal padding on dashboards, 16px on mobile

### The Principle
Data-dense areas (transactions, tables) are compact but readable. Marketing and
landing pages get breathing room. The spacing always serves information hierarchy
— tighter where there's more data, looser where there's less.

---

## Radius System

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | 0px | Table edges (where borders handle separation) |
| `--radius-sm` | 4px | Inputs, small controls, tags, badges |
| `--radius-md` | 6px | Standard cards, buttons, modals, dropdowns |
| `--radius-lg` | 8px | Featured cards, marketing CTAs, large containers |
| `--radius-full` | 9999px | Avatars, status indicators, small pills |

### Radius Rules
- 4-6px is the sweet spot for nearly all components — crisp and professional
- Never use radius above 8px for functional UI components
- Never use 0px radius for interactive elements (buttons, inputs) — always at least 4px
- Marketing pages may use `--radius-lg` (8px) for featured CTAs or cards
- Avatars are always circular (`--radius-full`)
- Never pill-shape functional buttons — pills are too playful for financial UI
- The radius should be consistent across all similar components — no mixing 4px and 6px

---

## Shadow System

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | `none` | Flat elements, default state |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.05)` | Subtle cards, table rows (hover) |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` | Standard cards, dropdowns, modals |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)` | Elevated modals, slide-out panels |
| `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.10), 0 8px 10px -6px rgba(0, 0, 0, 0.05)` | Maximum elevation (rare) |

### Shadow Rules
- Shadows are neutral (black at low opacity) — never warm-toned
- Default: no shadow. Cards get `shadow-sm` when actionable, `shadow-md` when elevated
- Modals always get `shadow-md` minimum
- Shadows are functional (communicate elevation), never decorative
- Never use colored shadows (blue glow, green glow)
- Never use heavy, dramatic drop shadows — the UI should feel light and clean
- Dark mode: shadows are nearly imperceptible — use border contrast for elevation instead

---

## Surface Treatments

### Cards (Dashboard)
- Clean white background (`#FFFFFF`)
- Subtle border (`--gray-200`, 1px) or shadow-sm (not both)
- 24px internal padding
- 6px border radius
- Contains one clear data group: account balance, recent transactions, spending chart, etc.

### Transaction Tables
- Clean white background with subtle zebra striping (`--gray-50` on alternating rows, optional)
- 8-12px cell padding
- Header row: uppercase labels (12px, `--gray-500`), `--gray-50` background
- Row hover: `--gray-100` background, smooth 150ms transition
- Column separators: subtle vertical borders or none (alignment does the work)
- Row borders: subtle `--gray-200` bottom border

### Panels / Forms
- Clean white or `--gray-50` background
- 6px border radius
- 24px internal padding
- Clear section grouping with labels and optional dividers

### Dividers / Separators
- `--gray-200`, 1px solid
- Full-width or inset (16px)
- Used between sections, above/below CTAs
- Never overused — if alignment and spacing can separate, skip the line

---

## Component Patterns

### Balance Display (Hero Number)
```
  Cash Balance

  $247,831.42       ← hero number, --text-4xl or --text-5xl
                      tabular figures, semi-bold
  +12.4% this month   ← optional trend indicator,
  ─────────────────    --positive color, --text-sm
```
- Largest text on the dashboard
- Currency symbol included
- Tabular figures with comma separators
- Optional trend: green with up-arrow for growth, red with down-arrow for decline
- Located at the top of the dashboard, impossible to miss
- Updates in real-time with a smooth numerical transition (150-200ms)

### Transaction Row
```
┌──────────────────────────────────────────────┐
│  Jun 12    Stripe Payment              green  │
│  10:42 AM  Subscription Revenue  +$1,200.00  │
├──────────────────────────────────────────────┤
│  Jun 11    AWS                           red  │
│  3:15 PM   Cloud Services          -$423.50  │
├──────────────────────────────────────────────┤
│  Jun 11    TransferWise               pending │
│  9:00 AM   Contractor Payment    -$2,500.00  │
└──────────────────────────────────────────────┘
```
- Date (left column, 14px, `--gray-500`), optionally with time
- Description (left column, 14-16px, `--gray-800`): merchant name + detail line
- Amount (right column, 14-16px, tabular figures): right-aligned, colored by type
- Status indicator: colored dot or tag (green=complete, amber=pending, red=declined)
- Category tag: small chip on the right or left, `--gray-100` background, `--gray-600` text
- Row height: 48-56px (compact enough for scanning, tall enough for readability)
- Hover state: `--gray-100` background

### Transfer Form
```
  New Transfer
  ─────────────
  From account
  ┌──────────────────────────────┐
  │ Operating Account · $247,831 │  ← dropdown/select
  └──────────────────────────────┘

  To recipient
  ┌──────────────────────────────┐
  │ Search or enter...           │  ← text input with search
  └──────────────────────────────┘

  Amount
  ┌──────────────────────────────┐
  │ $  0.00                      │  ← large input, tabular figures
  └──────────────────────────────┘

  Memo (optional)
  ┌──────────────────────────────┐
  │ Add a note...                │
  └──────────────────────────────┘

  ┌──────────────────────┐
  │  Review Transfer      │  ← primary CTA, full-width, blue accent
  └──────────────────────┘
```
- Linear, single-column form (no multi-column layouts)
- Clear labels above each field (not placeholder-as-label)
- Amount field is visually prominent (larger font, highlighted border on focus)
- Primary CTA is full-width, clear, and descriptive ("Review Transfer" not "Submit")
- Review step shows a confirmation card with all details before final submit
- Confirmation shows receipt with a reassuring completion message

### Card Management Display
```
┌──────────────────────────────────┐
│  Physical Debit Card             │
│                                  │
│  Mercury  ···· 4821              │
│                                  │
│  Status: Active            ●     │  ← green dot
│  Spend limit: $5,000/day         │
│                                  │
│  [ Freeze Card ]  [ View Details ]│
└──────────────────────────────────┘
```
- Card representation: network logo, last four digits, status indicator
- Physical and virtual cards displayed together
- Clear freeze/unfreeze toggle with confirmation
- Spend limits displayed and configurable
- Recent card transactions listed below
- Virtual card creation: simple form (name, limit, optional expiration)

### Spending Chart
```
  Spending This Month
  ────────────────────
  ████████████  Payroll           $42,500   52%
  ██████        SaaS Subscriptions $12,300  15%
  ████          Office & Admin     $8,200   10%
  ███           Marketing          $6,500    8%
  ██            Professional Svcs  $5,100    6%
  █             Travel             $3,200    4%
  ▏             Other              $4,100    5%
```
- Horizontal bar chart, left-aligned labels
- Distinct, muted colors per category (no rainbows)
- Categories sorted by amount (largest first)
- Dollar amount + percentage displayed
- Bars are simple rectangles with 4px radius
- Tap/click a category to filter transactions

---

## Navigation

### Sidebar (Desktop)
- Fixed left sidebar, 220-260px width
- Logo at top, navigation items below
- Items: Dashboard, Transactions, Transfers, Cards, Settings, Team
- Active item: `--accent-light` background, `--accent` text, subtle left border accent
- Inactive items: `--gray-700` text, hover → `--gray-100` background
- Bottom section: user menu (avatar, name, logout)
- Clean white or `--gray-50` background
- 8-12px item padding, 4px item spacing

### Top Bar (Contextual)
- Minimal, on detail pages
- Back button (left), page title (center), contextual action (right)
- 48-56px height
- Clean white background, subtle bottom border (`--gray-200`)

### Tab Bar (Mobile, if applicable)
- Bottom navigation: Dashboard, Transactions, Cards, Settings
- Clean white background
- Active tab: `--accent` icon + label
- Inactive tab: `--gray-400` icon + `--gray-500` label
- Subtle top border

---

## Motion System

### Durations

| Context | Duration | Easing |
|---|---|---|
| Hover states | 120ms | `ease` |
| Focus rings, active states | 120ms | `ease` |
| Page transitions | 150-200ms | `ease-out` |
| Dropdown open/close | 150ms | `ease-out` |
| Modal open/close | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Balance update (numerical) | 150-200ms | `ease-out` (count-up effect) |
| Toast / notification | 300ms enter, 200ms exit | `ease-out` |
| Chart animations | 400-600ms | `ease-out` (draw-in effect) |

### Easing
- `ease-out` and `ease` are the defaults — functional, not expressive
- Never use spring physics, bouncy easings, or elastic effects
- Never use ease-in-out for small UI elements — it feels sluggish at this speed

### Principles
- Motion is fast and functional — it communicates state change, not emotion
- All animations complete in under 200ms (except charts and toasts)
- No decorative animations — if it doesn't communicate information, it shouldn't move
- Number transitions are smooth count-ups (respect `prefers-reduced-motion` — instant when set)
- Never animate financial data with dramatic, attention-seeking effects
- Hover and focus states are practically instant (120ms) — they feel responsive
- Modals and dropdowns animate in fast to feel immediate, not theatrical

---

## Responsive Behavior

### Desktop (1440px+)
- Sidebar visible, full dashboard layout
- Multi-column card grids
- Full transaction table with all columns visible

### Laptop (1024-1440px)
- Sidebar visible, may collapse to icon-only at lower end
- Cards may shift from 3-column to 2-column
- Transaction table may collapse secondary columns

### Tablet (768-1024px)
- Sidebar collapsed to hamburger or icon bar
- Single-column card layout
- Transaction table: simplified columns (date, description, amount only)

### Mobile (< 768px)
- No sidebar — bottom tab navigation or hamburger menu
- Single-column layout for all content
- Transaction table becomes a list of cards (stacked layout)
- Forms remain single-column (they already were)
- Hero balance moves to top of single-column scroll
