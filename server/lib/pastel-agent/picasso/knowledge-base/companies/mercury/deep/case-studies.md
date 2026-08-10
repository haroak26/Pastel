# Mercury Case Studies — Screen-by-Screen Deep Dive

## Overview

Five key screens that define the Mercury experience. Each demonstrates how the design
system comes together to create a trustworthy, precise, and modern banking interface
for startups. The common thread: financial data presented with clarity and conviction.

---

## Screen 1: Dashboard

### Layout Structure
```
┌──────┬───────────────────────────────────────┐
│      │                                       │
│  ☰   │  Dashboard                            │  ← minimal top bar
│      │                                       │
│  Nav ├───────────────────────────────────────┤
│      │                                       │
│  ▶︎   │  Cash Balance                         │
│      │                                       │
│  Das │  $247,831.42                          │  ← hero number
│      │  ▴ +12.4% this month                  │
│  Tra │                                       │
│      │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  Car │  │Operating│ │ Savings │ │Reserve  │  │  ← account cards
│      │  │$82,431  │ │$150,000 │ │$15,400  │  │
│  Set │  └─────────┘ └─────────┘ └─────────┘  │
│      │                                       │
│  Tea │  Recent Transactions                   │
│      │                                       │
│      │  Jun 12   Stripe Payment      +$1,200 │
│      │  Jun 11   AWS                 -$423   │
│      │  Jun 11   TransferWise        -$2,500 │
│      │  Jun 10   Deposit             +$5,000 │
│      │         [View all →]                  │
│      │                                       │
│      │  Quick Actions                         │
│      │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│      │  │Send │ │Dep. │ │Card │ │Inv. │      │
│      │  └─────┘ └─────┘ └─────┘ └─────┘      │
│      │                                       │
└──────┴───────────────────────────────────────┘
```

### Key Design Decisions

**Sidebar Navigation**: On desktop, a fixed left sidebar provides persistent navigation.
Items are clearly labeled: Dashboard, Transactions, Cards, Settings, Team. The active
page is highlighted with the accent color and a subtle left-border or background.
This navigation pattern is familiar to SaaS users, and Mercury operates more like a
SaaS platform than a consumer bank.

