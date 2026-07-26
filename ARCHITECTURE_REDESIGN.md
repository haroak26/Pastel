# Latte Architecture Redesign: The Customer Hub

## Core Problem

The current "spaces" abstraction is confusing. A space is just an email inbox with IMAP credentials, but users have to create spaces inside workspaces, manage permissions per space, and navigate separate inboxes. This adds friction without value.

## The New Model: One Inbox, Many Channels

```
Workspace (meetlatte.com / "Latte")
  │
  ├── Unifed Inbox  ← ALL conversations, one place
  │   ├── Email (LMS)
  │   │   ├── support@    → ticket mode (SLA, AI routing, escalation, CSAT)
  │   │   ├── hello@      → shared inbox mode (collaborative, no ticket)
  │   │   ├── team@       → shared inbox mode
  │   │   ├── billing@    → billing team routing
  │   │   └── roadmap@    → automated mode (AI → feature request)
  │   ├── Chat (Web Widget)
  │   │   ├── AI mode (bot handles first response)
  │   │   ├── Human mode (live agent)
  │   │   └── Hybrid (bot triage → human handoff)
  │   └── Messenger (coming soon)
  │
  ├── Tasks  ← Linear-style Kanban
  │   └── Linked to conversations & roadmap items
  │
  ├── Product Hub  ← Gleap-style
  │   ├── Feature Requests (public board, upvote, comment)
  │   ├── Roadmap (drag-and-drop timeline, public/private)
  │   └── Changelog (auto-generated from completed tasks)
  │
  ├── Help Center
  │   ├── Public articles (help.latte.com)
  │   └── Internal SOPs
  │
  └── Teams & Settings
      ├── Teams (Billing, Engineering, Support)
      ├── Members with roles
      ├── Assignment rules / SLAs
      └── Analytics
```

---

## 1. Unified Inbox (replaces Spaces)

### What changes

| Current | New |
|---------|-----|
| Multiple `spaces` per workspace, each with own inbox | One unified inbox at the workspace level |
| `emailMessages` + `tickets` as separate tables | Single `conversations` table with `channel` field |
| Create a "space" to add an email address | Just configure an address — inbox mode auto-applies |
| Space switching in UI | Channel filter in the inbox |
| Space permissions via junction table | Inbox is workspace-level; teams handle routing |

### Address Modes

Every email address added to the workspace gets a **mode** that determines behavior:

| Mode | Description | SLAs | Tickets | AI | CSAT |
|------|-------------|------|---------|-----|------|
| **Ticket** | Full support flow (like Zendesk) | ✅ | ✅ | ✅ | ✅ |
| **Shared Inbox** | Collaborative (like Front) | ❌ | ❌ | Optional | ❌ |
| **Automated** | AI processes and routes elsewhere | ❌ | ❌ | ✅ | ❌ |

An address is just a configuration row, not a silo. All messages land in the same inbox — the mode just decorates behavior.

### Chat Channel

