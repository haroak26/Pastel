# Latte Design System v3

The unified design system for Latte. Every page composes itself from these primitives. Nothing is built ad-hoc.

---

## Design Principles

1. **Flat surfaces.** The page background is the only surface. No nested bordered containers.
2. **Hairline dividers.** Rows are separated by `border-b border-border-subtle`, not cards.
3. **Rounded corners at 12px (xl).** Buttons, inputs, dropdowns, and interactive surfaces (graded down for xs).
4. **No shadows.** All box shadows are flattened to `none`. Visual depth comes from borders and background colours.
5. **Consistent typography.** One scale shared across in-app and marketing pages.
6. **Subtle focus ring on all interactive inputs.** `focus:border-brand focus:ring-1 focus:ring-brand/20`. The same ring everywhere.
7. **No ad-hoc elements.** Every input uses `TextInput`, every button uses `Button`, every textarea uses `Textarea`.

---

## Design Tokens

Defined in `client/src/index.css` as CSS custom properties and mirrored in `client/src/lib/design-tokens.ts`.

### Brand

| Token | Value |
|---|---|
| `--brand` | `207 44% 49%` (#4682B4) |
| `--brand-foreground` | White |
| `--brand-muted` | Brand at 10% opacity |
| `--brand-border` | Brand at 25% opacity |

### Neutrals

| Token | Value | Usage |
|---|---|---|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `0 0% 12%` | Primary text |
| `--fg-muted` | `225 5% 44%` | Secondary text |
| `--fg-subtle` | `225 6% 57%` | Tertiary text |
| `--fg-faint` | `220 9% 78%` | Placeholder / disabled |
| `--surface-hover` | `220 14% 96%` | Row hover background |
| `--surface-muted` | `0 0% 98%` | Muted background areas |
| `--border` | `220 14% 91%` | Standard borders |
| `--border-subtle` | `220 14% 95%` | Subtle row dividers |

### Semantic

| Token | Purpose |
|---|---|
| `--success` | Green — resolved, verified |
| `--warning` | Amber — pending, idle |
| `--danger` | Red — errors, destructive |
| `--info` | Brand blue — informational |

### Typography Scale

| Class | Size | Weight | Usage |
|---|---|---|---|
| `lds-display` | 52px | 500 | Marketing hero titles |
| `lds-h1` | 40px | 500 | Marketing section titles |
| `lds-h2` | 28px | 500 | Marketing subtitles |
| `lds-page-title` | 21px | 600 | In-app page titles |
| `lds-section-title` | 15px | 500 | In-app section headings |
| `lds-body` | 13.5px | 500 | Body text |
| `lds-caption` | 12px | 500 | Caption text |
| `lds-section-label` | 11px | 600 | Uppercase section labels |
| `lds-eyebrow` | 11px | 700 | Uppercase marketing eyebrow |

---

## Page Shell Components

### `AppPage`
Every in-app page wraps inside `<AppPage>`. Provides `flex h-full` column layout with background.

```tsx
<AppPage>
  <PageHeader ... />
  <AppBody>...</AppBody>
</AppPage>
```

### `PageHeader`
Unified header bar for every in-app page. Supports icon, title, subtitle, and right-side actions.

Props: `title`, `subtitle?`, `icon?`, `iconColor?`, `actions?`, `leading?`, `className?`

```tsx
<PageHeader title="Inbox" icon={InboxIcon} iconColor="#4682B4"
  actions={<Button size="small">Compose</Button>}
/>
```

### `AppBody` / `AppBodyPadded` / `AppBodyNarrow`

| Component | Max width | Use case |
|---|---|---|
| `AppBody` | None (full width) | List pages with rows |
| `AppBodyPadded` | 1060px, padded | Dashboard / analytics |
| `AppBodyNarrow` | 720px, padded | Settings / forms / detail |

```tsx
<AppBody>              {/* For list rows that span full width */}
<AppBodyPadded>        {/* For analytics grids, tables */}
<AppBodyNarrow>        {/* For settings forms, detail pages */}
```

---

## Page Templates

Three templates cover every in-app page type. Always start from a template — do not build ad-hoc page frames.

### `ListPage`
For list pages (Tickets, Reviews, Inbox). Wraps `AppPage` + `PageHeader` + optional `PageToolbar` + `AppBody`.

```tsx
<ListPage title="Open Tickets" icon={Ticket} iconColor="#eab308"
  toolbar={<PageToolbar>...</PageToolbar>}
  bulkBar={selected > 0 && <BulkActionBar ... />}
>
  <ListItem ... />
</ListPage>
```

### `ListDetailPage`
Master-detail layout with list on the left and a `SlideoverPanel` on the right.

```tsx
<ListDetailPage title="Contacts" icon={User} iconColor="#4682B4"
  toolbar={<PageToolbar>...</PageToolbar>}
  list={<DataTable ... />}
  detail={<SlideoverPanel ...>...</SlideoverPanel>}
/>
```

### `DataDashboardPage`
For analytics and dashboard pages. Stat grid + content below.

```tsx
<DataDashboardPage title="Analytics" icon={BarChart3}
  stats={<> <StatCard .../> <StatCard .../> </>}
>
  <DataTable ... />
</DataDashboardPage>
```

---

## List Components

### `ListItem`
The standard clickable list row. Single source of truth for every row in list pages.

Props: `icon?`, `iconColor?`, `iconBg?`, `avatar?`, `label`, `description?`, `meta?`, `suffix?`, `selected?`, `onClick?`, `children?`

**Children** render between meta and the chevron — use for StatusBadge, action buttons, etc.

```tsx
<ListItem
  icon={CheckCircle}
  iconColor="#22c55e"
  label="Fix login bug"
  description="john@example.com · TKT-123"
  meta="2h ago"
  selected={isSelected}
  onClick={() => open(id)}
>
  <StatusBadge icon={Inbox} color="#eab308" label="Open" />
</ListItem>
```

### `ListSection`
Section header for grouped rows ("Today", "Yesterday").

```tsx
<ListSection label="Today" />
```

### `ListSkeleton`
Loading skeleton for list pages. Use while data fetches.

```tsx
<ListSkeleton rows={8} />
```

### `TableSkeleton`
Loading skeleton for table pages.

```tsx
<TableSkeleton rows={5} columns={4} />
```

---

## Status & Badge Components

### `StatusBadge`
Standard status indicator with icon and color. Replaces all ad-hoc inline status badges.

Props: `icon?`, `color`, `label`, `size?` ('sm' | 'md')

```tsx
<StatusBadge icon={CheckCircle2} color="#22c55e" label="Resolved" />
<StatusBadge icon={Clock} color="#f97316" label="Pending" size="md" />
```

### `Badge`
General-purpose badge for categories, tags, counts.

Props: `tone?` ('neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'), `size?` ('sm' | 'md')

```tsx
<Badge tone="success" size="sm">Active</Badge>
<Badge tone="warning">Pending</Badge>
```

---

## Toolbar Components

### `PageToolbar`
Standardized filter/search/action bar below the page header.

```tsx
<PageToolbar>
  <PageToolbarGroup>
    <FilterChip active>All</FilterChip>
    <FilterChip>Unread</FilterChip>
  </PageToolbarGroup>
  <PageToolbarGroup>
    <TextInput placeholder="Search..." />
    <Button size="small">New</Button>
  </PageToolbarGroup>
</PageToolbar>
```

### `FilterChip`
Square filter button. Good for toolbar groups.

```tsx
<FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
```

### `PillFilter`
Round pill filter button. Good for inline header filters.

```tsx
<PillFilter active={active} onClick={toggle}>Unread</PillFilter>
```

### `OptionsSelector`
Group of FilterChips for exclusive selection.

```tsx
<OptionsSelector
  options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }]}
  value={sort}
  onChange={setSort}
/>
```

---

## Data Display Components

### `DataTable`
Standard table with header row, body rows, row click, and active row highlighting.

```tsx
const columns: DataTableColumn<Item>[] = [
  { key: 'name', header: 'Name', render: (row) => <span>{row.name}</span> },
  { key: 'status', header: 'Status', width: 100, render: (row) => <StatusBadge ... /> },
];

<DataTable columns={columns} rows={items} getRowKey={(r) => r.id}
  onRowClick={(row) => select(row)}
  activeRowKey={selected?.id}
/>
```

### `StatCard`
Flat stat block — no border, no background. Use in analytics grids.

```tsx
<StatCard label="Resolved" value={42} hint="85% resolution rate"
  icon={CheckCircle2} tone="success"
/>
```

### `EmptyState`
Centered empty state with icon, title, description, optional actions.

```tsx
<EmptyState icon={InboxIcon} title="No emails yet"
  description="Emails will appear here when received."
  iconColor="#4682B4"
  actions={<Button>Sync now</Button>}
/>
```

---

## Panel Components

### `SlideoverPanel`
Right-side detail panel for master-detail layouts. Header with close button, scrollable body.

```tsx
<SlideoverPanel open={!!selected} onClose={() => setSelected(null)}
  title="Details" width={320}
>
  <div className="p-4">...</div>
</SlideoverPanel>
```

### `ModalCard`
Center-screen modal with blur backdrop.

```tsx
<ModalCard open={open} onClose={close} title="Confirm">
  <p>Are you sure?</p>
</ModalCard>
```

### `BulkActionBar`
Selection bar when rows are checked.

```tsx
<BulkActionBar count={3} onClear={clearSelection}>
  <Button size="small">Mark as read</Button>
  <Button size="small" tone="destructive">Delete</Button>
</BulkActionBar>
```

---

## Form Components

### `TextInput`
The single source of truth for all text inputs. Every input in the app uses this component.

Props: `size?` ("normal" | "small" | "tiny"), `variant?` ("default" | "ghost" | "pill" | "search")

| Variant | Border | Background | Focus | Use case |
|---------|--------|------------|-------|----------|
| `default` | `border border-border` | `bg-background` | `focus:border-brand focus:ring-1` | Standard inputs |
| `ghost` | `border-0` | `bg-transparent` | None | Inline editing, search in panels |
| `pill` | `border border-border` | `bg-background` | `focus:border-brand focus:ring-1` | Special pill inputs (rounded-full) |
| `search` | `border border-border` | `bg-background` | `focus:border-brand focus:ring-1` | Search inputs (pl-9 for icon) |

| Size | Height | Font | Use case |
|------|--------|------|----------|
| `normal` | `h-10 sm:h-9` | `text-sm` | Primary form fields |
| `small` | `h-9 sm:h-8` | `text-sm` | Toolbar filters, compact forms |
| `tiny` | `h-8` | `text-[13px]` | Inline rename, dropdown search |

Design spec:
- Border radius: `rounded-xl` (12px) — round but not too round
- Focus ring: `focus:border-brand focus:ring-1 focus:ring-brand/20`
- Placeholder: `placeholder:text-fg-faint`
- Transition: `transition-all duration-150`
- Disabled: `opacity-50 cursor-not-allowed`

```tsx
<TextInput value={name} onChange={setName} placeholder="Enter name" />
<TextInput size="small" variant="search" placeholder="Search..." />
<TextInput size="tiny" variant="ghost" placeholder="Find..." />
<TextInput variant="pill" placeholder="Email" />
```

### `Textarea`
Multi-line version of TextInput. Same styling specs.

Props: `variant?` ("default" | "ghost")

```tsx
<Textarea value={bio} onChange={setBio} rows={3} />
<Textarea variant="ghost" className="text-[13px]" placeholder="Add note..." />
```

### `Dropdown`
Select component with search support and custom trigger rendering.

```tsx
<Dropdown
  value={selected}
  onChange={setSelected}
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  placeholder="Select..."
  searchable
/>
```

### `FieldRow`
Generic form row with label left, content right. Use for custom form layouts.

```tsx
<FieldRow label="Name" hint="Your full name">
  <TextInput value={name} onChange={setName} />
</FieldRow>
```

---

## Marketing Components

```tsx
<MarketingHero title="..." description="..." actions={<Button>...</Button>} />
<MarketingSection>...</MarketingSection>
<MarketingSectionHead title="..." description="..." />
<MarketingCTA title="..." description="..." actions={<Button>...</Button>} />
<FeatureGrid items={[{ icon: ..., title: ..., description: ... }]} />
```

---

## Settings Components

Defined in `client/src/components/settings-ui.tsx`. Every settings page uses these primitives.

```tsx
<SettingsSection title="General" description="Basic configuration">
  <SettingsTextRow    label="Name"   value={name}  onChange={setName} />
  <SettingsDisplayRow label="Email"  value="a@b.co" />
  <SettingsColorRow   label="Accent" value={color} onChange={setColor} />
  <SettingsSwitchRow  label="Active" checked={on}  onCheckedChange={setOn} />
  <SettingsLargeTextRow label="Bio"  value={bio}   onChange={setBio} rows={3} />
  <SettingsButtonRow  label="Export">
    <Button size="small">Export</Button>
  </SettingsButtonRow>
</SettingsSection>
```

---

## Core Components

### `Button`
All button variants. Every button in the app uses this component.

Design: `primary` | `secondary` | `outline` | `ghost` | `destructive` | `pill`
Size: `xs` (h-7, 10px) | `sm` (h-8, 12px) | `regular` (h-10/md:h-9, 12px)

Border radius is graded by size:
- `xs`: `rounded-[10px]`
- `sm`: `rounded-[12px]`
- `regular`: `rounded-[12px]`

```tsx
<Button design="primary">Save</Button>
<Button size="xs" design="ghost" icon={Sparkles}>Generate</Button>
<Button design="outline" size="sm">Cancel</Button>
```

### `IconButton`
Square icon-only button. Same sizes and designs as Button.

```tsx
<IconButton icon={X} size="sm" design="ghost" />
<IconButton icon={Trash2} size="xs" design="ghost" className="hover:text-destructive" />
```

### `TextInput`
See Form Components section above.

### `Textarea`
See Form Components section above.

### `Sidebar`
App navigation. Preserved structure.

### `AppLayout` / `Layout` / `ProtectedRoute`
Page wrapper components. Preserved structure.

---

## CSS Utility Classes

Shared component classes in `index.css`:

| Class | Purpose |
|---|---|
| `lds-input` | Standard input field styling (for internal use by TextInput component) |
| `lds-input-sm` | Compact input field |
| `lds-textarea` | Standard textarea styling |
| `lds-row-interactive` | Row hover state |
| `lds-app-topbar` | Page header bar |
| `lds-app-title` | Page title text |
| `lds-marketing-section` | Marketing content wrapper |
| `lds-badge-*` | Badge size and tone variants |
| `lds-display` | 52px marketing hero title |
| `lds-h1` | 40px marketing section title |
| `lds-h2` | 28px marketing subtitle |
| `lds-page-title` | 21px in-app page titles |
| `lds-section-title` | 15px in-app section headings |
| `lds-body` | 13.5px body text |
| `lds-eyebrow` | 11px uppercase marketing eyebrow |
| `lds-section-label` | 11px uppercase section label |

> **Note:** `lds-btn-*` classes have been removed — use `Button` component instead.

---

## Page Build Guide

### How to build a list page

1. Start with `<ListPage>` template
2. Add filters in `<PageToolbar>` using `<FilterChip>` / `<OptionsSelector>`
3. Use `<ListItem>` for each row
4. Show `<StatusBadge>` for status columns
5. Show `<ListSkeleton>` while loading
6. Show `<EmptyState>` when empty

### How to build a settings page

1. Wrap in `<AppLayout>` then `<AppPage>`, `<PageHeader>`, `<AppBodyNarrow>`
2. Group rows in `<SettingsSection>` blocks
3. Use the appropriate row type for each setting

### How to build a master-detail page

1. Start with `<ListDetailPage>` template
2. List content in the main area (DataTable or ListItem rows)
3. Detail content in `<SlideoverPanel>`
4. Track selected state in the parent

### How to build a dashboard/analytics page

1. Start with `<DataDashboardPage>` template
2. Use `<StatCard>` in a grid for key metrics
3. Use `<DataTable>` for data tables below

---

## Import Path

All components (except settings and preserved ones) import from:

```tsx
import {
  AppPage, PageHeader, AppBody, AppBodyPadded, AppBodyNarrow,
  ListPage, ListDetailPage, DataDashboardPage,
  ListItem, ListSection, ListSkeleton, TableSkeleton,
  StatusBadge, Badge, EmptyState, StatCard, DataTable,
  PageToolbar, PageToolbarGroup, FilterChip, PillFilter,
  OptionsSelector, Dropdown, SlideoverPanel, BulkActionBar,
  ModalCard, Section, FieldRow, Toolbar, Eyebrow,
  MarketingHero, MarketingSection, MarketingCTA, FeatureGrid,
} from "@/components/ds";
```

```tsx
import {
  SettingsSection, SettingsRow, SettingsTextRow,
  SettingsDisplayRow, SettingsColorRow, SettingsSwitchRow,
  SettingsLargeTextRow, SettingsButtonRow,
  SaveButton, GhostButton,
} from "@/components/settings-ui";
```

---

## What NOT to do

- Do not create ad-hoc styled buttons — use `Button` / `IconButton` from `@/components/button`
- Do not create custom inputs — use `TextInput` / `Textarea` from `@/components/text-input`
- Do not create custom page frames — use one of the three page templates
- Do not create custom list rows — use `ListItem`
- Do not create custom status badges — use `StatusBadge`
- Do not create custom tables — use `DataTable`
- Do not use cards or bordered containers — use divider rows
- Do not import `PageHeader` from `@/components/page-header` — import from `@/components/ds`
- Do not hardcode colors — use CSS variables (`border-border`, `bg-background`, `text-fg-muted`, etc.)
- Do not use `lds-btn-*` CSS classes — they have been removed; use `Button` component
- Do not use raw `<input>`, `<textarea>`, or `<button>` with inline styling — use the corresponding component
- Do not use different border-radius values — stick to the standardized scale
- Do not modify core components (`text-input.tsx`, `button.tsx`, `index.css` tokens) without engineering review