**Hero Balance**: The cash balance is the most prominent element — the largest text on
screen by a significant margin. It answers the single most important question ("How
much money do I have?") immediately. The trend indicator below it (+12.4%) provides
context without competing. The number uses tabular figures and is right in the visual
center of the content area.

**Account Cards**: Three account cards sit in a horizontal row below the hero balance.
Each shows the account name, balance, and a subtle status indicator. These cards use
clean white backgrounds with subtle borders and 6px border radius. They're compact
but distinct — the user can scan accounts at a glance.

**Recent Transactions**: A condensed table showing the last 4-5 transactions. Rows
show date, counterparty name, and amount (colored by type — green for credits, red
for debits). The "View all" link is right-aligned below the table, using the accent
color. This section provides immediate context for the cash balance without requiring
navigation.

**Quick Actions**: A row of icon + label buttons for common tasks: Send Money, Deposit,
Manage Cards, Invite Team. Each is a rounded rectangle with a subtle gray background
and a simple icon. These surface the most common actions so users don't hunt through
menus.

---

## Screen 2: Transactions

### Layout Structure
```
┌──────┬───────────────────────────────────────┐
│      │                                       │
│  ☰   │  ← Transactions                       │  ← back to dashboard
│      │                                       │
│  Nav │  ┌──────────────────────────────┐      │
│      │  │ 🔍 Search transactions...    │      │  ← search bar
│      │  └──────────────────────────────┘      │
│      │                                       │
│      │  All  Credits  Debits  Pending  ▾      │  ← filter tabs + date filter
│      │  [active]                            │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Date       Description    Amount │  │  ← table header
│      │  ├──────────────────────────────────┤  │
│      │  │ Jun 12     Stripe Payment       │  │
│      │  │ 10:42 AM   Subscr. Rev.  +$1,200│  │  ← individual rows
│      │  ├──────────────────────────────────┤  │
│      │  │ Jun 11     AWS                  │  │
│      │  │ 3:15 PM    Cloud Svcs.    -$423 │  │  ← red for debit
│      │  ├──────────────────────────────────┤  │
│      │  │ Jun 11     TransferWise   pend. │  │  ← amber for pending
│      │  │ 9:00 AM    Contractor     -$2.5K│  │
│      │  ├──────────────────────────────────┤  │
│      │  │ Jun 10     Deposit               │  │
│      │  │ 8:00 AM    Opening Bal.  +$5,000 │  │
│      │  ├──────────────────────────────────┤  │
│      │  │ Jun 09     GitHub                │  │
│      │  │ 2:30 PM    Team Seats     -$84   │  │
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │               ← 1  2  3  ...  10 →    │  ← pagination
│      │                                       │
└──────┴───────────────────────────────────────┘
```

### Key Design Decisions

**Search and Filters**: The search bar sits prominently at the top of the transaction
view. Filter tabs (All, Credits, Debits, Pending) allow quick segmentation. A date
filter dropdown on the right enables range selection (This month, Last month, Custom).
The filter UI is simple — no complex faceted search. Mercury trusts that most users
know what they're looking for.

**Table Design**: Columns are Date, Description (with sub-line for detail), Category
(optional, shown as a small tag), and Amount. Amounts are right-aligned with tabular
figures so decimal points and commas align perfectly in vertical scanning. The column
spacing is tight (8-12px cell padding) to maximize visible rows.

**Amount Coloring**: Credits (money in) are displayed in green. Debits (money out) are
in red. Pending transactions are amber. This semantic coloring is immediate — users
process transaction types without reading. The colors use a tinted background on the
amount cell for additional visibility (green background for credits, red background
for debits), though this may be subtle enough to avoid visual clutter.

**Row Details**: Each transaction row shows two lines: the counterparty name (bold,
14-16px) and a description or category line (regular, 12-14px, gray-500). The date
column includes both date and time for same-day transactions. Timestamps are in 12-hour
format for US users.

**Pagination**: Centered below the table. Simple numbered pagination with previous/next
arrows. Mercury paginates rather than infinite-scrolling — this is financial data, and
deterministic navigation matters. Users need to know they can find a specific
transaction reliably.

**Empty State**: When there are no transactions matching filters: a simple centered
illustration (geometric, minimal), "No transactions found," and a prompt to adjust
filters or check back later. Never alarming, never confusing.

---

## Screen 3: Transfer

### Layout Structure
```
┌──────┬───────────────────────────────────────┐
│      │                                       │
│  ☰   │  ← New Transfer                       │
│      │                                       │
│  Nav │  From account                         │
│      │  ┌──────────────────────────────┐      │
│      │  │ Operating Account · $82,431 ▾│      │  ← account selector
│      │  └──────────────────────────────┘      │
│      │                                       │
│      │  To                                   │
│      │  ┌──────────────────────────────┐      │
│      │  │ Search recipient or enter...  │      │  ← recipient input
│      │  └──────────────────────────────┘      │
│      │                                       │
│      │  Amount                               │
│      │  ┌──────────────────────────────┐      │
│      │  │ $  __________                │      │  ← amount input (large)
│      │  └──────────────────────────────┘      │
│      │                                       │
│      │  Memo (optional)                      │
│      │  ┌──────────────────────────────┐      │
│      │  │ Add a note...                 │      │  ← memo input
│      │  └──────────────────────────────┘      │
│      │                                       │
│      │  Delivery speed                        │
│      │  ○ Standard (1-2 business days) Free  │  ← speed selector
│      │  ● Instant (seconds) Fee: $2.50       │
│      │                                       │
│      │  ┌──────────────────────────────┐      │
│      │  │      Review Transfer          │      │  ← primary CTA
│      │  └──────────────────────────────┘      │
└──────┴───────────────────────────────────────┘
```

### Key Design Decisions

**Linear Flow**: Single, linear column — no steppers, no wizards. Top to bottom: what
account, who gets it, how much, any note, how fast, then review. Familiar and predictable.

**Account Selector**: Dropdown showing accounts with current balances. Users see the
balance before choosing, avoiding overdrafts.

**Recipient Input**: Combined search/input with saved recipients as suggestions.
Prioritizes speed for repeat transfers.

**Amount Field**: Visually prominent (18-20px), focused state with accent border, dollar
sign embedded. Shows available balance after transfer: "You'll have $79,931.42 remaining"
— a helpful, non-intrusive safety check.

**Delivery Speed**: Radio buttons with clear labels and fees. Default is "Standard (free)"
— Mercury doesn't push fee-generating options.

**Review Screen** (after clicking primary CTA):
```
  Review Transfer
  ──────────────
  From:   Operating Account (···4821)
  To:     Stripe Inc. (···9214)
  Amount: $2,500.00
  Memo:   Contractor payment — June
  Speed:  Standard (Free)
  ──────────────
  [ Back ]    [ Confirm Transfer ]
```
The review step presents all details in a scannable card. "Back" to edit, "Confirm
Transfer" to complete. This two-step pattern (form → review → confirm) reduces errors
without friction.

**Confirmation**: Receipt with reference number and ETA: "Transfer complete. $2,500.00 is
on its way to Stripe Inc." A "Back to Dashboard" CTA returns to the main view.

---

## Screen 4: Card Management

### Layout Structure
```
┌──────┬───────────────────────────────────────┐
│      │                                       │
│  ☰   │  ← Cards                              │
│      │                                       │
│  Nav │  Physical Cards                        │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Mercury Debit  ···· 4821         │  │
│      │  │                                  │  │
│      │  │  Status: Active            ●     │  │  ← green status dot
│      │  │  Spend limit: $5,000/day         │  │
│      │  │  ATM limit: $500/day             │  │
│      │  │                                  │  │
│      │  │  [ Freeze Card ]  [View Details] │  │  ← action buttons
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │  Virtual Cards                         │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Virtual Card  ···· 3157          │  │
│      │  │ Status: Active            ●      │  │
│      │  │ Spend limit: $2,000/month        │  │
│      │  │ Created for: SaaS subscriptions  │  │
│      │  │ [ Freeze ] [Edit Limit] [Delete]  │  │
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Virtual Card  ···· 8092          │  │
│      │  │ Status: Frozen           ◉      │  │  ← amber paused dot
│      │  │ Spend limit: $1,000/month        │  │
│      │  │ [ Unfreeze ] [Edit Limit] [Delete]│  │
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │  [ + Create Virtual Card ]            │  ← call to action
│      │                                       │
│      │  Card Transactions                     │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Jun 12   Figma            -$48   │  │
│      │  │ Jun 11   Notion           -$10   │  │
│      │  │ Jun 10   AWS              -$423  │  │
│      │  │ Jun 09   GitHub           -$84   │  │
│      │  └──────────────────────────────────┘  │
└──────┴───────────────────────────────────────┘
```

### Key Design Decisions

**Physical vs. Virtual Cards**: Clear separation between physical (primary) and virtual
(purpose-specific) cards. Physical card shows more prominently; virtual cards are compact
with status, limit, and purpose label.

**Card Status**: Colored dot: green for Active, amber/gray for Frozen. Freeze/unfreeze
requires confirmation dialog — safety-critical UI with no accidental activation.

**Virtual Card Creation**: Simple form: name/purpose, spend limit, optional expiration.
Instant creation, card number shown once with "Copy" button and save warning. After
dismissal, only last four digits shown.

**Spend Limits**: Configurable per card with inline edit or modal. Changes take effect
immediately.

**Card Transactions**: Below the card management section, a filtered transaction list
shows all transactions for all cards (or filterable per card). This provides a unified
view of card spending. The table format mirrors the main Transactions view for
consistency.

---

## Screen 5: Settings & Permissions

### Layout Structure
```
┌──────┬───────────────────────────────────────┐
│      │                                       │
│  ☰   │  ← Settings                           │
│      │                                       │
│  Nav │  ── Team ──                           │
│      │                                       │
│      │  Team Members                          │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ 👤 Alex Chen                Admin│  │  ← team member rows
│      │  │    alex@company.com         Owner│  │
│      │  ├──────────────────────────────────┤  │
│      │  │ 👤 Sarah Kim                Admin│  │
│      │  │    sarah@company.com              │  │
│      │  ├──────────────────────────────────┤  │
│      │  │ 👤 Marcus Johnson          Member│  │
│      │  │    marcus@company.com             │  │
│      │  ├──────────────────────────────────┤  │
│      │  │ 👤 Priya Patel            Viewer │  │
│      │  │    priya@company.com              │  │
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │  [ + Invite Team Member ]             │
│      │                                       │
│      │  ── Permissions ──                    │
│      │                                       │
│      │  Roles:                               │
│      │  Owner  ·  Admin  ·  Member  ·  Viewer│
│      │                                       │
│      │  Owner permissions:                    │
│      │  ☑ Manage team members and roles      │
│      │  ☑ View all accounts and transactions │
│      │  ☑ Send and receive transfers         │
│      │  ☑ Manage cards                       │
│      │  ☑ Access API keys                    │
│      │  ☑ Close account                      │
│      │                                       │
│      │  ── API Keys ──                        │
│      │                                       │
│      │  ┌──────────────────────────────────┐  │
│      │  │ Production Key                    │  │
│      │  │ mer_live_●●●●●●●●●●●●●●●●●●●●   │  │  ← masked API key
│      │  │ Created: Jan 15, 2024             │  │
│      │  │ Last used: 2 hours ago            │  │
│      │  │ [ Reveal ]  [ Regenerate ]        │  │
│      │  └──────────────────────────────────┘  │
│      │                                       │
│      │  ── Audit Log ──                       │
│      │                                       │
│      │  │ Jun 12  Alex C.  Created transfer  │
│      │  │ Jun 11  Sarah K. Invited member    │
│      │  │ Jun 10  Alex C.  Updated settings  │
│      │  │ Jun 09  System   Deposit received  │
│      │           [View full audit log →]     │
└──────┴───────────────────────────────────────┘
```

### Key Design Decisions

**Team Management**: Team members are displayed in a simple list — avatar, name, email,
and role badge. Each row has an overflow menu for actions: Change Role, Remove.

**Roles and Permissions**: The permissions model is role-based (Owner, Admin, Member,
Viewer). Selecting a role shows its permissions as a read-only checklist — transparent
and simple. No granular per-permission toggles: startup teams don't need that complexity.

**Invite Flow**: "Invite Team Member" opens a modal: email, role dropdown, optional
message. Pending invites appear with a "Pending" badge. Fast and frictionless.

**API Keys**: Displayed with masking (first 4 + last 4 chars). "Reveal" is a deliberate
action. "Regenerate" requires confirmation. Created date and last-used timestamp for
audit context.

**Audit Log**: A condensed list (date, actor, action) with a "View full audit log" link
to a dedicated page with filtering and export.

**Account-Level Settings**: Business details, statements, linked accounts, notifications,
and close account — organized with clear section grouping.

---

## Summary — The Pattern Across All Screens

1. **Clean white dominates**: Background is neutral so data can speak
2. **Hero numbers are prominent**: Cash balance is always the largest text on screen
3. **Tabular figures everywhere**: Financial data aligns perfectly, always
4. **Semantic colors are unambiguous**: Green = credit, red = debit, amber = pending
5. **Accent is functional**: Blue appears only for interactive elements, never decoration
6. **Forms are linear**: Top-to-bottom, single column, clear labels above fields
7. **Confirmation steps**: Always review before committing money
8. **Data density matches context**: Tables compact, dashboards clear, marketing pages breathe
9. **Motion is fast**: Under 200ms — responsive, not decorative
10. **Sidebar navigation**: SaaS pattern, not consumer banking
