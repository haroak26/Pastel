# Picasso Product Mode: App Dashboard

## Mode Definition

**Dashboard/Workspace** — A software tool where authenticated users log in to perform work, manage data, or monitor systems. Dashboards are the operational core of SaaS products, admin panels, internal tools, and data platforms. The user is already authenticated; the interface is a productive workspace, not a marketing surface.

---

## Core Layout Architecture

### Sidebar + Main Content Grid

The dashboard layout is a two-region horizontal split that persists for the entire authenticated experience.

```
┌──────────┐ ┌──────────────────────────────────────────────┐
│          │ │                                              │
│  Sidebar │ │           Main Content Area                  │
│  Fixed   │ │           (scrollable independently)         │
│  Left    │ │                                              │
│  240px-  │ │                                              │
│  280px   │ │                                              │
│          │ │                                              │
└──────────┘ └──────────────────────────────────────────────┘
```

| Property | Sidebar | Main Content |
|---|---|---|
| Width | 240–280px (fixed) | `flex: 1` (fills remaining width) |
| Position | Fixed left (`position: fixed`) | Scrollable (`overflow-y: auto`) |
| Height | 100vh | 100vh (minus optional topbar) |
| Background | `neutral-900` (dark) or `neutral-50` (light) | `neutral-50` or white |
| Border | Right border `1px solid neutral-200` | — |
| Z-index | 10 (above content) | 0 (base) |

### Topbar (Optional)

Some dashboards add a horizontal topbar above the content area. This is most common in data-heavy dashboards or multi-workspace tools.

```
┌───────────────────────────────────────────────────────────┐
│ Logo   Breadcrumbs > Path   [CMD+K Search]   🔔   [Avatar]│  56–64px
├──────────┬────────────────────────────────────────────────┤
│ Sidebar  │  Main Content                                  │
```

| Property | Value |
|---|---|
| Height | 56–64px |
| Background | White or `neutral-50` |
| Border | Bottom `1px solid neutral-200` |
| Content | Breadcrumbs (center or left), search bar (CMD+K), notification bell, user avatar dropdown, create/new button (accent-500) |

**When to include a topbar:**
- Multi-workspace / multi-account products (workspace switcher is in topbar)
- Data-dense products where breadcrumbs matter for navigation
- Products with global search (search scope is across all entities)
- Products with frequent "create new" actions (e.g., new project, new issue)

**When to skip the topbar:**
- Simple single-workspace tools (Linear, Notion — no topbar, sidebar handles everything)
- Products where the page header provides sufficient context
- Products prioritizing vertical space for content

---

## Sidebar Design System

### Logo + App Name Section

Located at the top of the sidebar. Occupies 48–56px of vertical space.

```
┌─────────────────────┐
│ [Icon]  AppName     │  ← 48–56px height
│                     │
│ ▸ Get Started       │
│ ▸ Dashboard         │
```

| Element | Specification |
|---|---|
| App icon/logo | 24–32px square or wordmark |
| App name | 16–18px, weight 600–700 |
| Padding | 16–20px horizontal, vertically centered |
| Bottom border | Optional `1px solid neutral-200` to separate from nav |

### Navigation Sections

Navigation items are organized into labeled groups. Each group has a subtle section label.

```
┌─────────────────────┐
│ MAIN                │  ← Section label: 11–12px, uppercase,
│ ▸ Dashboard         │     neutral-400, letter-spacing +0.5px,
│ ▸ Projects          │     padding-left matches nav items
│                     │
│ WORKSPACE           │
│ ▸ Tasks             │
│ ▸ Calendar          │
│                     │
│ SETTINGS            │
│ ▸ General           │
│ ▸ Team              │
│ ▸ Billing           │
└─────────────────────┘
```

| Element | Specification |
|---|---|
| Section label | 11–12px, uppercase, `neutral-400`, letter-spacing +0.5px, font-weight 600 |
| Section label spacing | 8–12px above group, 4–6px below label |
| Gap between nav items | 0–2px (tight — they are stacked touch targets) |
| Gap between sections | 16–20px |

### Navigation Item Anatomy

```
┌──────────────────────┐
│  [Icon]  Item Label  │  ← 40–48px height
└──────────────────────┘
```

