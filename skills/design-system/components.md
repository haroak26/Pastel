# Latte Design System — Component Cookbook

> This is the practical reference: **how** to build each page type.
> All code examples use only primitives from `components/ds.tsx`, the four
> preserved primitives (Button / SecondaryButton / IconButton / TextInput), and
> the preserved Sidebar/Layout.

---

## Preserved Primitives — at a glance

### `<Button>` — primary CTA

```tsx
import { Button } from "@/components/button";

<Button>Save changes</Button>
<Button size="small">Save</Button>
<Button isLoading>Saving…</Button>
<Button tone="destructive">Delete account</Button>
```

- Dark ink background (`--primary`), not brand blue.
- Height 40px normal / 32px small.
- Radius 12px normal / 10px small.
- Use for: the single most important action on a view.

### `<SecondaryButton>`

```tsx
import { SecondaryButton } from "@/components/secondary-button";

<SecondaryButton>Cancel</SecondaryButton>
<SecondaryButton size="small">Filter</SecondaryButton>
```

- Hairline bordered, white surface.
- Used for: "cancel", "back", toolbar buttons, neutral secondary actions.

### `<IconButton>`

```tsx
import { IconButton } from "@/components/icon-button";
import { RotateCcw } from "lucide-react";

<IconButton icon={RotateCcw} aria-label="Refresh" />
<IconButton variant="ghost" size="small" aria-label="More">
  <MoreHorizontal />
</IconButton>
```

- Always has an `aria-label`.
- 36×36 default, 32×32 small.

### `<TextInput>` / `<Textarea>`

```tsx
import { TextInput, Textarea } from "@/components/text-input";

<TextInput placeholder="you@example.com" />
<TextInput size="small" />
<Textarea placeholder="Notes…" />
```

- 40px normal / 32px small, radius 10px.
- Focus state: brand outline ring (baked in).

### `<Dropdown>`

```tsx
import { Dropdown, type DropdownOption } from "@/components/ds";

<Dropdown
  value={selected}
  onChange={setSelected}
  options={[
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B", description: "With hint" },
  ]}
  placeholder="Choose…"
/>
```

- White card with light grey border, `rounded-xl`.
- Selected option highlighted with `bg-surface-hover` rounded box (`rounded-[10px]`).
- Small gap (p-1.5) between highlight and card edge.
- Supports generic type: `<Dropdown<number>>` for numeric values.
- Supports `renderTrigger` for custom trigger button content.

---

## 1) In-app page — canonical skeleton

Every app page follows this shape.

```tsx
import { AppLayout } from "@/components/AppLayout";
import {
  AppPage, AppTopbar, AppBodyPadded,
  PageHeading, Section, EmptyState,
} from "@/components/ds";
import { Button } from "@/components/button";
import { SecondaryButton } from "@/components/secondary-button";
import { Inbox, Plus, RotateCcw } from "lucide-react";

export default function ExamplePage() {
  return (
    <AppLayout>
      <AppPage>
        <AppTopbar
          title="Open Tickets"
          actions={
            <>
              <SecondaryButton size="small">
                <RotateCcw className="h-3.5 w-3.5" /> Refresh
              </SecondaryButton>
              <Button size="small">
                <Plus className="h-3.5 w-3.5" /> New ticket
              </Button>
            </>
          }
        />
        <AppBodyPadded>
          <PageHeading
            title="Open Tickets"
            description="Tickets that are still awaiting a response."
          />

          <Section title="Today">
            {/* content */}
          </Section>

          <Section>
            <EmptyState
              icon={Inbox}
              title="No tickets to show"
              description="New tickets will land here as they come in."
              actions={<Button size="small">Create ticket</Button>}
            />
          </Section>
        </AppBodyPadded>
      </AppPage>
    </AppLayout>
  );
}
```

### Rules
- **Always** both the top bar *and* the page heading. The top bar gives the
  app an anchor; the heading gives the page its own title.
- Never wrap `<AppTopbar>` in a div with its own background; it already has one.

---

## 2) Data table page

