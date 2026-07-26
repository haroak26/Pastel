# Latte Design System — Interaction & Layout Patterns

A "pattern" is the recurring combination of primitives used across multiple
pages. They are the second layer above primitives.

---

## 1) List-detail split (e.g. Contacts, Inbox)

Two-column layout: primary list on the left, optional right detail panel.

```
┌─────────────────────────────────────────┐
│ AppTopbar                               │
├────────────────────────┬────────────────┤
│ Primary list (min-w: 0)│ Detail panel   │
│  - Toolbar             │   (272–320px)  │
│  - DataTable / rows    │                │
└────────────────────────┴────────────────┘
```

Rules:
- Right panel uses `w-[280px]` to `w-[340px]`, hairline left border.
- Right panel has its own mini 48px header with close `<IconButton>`.
- On mobile the detail is a full-screen overlay, not a side column.
- Use `<Card>` for the detail content blocks, each with a small eyebrow
  (`<span className="lds-section-label">`).

---

## 2) Stepper (used on Register + CreateDomain)

```tsx
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i === current ? 20 : 6,
            background:
              i <= current ? "hsl(var(--foreground))" : "hsl(var(--border))",
          }}
        />
      ))}
    </div>
  );
}
```

- 6px dot / 20px pill for the active state.
- Title uses `.lds-h3`, subtitle `.lds-caption`.
- Bottom row: `[SecondaryButton for Back] [Button for Next]` — always in that order.

---

## 3) Toolbars (filters + search + actions)

```tsx
<Toolbar>
  <ToolbarGroup>
    <FilterChip active>All</FilterChip>
    <FilterChip>Open</FilterChip>
    <FilterChip>Pending</FilterChip>
    <FilterChip>Resolved</FilterChip>
  </ToolbarGroup>

  <ToolbarGroup>
    <TextInput size="small" placeholder="Search…" className="w-[220px]" />
    <Button size="small"><Plus className="h-3.5 w-3.5" /> New</Button>
  </ToolbarGroup>
</Toolbar>
```

Rules:
- Filter chips are always left-aligned; action buttons always right-aligned.
- Only one primary `<Button>` in a toolbar.
- Search uses `size="small"`.

---

## 4) Form / field row

```tsx
<Section title="Profile" description="How your name appears in Latte.">
  <FieldRow label="Display name" hint="Shown to your teammates.">
    <TextInput size="small" defaultValue="Alex Johnson" />
    <Button size="small">Save</Button>
  </FieldRow>
  <FieldRow label="Email">
    <TextInput size="small" disabled defaultValue="alex@acme.co" />
  </FieldRow>
</Section>
```

- Always pair a single row with **either** a save button **or** a passive readout — never both without thinking.
- `<Section>` handles its own top divider; don't wrap in another box.

---

## 5) Status dot + label

For lightweight inline status (e.g., "Active · last seen 4h ago"):

```tsx
<span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-success">
  <span className="w-1.5 h-1.5 rounded-full bg-success" />
  Active
</span>
```

For emphasized status chips — use `<Badge tone="…">`.

---

## 6) Banner (info / warning / danger)

No custom banner yet — use a `<Card>` with a coloured left accent border:

```tsx
<Card className="border-l-4 border-l-warning">
  <CardBody className="flex items-center gap-3">
    <AlertCircle className="h-4 w-4 text-warning shrink-0" />
    <div className="flex-1">
      <p className="text-[13.5px] font-semibold text-foreground">Action required</p>
      <p className="text-[12.5px] text-fg-muted mt-0.5">Verify your email to continue.</p>
    </div>
    <Button size="small">Verify</Button>
  </CardBody>
</Card>
```

If this becomes repetitive, promote it into `<Banner>` inside `ds.tsx`.

---

## 7) Pagination / "Show more"

Use a bottom centered `<SecondaryButton>`:

```tsx
<div className="flex justify-center pt-6">
  <SecondaryButton size="small">Show more</SecondaryButton>
</div>
```

No numbered paginator (yet).

---

## 8) Modals (future)

When a true modal/dialog is needed, use Radix Dialog wrapped in a `<Card>`
with a small header bar (48px), body at `<AppBodyNarrow>` padding, and
footer row using `<CardFooter>` with `[SecondaryButton Cancel] [Button Confirm]`.

For now, prefer navigation over modals — the majority of "configure this" flows
can be a settings page.

---

## 9) Icon usage

- All icons are `lucide-react`.
- Strokes default to `1.75` in meta contexts; `2` inside buttons and badges.
- Sizes: `h-3.5 w-3.5` inside buttons; `h-4 w-4` in row-leading icons;
  `h-5 w-5` for section-leading icons only.
- Color defaults to the surrounding text color via `currentColor`. Don't
  override icon color unless you're intentionally tinting.

---

## 10) When a page needs something new

1. Look in `components/ds.tsx` first.
2. If nothing fits, propose a **new primitive** (not a one-off), following:
   - Keep it stateless where possible.
   - Accept `className` override only for layout — never for color/typography.
   - Use tokens, never raw hex colors.
3. Add it to `ds.tsx`, update `components.md`, and only then use it.
4. After shipping, scan pages for the old version and migrate.

This is the only way the UI stays unified.