| Property | Default | Active | Hover |
|---|---|---|---|
| Height | 40–48px | 40–48px | 40–48px |
| Background | Transparent | `accent-50` (light mode) or `accent-900` (dark mode) | `neutral-100` |
| Left border | None | 2–3px solid `accent-500` | None |
| Icon size | 20px | 20px | 20px |
| Icon color | `neutral-500` | `accent-500` | `neutral-700` |
| Label size | 14–15px | 14–15px (weight 500–600) | 14–15px |
| Label color | `neutral-700` | `neutral-900` or `accent-600` | `neutral-900` |
| Border radius | 6–8px | 6–8px | 6–8px |
| Horizontal margin | 8px | 8px | 8px |

**Active state implementation:**
- The left border indicator (accent-500) is the primary visual signal
- Background accent-50 provides a subtle fill
- Icon and label shift to accent-500
- The item should feel "lit up" compared to its neighbors
- Only ONE item is active at a time
- If a parent section is expanded and a child is active, the parent also gets a lighter accent indicator

### Collapsed Sidebar State

Some dashboards support a collapsed/mini sidebar for power users who want more horizontal space.

```
┌─────┐
│ 🏠  │  ← Icon only, centered
│     │
│ 📁  │
│     │
│ 📊  │
│     │
│ ⚙️  │
│     │
│     │
│ 👤  │
└─────┘
```

| Property | Value |
|---|---|
| Width | 64–72px |
| Icons | Centered horizontally, 20–24px |
| Stack spacing | 4–8px between icons |
| Tooltip on hover | Required — shows the full label to the right of the icon with 8px gap, 400ms delay |
| Active indicator | Small dot or left border, since there is no text |
| Toggle button | At bottom (chevron left/right icon) or above user profile |
| Transition | Smooth width transition (200–250ms, ease-out) |

### User Profile Footer

Stuck to the bottom of the sidebar. Always visible.

```
┌──────────────────────┐
│                      │
│  (scrollable nav)    │
│                      │
├──────────────────────┤
│ [Avatar]  Name      ▾│  ← 52–60px, border-top
└──────────────────────┘
```

| Element | Specification |
|---|---|
| Height | 52–60px |
| Border | Top `1px solid neutral-200` |
| Avatar | 28–36px circle, user photo or initials |
| Name | 13–14px, weight 500–600, `neutral-900` |
| Email or role | 11–12px, `neutral-500` (optional second line) |
| Chevron | 14–16px, `neutral-400`, opens a dropdown menu |
| Background | `neutral-50` or white (slightly different from sidebar bg) |
| Menu on click | Settings, Profile, Billing, Log out items |

---

## Content Area Structure

### Page Header

Every dashboard page starts with a header that orients the user.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Projects                          [+ New Project]       │
│  Manage all your team's projects                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Title | 24–32px, weight 600–700, `neutral-900` |
| Description | 14–16px, `neutral-500`, max 1–2 lines, directly below title |
| Primary action button | Top-right or bottom-right, accent-500 filled, 36–44px height |
| Section padding | 24–32px top, 16–24px bottom |
| Divider below | Optional `1px solid neutral-200` if header needs separation from scrollable content |

### Content Section Patterns

Dashboard content areas use a variety of surface treatments to create visual hierarchy and avoid monotony.

#### Pattern 1: Band (full-width background)

```
┌──────────────────────────────────────────────────────────┐
│ (neutral-50 background, full-width)                       │
│  Section Title                    [Action Link →]        │
│                                                          │
│  [Content fills here — tables, charts, cards]            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Full-width background color change (neutral-50 or neutral-100)
- Useful for separating major content sections
- Vertical padding: 32–48px
- Use sparingly: 2–3 bands per page maximum

#### Pattern 2: Plain (no surface)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Section Title                    [Action Link →]        │
│                                                          │
│  [Content flows directly on page background]             │
│                                                          │
│  Spacing is controlled by padding and gap                │
└──────────────────────────────────────────────────────────┘
```

- Content sits directly on the page background
- No card or band wrapper
- Vertical spacing via section margins: 24–32px between sections
- Default pattern for most dashboard content

#### Pattern 3: Card (contained surface)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────────┐            │
│  │ Card Title             [Action Link →]   │            │
│  │                                          │            │
│  │ [Content contained within card]          │            │
│  │                                          │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Background | White |
| Border | `1px solid neutral-200` |
| Border radius | 8–12px |
| Shadow | `0 1px 3px rgba(0,0,0,0.06)` |
| Padding | 20–24px |
| Margin | 16–24px between cards |