The chat widget (embedded on the customer's site) and AI chatbot are the **same channel**, not separate:

- Conversations start with the bot (AI) for instant replies
- Bot auto-escalates to a human when needed
- Agents can jump in anytime
- The widget is just the **delivery surface**

---

## 2. Tasks (already built)

Linear-style Kanban board with drag-and-drop. Already complete. Key integration points:

- Any conversation can become a task ("Create task from this ticket")
- Tasks can be linked to roadmap items
- Completed tasks auto-feed into changelog

---

## 3. Product Hub (needs building)

### Feature Requests

A public board where customers submit and upvote feature requests:

- Public page at `feedback.workspace.com` (or `/portal/feedback`)
- Submit with title, description, category
- Upvote (one per person)
- Internal triage: mark as "under review" / "planned" / "shipped"
- Auto-create a roadmap item or task from a feature request
- Notify upvoters when status changes

### Roadmap

A drag-and-drop timeline for planning:

- Columns: Now / Next / Later (or custom swimlanes)
- Items have: title, description, status, target date, linked tasks
- **Public mode**: publish selected items for customers to see
- **Private mode**: internal-only items
- Toggle visibility per item

### Changelog

Release notes, auto-generated from completed tasks:

- AI drafts changelog entries from task descriptions
- Group by version or date
- Categories: feature / improvement / fix
- Internal draft → publish to public page
- Public page at `changelog.workspace.com`
- Notify customers who upvoted related features when they ship

---

## 4. Help Center (already built, needs public front)

The knowledge base exists and is feature-rich. Missing piece: a public-facing help site.

Customers should be able to browse articles at `help.workspace.com` without logging in.

---

## 5. The Customer Loop (the SOTA differentiator)

This is what makes Latte unique — no other tool connects all these dots:

```
Customer says "I want X" via email/chat
  → Lands in unified inbox
  → AI detects it's a feature request
  → Customer gets link to upvote on public board
  → Team reviews, promotes to roadmap
  → Task created and assigned
  → Work completed
  → Changelog auto-generated
  → Upvoters notified: "It shipped!"
```

All in one platform. No data silos, no manual copy-paste between tools.

---

## Schema Changes

### New: `conversations` (replaces `emailMessages` + `tickets`)

```sql
conversations
  id            uuid PK
  workspaceId   FK → workspaces
  channel       enum: 'email' | 'chat' | 'messenger'
  addressId     FK → email_addresses (nullable, for email channel)
  fromAddress   text
  fromName      text
  subject       text
  body          text (latest message body)
  channelThreadId text (for threading)
  isRead        boolean
  isArchived    boolean
  isSpam        boolean
  mode          enum: 'ticket' | 'shared_inbox' | 'automated'
  status        enum: 'open' | 'pending' | 'resolved' | 'closed'
  assignedToId  FK → workspace_members (nullable)
  teamId        FK → teams (nullable)
  priority      enum: 'low' | 'medium' | 'high' | 'urgent'
  tags          jsonb
  metadata      jsonb (channel-specific data)
  createdAt     timestamp
  updatedAt     timestamp
```

### New: `conversation_messages`

```sql
conversation_messages
  id              uuid PK
  conversationId  FK → conversations
  fromAddress     text
  fromName        text
  body            text
  bodyHtml        text (nullable)
  channel         enum: 'email' | 'chat' | 'messenger'
  isInternal      boolean (note visible only to agents)
  attachments     jsonb
  metadata        jsonb
  createdAt       timestamp
```

### New: `email_addresses` (replaces space config)

```sql
email_addresses
  id            uuid PK
  workspaceId   FK → workspaces
  email         text (e.g., support@latte.com)
  mode          enum: 'ticket' | 'shared_inbox' | 'automated'
  imapHost      text
  imapPort      integer
  smtpHost      text
  smtpPort      integer
  username      text
  password      encrypted text
  forwardingRule jsonb (optional: auto-parse behavior)
  autoReply     jsonb (AI auto-reply config)
  createdAt     timestamp
```

### New: `roadmap_items`

```sql
roadmap_items
  id            uuid PK
  workspaceId   FK → workspaces
  title         text
  description   text
  status        enum: 'planned' | 'in_progress' | 'shipped' | 'cancelled'
  column        enum: 'now' | 'next' | 'later'
  priority      enum: 'low' | 'medium' | 'high' | 'critical'
  isPublic      boolean
  targetDate    timestamp (nullable)
  sortOrder     integer
  createdAt     timestamp
  updatedAt     timestamp
```

### New: `changelog_entries`

```sql
changelog_entries
  id            uuid PK
  workspaceId   FK → workspaces
  title         text
  description   text
  category      enum: 'feature' | 'improvement' | 'fix'
  version       text (nullable)
  isPublished   boolean
  publishedAt   timestamp (nullable)
  taskIds       uuid[] (FK → tasks, linked completed tasks)
  createdAt     timestamp
  updatedAt     timestamp
```

### New: `feature_requests`

```sql
feature_requests
  id            uuid PK
  workspaceId   FK → workspaces
  title         text
  description   text
  status        enum: 'open' | 'under_review' | 'planned' | 'shipped' | 'declined'
  upvoteCount   integer default 0
  customerEmail text (submitter)
  conversationId FK → conversations (nullable, source)
  roadmapItemId FK → roadmap_items (nullable, when promoted)
  createdAt     timestamp
  updatedAt     timestamp
```

### New: `feature_request_upvotes`

```sql
feature_request_upvotes
  featureRequestId  FK → feature_requests
  customerEmail     text
  createdAt         timestamp
  UNIQUE (featureRequestId, customerEmail)
```

### Tables to drop

- `spaces` (replaced by `email_addresses`)
- `workspaceMemberSpaces` (no longer needed — permissions are workspace-level)
- `emailMessages` (replaced by `conversations` + `conversation_messages`)
- `tickets` (merged into `conversations`)

### Tables to keep

- `workspaces` — same, top-level org
- `workspaceMembers` — same, with enhanced routing
- `agentTeams` → rename to `teams` (simpler)
- `teamMembers` → link teams to workspace members
- `knowledgeItems` / `knowledgeFolders` / `knowledgeTags` — same
- `tasks` — already built
- `customerPortalSessions` — same
- `slaPolicies` / `csatSurveys` — same

---

## UI Changes

### Sidebar (simplified)

```
│ Inbox      │ ← unified, replaces per-space mail
│ Tasks      │ ← same
│ Product    │ ← NEW: merge roadmap + changelog + feature requests
│ Knowledge  │ ← same (add public toggle)
│ Analytics  │ ← same
│─ ─ ─ ─ ─ ─│
│ Team       │ ← same
│ Settings   │ ← same
```

### Inbox Page

- **Filters at top**: All | Email | Chat | Messenger
- **Address tag**: shows which address it came to (support@, hello@, etc.)
- **Mode badge**: ticket / shared inbox
- **Left sidebar**: Teams, saved views, status filters
- **Main area**: conversation list with snippet, channel icon, status
- **Right panel**: conversation detail with thread timeline

### Product Hub Page

Three tabs:

1. **Feature Requests** — kanban board by status, public link, upvote counts
2. **Roadmap** — drag-and-drop lanes (Now / Next / Later), public/private toggle
3. **Changelog** — list of entries, auto-generate from tasks, publish

---

## Migration Plan

1. Create new tables (`conversations`, `conversation_messages`, `email_addresses`, `roadmap_items`, `changelog_entries`, `feature_requests`)
2. Migrate data: `emailMessages` → `conversations` + `conversation_messages`, `spaces` → `email_addresses`, `tickets` → `conversations` with metadata
3. Build unified inbox UI (replaces per-space mailbox)
4. Build Product Hub (roadmap + changelog + feature requests)
5. Build public portal pages (help center, feature requests, roadmap)
6. Add auto-changelog generation from completed tasks
7. Add customer notifications (feature request shipped, etc.)
8. Drop old tables after migration verified

---

## Pricing Strategy (for startups)

| Tier | Price | Seats | Features |
|------|-------|-------|----------|
| **Free** | $0 | 2 | 1 email address, basic inbox, 10 tasks |
| **Starter** | $19/mo | 5 | 3 email addresses, chat widget, tasks, roadmap |
| **Growth** | $49/mo | 15 | Unlimited addresses, AI agent, product hub, SLAs |
| **Scale** | $99/mo | Unlimited | Everything, priority support, custom branding |

Priced per workspace, not per seat. Startups can bring their whole team without nickel-and-diming.

---

## Summary: Why This Wins

| Problem | Current State | New State |
|---------|---------------|-----------|
| Spaces confuse users | Must create and manage spaces | Just add an email address |
| Data scattered | emailMessages + tickets + separate per space | One unified conversations table |
| No product feedback loop | Feature requests are tickets with upvotes | Dedicated board linked to roadmap + tasks |
| Roadmap is static | Hardcoded mock | DB-backed, drag-and-drop, public/private |
| Changelog is static | Hardcoded mock | Auto-generated from completed tasks |
| No public KB | Knowledge exists but no public front | Public help center at help.workspace.com |
| Tools fragmented | Customers use Intercom + Linear + Gleap + Zendesk | One platform, one price |

**Latte becomes the single source of truth for the entire customer relationship — from first contact to feature delivery.**