```tsx
import { AppLayout } from "@/components/AppLayout";
import {
  AppPage, AppTopbar, AppBodyPadded, PageHeading,
  Toolbar, ToolbarGroup, FilterChip, DataTable, Badge, EmptyState,
} from "@/components/ds";
import { TextInput } from "@/components/text-input";
import { Button } from "@/components/button";
import { User, UserPlus } from "lucide-react";

<DataTable
  columns={[
    { key: "name",   header: "Name",   render: (c) => <span className="font-medium">{c.name}</span> },
    { key: "status", header: "Status", render: (c) => <Badge tone={statusToneOf(c)}>{c.status}</Badge> },
    { key: "tickets", header: "Tickets", align: "right", render: (c) => c.ticketCount },
  ]}
  rows={contacts}
  getRowKey={(c) => c.id}
  empty={<EmptyState icon={User} title="No contacts yet" description="Invite your first teammate." />}
/>
```

Rules:
- The toolbar above the table is `<Toolbar>` + `<ToolbarGroup>` (left cluster = filter chips, right cluster = search + CTA).
- Filter tabs are `<FilterChip>` (pill-shape).
- For row highlight on click, pass `activeRowKey`.

---

## 3) Settings page

Uses `<AppBodyNarrow>` (720px) for readability.

```tsx
<AppLayout>
  <AppPage>
    <AppTopbar title="Workspace settings" />
    <AppBodyNarrow>
      <PageHeading
        title="Workspace settings"
        description="Configure how Latte behaves for this workspace."
      />
      <Section title="Identity" description="How this workspace appears across Latte.">
        <FieldRow label="Workspace name" hint="Shown in the sidebar.">
          <TextInput size="small" defaultValue="Acme Support" />
          <Button size="small">Save</Button>
        </FieldRow>
        <FieldRow label="Subdomain" hint="your-name.latte.app">
          <TextInput size="small" defaultValue="acme" />
        </FieldRow>
      </Section>

      <Section title="Danger zone" description="Irreversible changes.">
        <FieldRow label="Delete workspace" hint="All tickets and data will be removed.">
          <Button size="small" tone="destructive">Delete workspace</Button>
        </FieldRow>
      </Section>
    </AppBodyNarrow>
  </AppPage>
</AppLayout>
```

---

## 4) Stats page / dashboard

```tsx
<AppBodyPadded>
  <PageHeading title="Overview" description="This week at a glance." />

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-6">
    <StatCard label="Open tickets"  value="142"  hint="+12 vs last week" icon={Inbox} tone="brand" />
    <StatCard label="Avg response"  value="2h 4m" hint="-18%" icon={Clock} tone="success" />
    <StatCard label="Escalated"     value="6"    hint="2 new"  icon={AlertCircle} tone="warning" />
    <StatCard label="Resolved"      value="410"  hint="+40%" icon={CheckCircle} tone="success" />
  </div>

  <Section title="Activity" description="Recent events across the workspace.">
    {/* rows */}
  </Section>
</AppBodyPadded>
```

---

## 5) Marketing landing / feature / changelog / blog / contact / status

```tsx
import { Layout } from "@/components/Layout";
import {
  MarketingHero, MarketingSection, MarketingSectionHead,
  MarketingCTA, FeatureGrid, Eyebrow,
} from "@/components/ds";
import { Button } from "@/components/button";
import { SecondaryButton } from "@/components/secondary-button";
import { Link } from "wouter";
import { ArrowRight, Inbox, Bot, Zap, BarChart3 } from "lucide-react";

export default function Features() {
  return (
    <Layout>
      <MarketingHero
        eyebrowLabel="Platform"
        eyebrow="Everything your support team needs"
        title={<>Helpdesk built for<br />fast-moving teams.</>}
        description="Every tool your support team needs — without the enterprise complexity."
        actions={
          <>
            <Link href="/auth/register">
              <Button>Get started free <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
            <Link href="/pricing">
              <SecondaryButton>See pricing</SecondaryButton>
            </Link>
          </>
        }
      />

      <MarketingSection>
        <div className="space-y-14">
          <MarketingSectionHead
            eyebrow="Core features"
            title="The tools that move your team forward."
            description="Speed, context, and clarity — not bloat."
          />
          <FeatureGrid
            items={[
              { icon: Inbox,     title: "Unified inbox",     description: "…" },
              { icon: Bot,       title: "AI replies",        description: "…" },
              { icon: Zap,       title: "Automation rules",  description: "…" },
              { icon: BarChart3, title: "Performance reports", description: "…" },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingCTA
        title="Start delivering better support today."
        description="Set up in minutes. Resolve your first tickets before the end of the day."
        actions={
          <Link href="/auth/register">
            <Button>Get started today <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        }
      />
    </Layout>
  );
}
```