#### Pattern 4: Band + Card (combined)

```
┌──────────────────────────────────────────────────────────┐
│ (neutral-50 band)                                         │
│                                                          │
│  ┌──────────────────────────────────────────┐            │
│  │ Card inside a band                       │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
│  ┌──────────────────────────────────────────┐            │
│  │ Another card                              │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Cards sit within a band for extra visual separation
- High-end look; use for primary content sections

### Section Headers

Every content section has a header.

| Element | Specification |
|---|---|
| Title | 18–22px, weight 600, `neutral-900` |
| Action link (optional) | 13–14px, accent-500, right-aligned, "View all →" or "Manage →" |
| Gap below header | 12–16px before content begins |

### Content Bodies

#### Tables

| Property | Specification |
|---|---|
| Header row | `neutral-100` background, 12–13px, weight 600, `neutral-700` |
| Row height | 44–52px |
| Row border | Bottom `1px solid neutral-100` |
| Row hover | `neutral-50` background |
| Cell padding | 12–16px horizontal, 10–14px vertical |
| Sortable columns | Header shows sort arrow (neutral-400), active sort = accent-500 arrow |
| Selected row | `accent-50` background, checkbox checked |
| Checkbox column | Leftmost, 40–48px wide |
| Pagination | Bottom of table: row count ("1–20 of 156"), page controls, page size selector |

#### Lists (Divided)

```
┌──────────────────────────────────────────┐
│ Item name                   3 hours ago  │
│ Description text goes here               │
├──────────────────────────────────────────┤
│ Another item                Yesterday    │
│ More description here                    │
├──────────────────────────────────────────┤
│ Third item                  2 days ago   │
│ Description continues                    │
└──────────────────────────────────────────┘
```

| Property | Specification |
|---|---|
| Item height | 56–72px (for primary metadata) or 40–48px (simple links) |
| Divider | `1px solid neutral-100` between items |
| Content | Left: avatar/icon + title + subtitle. Right: timestamp, badge, action |
| Click target | Full row is clickable (navigates to detail) |
| Empty state | "No items yet" with a create action, not a blank space |

#### Card Grids

Dashboard card grids display summary items in a responsive grid.

| Property | Specification |
|---|---|
| Columns | 2–4 columns (3 is most common) |
| Gap | 16–24px |
| Card min-height | 140–200px |
| Card content | Icon + label + value + optional sparkline or delta |
| Responsive | Below 1024px: 2 columns. Below 640px: 1 column |

#### Charts

| Property | Specification |
|---|---|
| Container | Card wrapper with title in top-left and time range selector in top-right |
| Chart height | 240–360px |
| Chart types | Line (trends over time), bar (comparisons), donut (composition), area (cumulative) |
| Colors | Use accent scale, not random; data series should be distinguishable |
| Axis labels | 11–12px, `neutral-400` |
| Tooltip on hover | Required — shows exact value at data point |
| Legend | Below chart or right-aligned, 12px, `neutral-500` |

---

## Primary Screen Types

### 1. Overview / Home Dashboard

The landing page after login. Must feel alive — data-rich, not empty.

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard                                               │
│  Welcome back, Alex. Here's what's happening.   [Period] │
│                                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │158  │ │1.2K │ │$45K │ │12%  │   ← 4 stat cards      │
│  │Proj │ │Users│ │ MRR │ │Conv │                        │
│  └─────┘ └─────┘ └─────┘ └─────┘                        │
│                                                          │
│  ┌──────────────────────────┐ ┌──────────────────────┐  │
│  │ Revenue Trend (chart)    │ │ User Growth (chart)  │  │
│  │                          │ │                      │  │
│  └──────────────────────────┘ └──────────────────────┘  │
│                                                          │
│  Recent Activity                                         │
│  ├────────────────────────────────────────────────────── │
│  │  Emma updated "Q4 Planning"        2 minutes ago     │
│  │  James created "API v2" project    15 minutes ago    │
│  │  Sarah left a comment on "Design"  1 hour ago         │
│  │  Alex deployed "main" to production  3 hours ago      │
│  │  System: backup completed           5 hours ago       │
│  └────────────────────────────────────────────────────── │
│                                                          │
│  Quick Actions                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ + Project│ │ + Invite │ │ + Report │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Stat cards | 4–6 cards, each with: icon (top-left), value (28–36px, weight 700), label (12–13px, neutral-500), delta (percentage change, green/red, 12px) |
| Charts | 1–2 main charts, showing key trends (not decorative) |
| Recent activity | Divided list, 5–10 items minimum |
| Quick actions | 3–4 action cards (icon + label, clickable, accent-50 hover) |

### 2. List / Table View

The workhorse screen for browsing and managing records.

```
┌──────────────────────────────────────────────────────────┐
│  Projects                                  [+ New]       │
│                                                          │
│  🔍 Search projects...   [Filter ▼] [Sort ▼] [Status ▼] │
│                                                          │
│  ☐ │ Name          │ Status  │ Owner   │ Updated        │
│  ──┼───────────────┼─────────┼─────────┼─────────────── │
│  ☐ │ Q4 Planning   │ Active  │ Emma    │ 2 min ago      │
│  ☐ │ API v2        │ Draft   │ James   │ 15 min ago     │
│  ☐ │ Design System │ Active  │ Sarah   │ 1 hour ago     │
│  ☐ │ Mobile App    │ Paused  │ Alex    │ 3 hours ago    │
│  ☐ │ Landing Page  │ Active  │ Emma    │ 1 day ago      │
│  ☐ │ Docs Overhaul │ Draft   │ James   │ 2 days ago     │
│  ──┴───────────────┴─────────┴─────────┴─────────────── │
│                                                          │
│  3 selected           [Archive] [Delete] [Assign...]     │  ← Bulk actions bar
│                                                          │
│  1–20 of 156 projects       < Prev  1  2  3 ...  Next > │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Toolbar | Full-width, 48–56px. Search input (left, 240–320px), filter dropdowns (center/right), create button (far right) |
| Bulk actions bar | Appears when rows are selected. `accent-50` background or white with top border. Shows count + action buttons. 48–56px height |
| Pagination | Bottom of table. Row count left, page controls right |
| Empty state | If zero records: illustration (small, subtle) + "No projects yet" + "Create your first project" button |

### 3. Detail View

A two-panel layout for viewing and editing a single record.

```
┌──────────────────────────────────────────────────────────┐
│  ← Projects / Q4 Planning              [Edit] [Delete ▾] │
│                                                          │
│  ┌──────────────────────────────┬──────────────────────┐ │
│  │                              │                      │ │
│  │  Main Content Panel          │  Side Panel          │ │
│  │                              │                      │ │
│  │  - Title + description       │  Metadata            │ │
│  │  - Form fields or display    │  - Status            │ │
│  │  - Rich content              │  - Owner             │ │
│  │  - Comments / activity       │  - Dates             │ │
│  │                              │  - Tags / labels     │ │
│  │                              │                      │ │
│  │                              │  Recent Activity     │ │
│  │                              │  - Timeline of       │ │
│  │                              │    changes           │ │
│  │                              │                      │ │
│  │                              │  Related Items       │ │
│  │                              │  - Linked records    │ │
│  │                              │                      │ │
│  └──────────────────────────────┴──────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Back button | "← Projects" or "← Back to Projects", 14px, `neutral-500`, top-left |
| Contextual header | Item title + action buttons (Edit, Delete, Share) |
| Main panel | `flex: 1`, padding 24–32px |
| Side panel | 280–360px wide, border-left `1px solid neutral-200` |
| Side panel sections | Metadata (read-only fields), Activity (timeline), Related Items (linked list) |

### 4. Settings

Vertical tab navigation or sidebar subnav with form panels.

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                                │
│                                                          │
│  ┌──────────┬──────────────────────────────────────────┐ │
│  │ General  │                                          │ │
│  │ Team     │  General Settings                        │ │
│  │ Billing  │                                          │ │
│  │ API      │  ┌──────────────────────────────────────┐ │ │
│  │ Webhooks │  │ Workspace Name                       │ │ │
│  │ Security │  │ [Acme Corp____________________]      │ │ │
│  │ Audit    │  │                                      │ │ │
│  │          │  │ Workspace Slug                       │ │ │
│  │          │  │ acmecorp.app.picasso.design          │ │ │
│  │          │  │                                      │ │ │
│  │          │  │ Default Language                     │ │ │
│  │          │  │ [English (US)__________________ ▾]   │ │ │
│  │          │  │                                      │ │ │
│  │          │  │ ─── Danger Zone ─────────────────── │ │ │
│  │          │  │                                      │ │ │
│  │          │  │ Delete Workspace                     │ │ │
│  │          │  │ Permanently remove all data. This    │ │ │
│  │          │  │ action cannot be undone.              │ │ │
│  │          │  │ [Delete Workspace] (red outline btn)  │ │ │
│  │          │  └──────────────────────────────────────┘ │ │
│  │          │                                          │ │
│  │          │                     [Save Changes]       │ │
│  └──────────┴──────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Settings nav | Vertical tabs in a narrow column (180–220px) or sidebar subnav |
| Active tab | `accent-50` background, accent-500 text, left border indicator |
| Form sections | Grouped with section headers. Each group: heading + description + fields + optional Danger Zone at bottom |
| Danger Zone | Red heading, red outline border, warning description, destructive button (red) |
| Save button | Sticky at bottom of form or top-right of content area |

### 5. Analytics / Reports

Data-heavy screens for exploring metrics.

```
┌──────────────────────────────────────────────────────────┐
│  Analytics         [Last 30 Days ▾] [Compare ▾] [Export] │
│                                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │12.5K│ │$48K │ │3.2% │ │89%  │ │1.2s │               │
│  │Visit│ │ Rev │ │Conv │ │Reten│ │Load │               │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘               │
│                                                          │
│  ┌────────────────────────┐ ┌─────────────────────────┐ │
│  │ Revenue Over Time      │ │ User Acquisition        │ │
│  │ (line chart)           │ │ (stacked bar)           │ │
│  └────────────────────────┘ └─────────────────────────┘ │
│                                                          │
│  ┌────────────────────────┐ ┌─────────────────────────┐ │
│  │ Top Pages              │ │ Conversion Funnel       │ │
│  │ (horizontal bar)       │ │ (funnel chart)          │ │
│  └────────────────────────┘ └─────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Detailed Table                                      │ │
│  │ Page          │ Visits │ Bounce │ Conversion        │ │
│  │ /pricing      │ 2,340  │ 42%    │ 8.3%              │ │
│  │ /blog/post    │ 1,890  │ 65%    │ 2.1%              │ │
│  │ /docs/api     │ 1,560  │ 38%    │ 12.7%             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Specification |
|---|---|
| Date range picker | Top-right. Preset ranges (7d, 30d, 90d, YTD) + custom. |
| Metric summary row | 4–5 stat cards with value + delta + sparkline |
| Chart grid | 2x2 (primary layout) or 3x1 (wider charts). Charts are interactive (hover, click to drill) |
| Export button | CSV, PDF, or image export |
| Comparison | "Compare to previous period" toggle changes deltas and overlays prior period on charts |