### Rules
- `<MarketingHero>` only once per page, always first.
- Each following section uses `<MarketingSection>` with a `<MarketingSectionHead>`.
- Every page ends with a `<MarketingCTA>`.

---

## 6) Legal / long-text page

```tsx
<Layout>
  <article className="mx-auto max-w-[720px] px-6 md:px-8 py-20 space-y-8">
    <header className="space-y-2">
      <h1 className="lds-h3">Privacy Policy</h1>
      <p className="lds-meta">Last updated: April 26, 2026</p>
    </header>
    <section className="space-y-4 lds-body text-[13.5px] leading-[1.8]">
      <h2 className="lds-h4 text-foreground">1) Information we collect</h2>
      <p>…</p>
    </section>
  </article>
</Layout>
```

---

## 7) Auth page (preserved visually)

Only `Login.tsx` and `Register.tsx` retain their current structure (per the
preservation contract). **All other** auth pages (`ForgotPassword`,
`ResetPassword`, `LoadingVerification`, `CompleteGithubSignup`) must match
this shell:

```tsx
<div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
  <div className="w-full max-w-[400px] space-y-8">
    <Link href="/" className="inline-flex items-center gap-2">
      <LatteLogoDark size={20} />
      <span className="text-[15px] font-bold text-foreground tracking-[-0.3px]">Latte</span>
    </Link>

    <div className="space-y-1.5">
      <h1 className="lds-h3">Forgot your password?</h1>
      <p className="lds-body text-[13px]">Enter your email and we'll send a reset link.</p>
    </div>

    {/* Form with <TextInput> + <Button>  */}
  </div>
</div>
```

---

## 8) Badge tones

```tsx
<Badge tone="brand">New</Badge>
<Badge tone="success">Resolved</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Breaking</Badge>
<Badge tone="info">Beta</Badge>
<Badge tone="neutral">Draft</Badge>
```

Size defaults to `sm` (18px). Use `size="md"` (20px) when nestled into headers.

---

## 9) Empty state

```tsx
<EmptyState
  icon={Inbox}
  title="No open tickets"
  description="Tickets needing a reply will appear here."
  actions={
    <>
      <SecondaryButton size="small">Learn more</SecondaryButton>
      <Button size="small">Create ticket</Button>
    </>
  }
/>
```

---

## 10) Anti-patterns (do not do)

**Don't** hand-roll a 48px bar:
```tsx
❌ <div style={{ height: 48, borderBottom: "1px solid #f0f0f0", padding: "0 24px" }}>…</div>
✅ <AppTopbar title="…" />
```

**Don't** hand-roll buttons:
```tsx
❌ <button style={{ background: "#111", color: "#fff", height: 36, borderRadius: 6, padding: "0 12px" }}>Save</button>
✅ <Button size="small">Save</Button>
```

**Don't** hand-roll a card:
```tsx
❌ <div className="rounded-xl border border-[hsl(220_14%_90%)] bg-white p-4">…</div>
✅ <Card><CardBody>…</CardBody></Card>
```

**Don't** hand-roll a table:
```tsx
❌ <table><thead>…</thead><tbody>…</tbody></table>
✅ <DataTable columns={…} rows={…} getRowKey={…} />
```

**Don't** invent new heading sizes:
```tsx
❌ <h1 style={{ fontSize: 24, fontWeight: 700 }}>My Tasks</h1>
✅ <PageHeading title="My Tasks" />  // uses .lds-page-title (21/600)
```

**Don't** mix radii on siblings:
```tsx
❌ buttons radius 6px, cards radius 16px, inputs radius 8px
✅ buttons 10–12px, cards 12px, inputs 10px (single scale)
```