---

## Data Density Rules

Dashboards are **data-dense** by nature. Sparse designs fail in dashboard contexts.

| Rule | Minimum | Target |
|---|---|---|
| Viewport fill | 50% of vertical space must contain data above the fold | 60–70% |
| Table rows | 5+ visible rows without scrolling | 10–20 |
| List items | 4+ visible items without scrolling | 8–12 |
| Stat cards | 3+ per section | 4–6 |
| Chart height | 200px minimum | 280–360px |
| Empty state | Never leave a blank content area — show real data, or provide a meaningful empty state with an action | — |

**Sparse section detection:**
- If a content section shows only 1–2 items, merge it with another section or remove it
- If a chart area is over 400px tall but the chart data is minimal, reduce the height
- If stat cards are fewer than 3, use a wider card layout with more detail per card

---

## Navigation Behavior

### Sidebar Behavior

| Behavior | Specification |
|---|---|
| Visibility | Always visible on desktop (>= 1024px width) |
| Scroll | Sidebar scrolls independently from content area |
| Active item | Always visible in viewport (sidebar auto-scrolls to active item) |
| Section groups | Collapsible — click section label to collapse/expand. Chewron rotates 90° |
| Collapsed persistence | Collapse state persists across page navigations (localStorage) |
| Workspace switcher | If multi-workspace, dropdown at top of sidebar or in topbar |
| Keyboard shortcut | CMD+B or CMD+\ to toggle collapsed state |

### Topbar Navigation (when present)

| Behavior | Specification |
|---|---|
| Breadcrumbs | Dynamic. Each segment is clickable (except current page) |
| Search | CMD+K opens global search modal. Results appear as you type. Keyboard navigation (↑↓ arrow keys, ↵ to select, Esc to close) |
| Notifications | Red badge (unread count) on bell icon. Dropdown on click: grouped notifications (Today, Yesterday, Earlier) |
| User menu | Click avatar → dropdown with: Account Settings, Team, Billing, API, Sign Out |

### Page-Level Navigation

| Behavior | Specification |
|---|---|
| Browser back/forward | Supported. Detail views push onto history. Closing a modal does NOT push history |
| Deep linking | Every screen and entity has a unique URL |
| Tab navigation | Within a screen, tabs use URL query params or path segments, not JS-only state |

---

## Anti-Patterns for Dashboards

The following patterns **MUST NOT** appear in dashboard designs. These are the most common mistakes made by designers unfamiliar with dashboard contexts.

### 1. Centered Hero or Marketing Layout

**WRONG:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│              Welcome to Your Dashboard!                   │
│        Let's get you set up and working fast.            │
│                                                          │
│                   [Get Started →]                         │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why it's wrong:** The user already signed up and logged in. They are here to work, not to be sold to. A hero layout wastes the most valuable screen real estate — the space above the fold.

**CORRECT:** The overview screen immediately shows stat cards, recent activity, and quick actions. No welcome message beyond a subtle "Good morning, Alex" in the page header.

### 2. Footer

**WRONG:** Any footer with links, copyright, social icons, or "About Us / Careers / Blog" at the bottom of a dashboard page.

**Why it's wrong:** Dashboards are infinite scroll or paginated workspaces, not marketing pages. Legal links belong in settings > legal, not in the workspace interface.

**CORRECT:** No footer. If pagination or infinite scroll end is reached, show a subtle border line or "End of results" text.

### 3. "Get Started" / "Sign Up" CTAs

**WRONG:** Any button, banner, or modal prompting the user to sign up, start a trial, upgrade, or "get started" when they are already using the product.

**Why it's wrong:** The user is authenticated. Marketing CTAs break the user's flow and feel desperate.

**CORRECT:** Upgrade prompts (if any) are contextual and subtle — e.g., a "Pro" badge next to a locked feature, or a small banner in the billing settings. Never on main screens.

### 4. Large Illustrations or Empty States on Home Screen

**WRONG:** Full-width illustration, empty state with "You don't have any projects yet!", or a large hero graphic on the dashboard home.

**Why it's wrong:** New users should see demo data or a guided setup, not an empty void. Returning users should see their data immediately.

**CORRECT:** For new users: pre-populated demo data with subtle labels, or a small inline onboarding widget (< 200px tall) that can be dismissed. For returning users: their actual data.

### 5. Tabbar Navigation (Mobile Pattern on Desktop)

**WRONG:** Bottom tabbar with icons like:
```
[Home] [Search] [Create] [Notifications] [Profile]
```

**Why it's wrong:** Desktop dashboards use sidebars. Tab bars are for mobile apps. Using a tabbar on desktop wastes horizontal space and signals a mobile-first port, not a professional desktop tool.

**CORRECT:** Sidebar navigation with icons + labels. On responsive breakpoints (below 768px), the sidebar collapses into a hamburger menu or a bottom tabbar as a mobile adaptation.

### 6. Full-Width Hero Images with Overlay Text

**WRONG:** A large photo or gradient image spanning the full content area with text overlaid on top.

**Why it's wrong:** This is a landing page pattern. Dashboards are utilitarian. Hero images obstruct data and are purely decorative.

**CORRECT:** No hero images. If visual branding is needed, use the app logo in the sidebar and subtle brand colors in the UI chrome.

### 7. Testimonial Sections or Social Proof

**WRONG:** Sections like "Loved by 10,000+ teams" with company logos or user quotes inside the dashboard.

**Why it's wrong:** This is marketing content. The user is already a customer. Testimonials and social proof belong on landing pages, not inside the product.

**CORRECT:** Zero marketing or social proof content inside the authenticated experience.

---

## Brand Personality in Dashboards

The dashboard's visual language should align with the product's brand personality. Picasso selects the appropriate personality based on the product type, target audience, and brand description.

### Professional / Trustworthy (Fintech, Enterprise, Legal, Healthcare)

| Attribute | Specification |
|---|---|
| Color palette | Blues (navy, steel), grays. Accent: deep blue or teal |
| Typography | Inter, SF Pro, or system fonts. Clean, professional |
| Spacing | Dense but clean. 16–20px section gaps |
| Tone | Serious, reliable, minimal decoration |
| Surface treatment | Flat cards, subtle shadows, thin borders |
| Charts | Clean, no gradients or excessive decoration |
| Reference | Stripe Dashboard, Mercury, Brex |

**Design keywords:** clean, reliable, data-first, understated, professional

### Calm / Neutral (Productivity, Notes, Project Management)

| Attribute | Specification |
|---|---|
| Color palette | Neutral grays, subtle accent (blue-gray or muted purple) |
| Typography | Inter, system fonts. High readability |
| Spacing | Generous. 20–28px section gaps |
| Tone | Calm, focused, distraction-free |
| Surface treatment | Flat, minimal borders, subtle background shifts |
| Charts | Simple, functional, not decorative |
| Reference | Linear, Notion, Basecamp |

**Design keywords:** calm, focused, minimal, distraction-free, efficient

### Energetic / Fun (Consumer Apps, Gaming, Creative Tools)

| Attribute | Specification |
|---|---|
| Color palette | Vibrant accents (coral, magenta, lime). More saturated backgrounds |
| Typography | Bold headings. Playful but readable body font |
| Spacing | Dynamic. Variable section heights |
| Tone | Energetic, encouraging, visually rich |
| Surface treatment | Rounded corners (12–16px), colorful cards, shadows with color tint |
| Charts | Gradient fills, donut charts, animated number counters |
| Reference | Notion (colorful pages), Figma (creative workspace) |

**Design keywords:** vibrant, energetic, creative, playful, encouraging

### Dark / Code-Focused (Developer Tools, APIs, Infrastructure)

| Attribute | Specification |
|---|---|
| Color palette | Dark backgrounds (neutral-900, #0d1117, #1a1a2e), neon or muted green/blue accents |
| Typography | JetBrains Mono, Fira Code, SF Mono for code. Inter for UI |
| Spacing | Tight and efficient. 12–16px section gaps |
| Tone | Technical, sharp, terminal-inspired, power-user focused |
| Surface treatment | Thin borders (neutral-700), dark cards, subtle glow effects on active elements |
| Charts | Sharp lines, dark backgrounds, neon data colors |
| Reference | Vercel Dashboard, GitHub, Railway, Supabase Dashboard |

**Design keywords:** dark, sharp, code, technical, fast, power-user

---

## Real-World Reference Dashboards

### Stripe Dashboard
- **Mode:** Fintech professional
- **Signature traits:** Dark sidebar (#1a1a2e or dark blue), white content area, dense data tables, minimal decoration, blue accent (#635bff or similar), left sidebar with icons + labels, topbar with workspace switcher + search
- **Key takeaway:** Data density over decoration. Every pixel has a purpose. No fluff.

### Linear
- **Mode:** Productivity calm/neutral
- **Signature traits:** Minimalist dark/light sidebar, keyboard-first, clean typography (Inter), subtle borders, barely-visible section separators, `neutral-50` bands, ghost buttons as default, filled accent-500 for primary actions
- **Key takeaway:** Remove everything that isn't necessary. Let content breathe. Keyboard shortcuts are first-class citizens.

### Notion
- **Mode:** Docs/dashboard hybrid
- **Signature traits:** Sidebar with page tree, content-first, colorful page icons, minimal chrome, drag-and-drop sidebar organization, workspace switcher in top-left, user profile in bottom-left
- **Key takeaway:** The content IS the interface. Chrome is minimal and recedes. Users customize their workspace.

### Vercel
- **Mode:** Developer/dark
- **Signature traits:** Dark sidebar and topbar (#000 or #111), sharp borders, monospace code snippets in UI, green/cyan accent, deployment status indicators, tight spacing, data-dense deployment tables
- **Key takeaway:** Developers want speed and density. Dark mode by default. Terminal-inspired design. No fluff.
