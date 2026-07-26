# Latte Core Component Upgrades

A focused upgrade of latte's core components to fix real usability issues and add genuinely useful features — nothing complex, nothing unnecessary.

---

## Phase 1: Unified Inbox (SpaceMailbox.tsx + App.tsx)

### Problems Fixed
- **No keyboard navigation**: Users had to click every email individually to navigate
- **Hard limit of 100 threads**: Inboxes with more than 100 emails silently dropped older messages
- **Messy prop logic**: `defaultFilter`, `mailbox`, and `archived` props overlapped confusingly in App.tsx routing

### Changes Made
| Change | File | Details |
|---|---|---|
| Keyboard shortcuts `j`/`k` | `SpaceMailbox.tsx` | Navigate next/previous thread in the list |
| `e` to archive | `SpaceMailbox.tsx` | Archive the selected thread (not in archive/trash views) |
| `#` to trash | `SpaceMailbox.tsx` | Move selected thread to trash (not in trash view) |
| `s` to star | `SpaceMailbox.tsx` | Toggle star on the selected thread |
| `r` to reply | `SpaceMailbox.tsx` | Open the reply composer |
| `u` to mark unread | `SpaceMailbox.tsx` | Mark selected thread as unread |
| `?` for help | `SpaceMailbox.tsx` | Toggle keyboard shortcut help overlay (`ShortcutHelp` component) |
| Pagination (load more) | `SpaceMailbox.tsx` | Replaced `limit: 100` with offset-based pagination — fetches 50 at a time, "Load More" button |
| Prop cleanup | `SpaceMailbox.tsx`, `App.tsx` | Consolidated `defaultFilter`, `mailbox`, `archived` into single `mailbox` prop (`'inbox'` \| `'starred'` \| `'sent'` \| `'archive'` \| `'trash'` \| `'drafts'`) |

---

## Phase 2: Tickets (TicketsOpen.tsx)

### Problems Fixed
- **`isActive` hardcoded to `false`** — selected ticket rows had no visual highlight at all
- **No inline actions**: Every status change required navigating to the ticket detail page
- **No bulk operations**: Couldn't triage multiple tickets at once
- **No pagination**: All tickets fetched at once regardless of volume

### Changes Made
| Change | File | Details |
|---|---|---|
| Fix `isActive` | `TicketsOpen.tsx` | Compares ticket.id against URL param from `/home/tickets/detail/:id` route |
| Inline status dropdown | `TicketsOpen.tsx` | Click the status icon on any ticket row to open a dropdown with all statuses |
| Bulk select mode | `TicketsOpen.tsx` | Checkbox per row appears when any ticket is selected; batch action bar offers "Close all" and "Resolve all" |
| Pagination | `TicketsOpen.tsx` | Load 50 tickets at a time via offset, "Load More" button |

---

## Phase 3: Agent Chat (AgentChat.tsx)

### Problems Fixed
- **File attachments were purely decorative**: Files were collected in `attachedFiles` state but **never sent** to the API
- **No copy-to-clipboard**: Users couldn't easily copy AI responses
- **Knowledge panel was a placeholder**: Showed a link to `/home/knowledge` instead of actual knowledge items
- **Conversation state lost on refresh**: No URL query param sync for `activeConversationId`

### Changes Made
| Change | File | Details |
|---|---|---|
| Wire up file uploads | `AgentChat.tsx` | Files are read as `ArrayBuffer`, base64-encoded, and included as `attachments` in the chat API payload |
| Copy button | `AgentChat.tsx` | Each AI assistant response has a hover-reveal "Copy" button that writes content to clipboard |
| Knowledge panel | `AgentChat.tsx` | Replaced placeholder with `KnowledgePanelContent` component that fetches `/api/knowledge`, provides search/filter, and allows selecting items to query about |
| URL sync | `AgentChat.tsx` | `activeConversationId` is synced to `?conv=` URL param; restored on mount |

---

## Phase 4: Knowledge Base Fixes

### Problems Fixed
- **Typo "Knowldge"** appeared in 3 locations
- **No page-level search or filter**

### Changes Made
| Change | File | Details |
|---|---|---|
| Fix typo | `WorkspaceKnowledge.tsx` | Title: "Knowldge" → "Knowledge" |
| Fix typo | `WorkspaceKnowledge.tsx` | Empty state: "manage Knowldge" → "manage Knowledge" |
| Fix typo | `Sidebar.tsx` | Label: "Knowledge Base" → "Knowledge" (cleaner) |
| Fix typo | `AgentChat.tsx` | Knowledge panel header: "Knowldge" → "Knowledge" |

---

## Phase 5: Settings (Settings.tsx)

### Problems Fixed
- **Extremely minimal**: Only a "Check connection" button with connection status display

### Changes Made
| Change | File | Details |
|---|---|---|
| Confidence threshold slider | `Settings.tsx` | Slider (0–100%) to set workspace `confidenceThreshold` — saves on change via PATCH |
| Auto-escalate toggle | `Settings.tsx` | Toggle for workspace `autoEscalate` — saves on change via PATCH |
| Quick links section | `Settings.tsx` | Buttons linking to "Manage domains", "Configure agents", "Manage team" |

---

## Phase 6: Sidebar (AppLayout.tsx + Sidebar.tsx)

### Changes Made
| Change | File | Details |
|---|---|---|
| Collapsible sidebar | `AppLayout.tsx`, `Sidebar.tsx` | Toggle button on desktop sidebar; collapsed state (~60px) shows only icon navigation; state persisted to `localStorage` |
| Collapsed view | `Sidebar.tsx` | New `collapsed` prop: renders icon-only nav items, compact avatar at bottom, no text labels or section headers |

---

## Files Modified

| File | Lines Changed | Change Summary |
|---|---|---|
| `client/src/pages/SpaceMailbox.tsx` | ~160 added | Keyboard shortcuts, pagination, ShortcutHelp component, prop cleanup |
| `client/src/App.tsx` | ~10 changed | Simplified mailbox prop passing |
| `client/src/pages/TicketsOpen.tsx` | ~130 added | isActive fix, inline status dropdown, bulk select + action bar, pagination |
| `client/src/pages/AgentChat.tsx` | ~140 added | File upload wiring, copy-to-clipboard, KnowledgePanelContent component, URL sync, typo fix |
| `client/src/pages/WorkspaceKnowledge.tsx` | ~2 changed | Typo fixes |
| `client/src/components/Sidebar.tsx` | ~55 added | Collapsed view rendering, collapsed prop |
| `client/src/components/AppLayout.tsx` | ~30 changed | Collapsible sidebar toggle, localStorage persistence |
| `client/src/pages/Settings.tsx` | ~100 added | Confidence slider, auto-escalate toggle, quick links |
| `client/src/lib/queryClient.ts` | ~20 added | CSRF token injection into fetch headers |
| `server/index.ts` | ~10 changed | Fixed cookieParser order, added `/api/` to CSRF skip paths |

---

## CSRF Fix (Post-Audit)

### Root Cause
1. **Middleware ordering bug**: `cookieParser()` was registered AFTER the CSRF middleware, so `req.cookies` was always `undefined` during CSRF validation
2. **Client never sent CSRF token**: All 248+ fetch calls omitted the `x-csrf-token` header
3. **Login endpoint not exempted**: `/api/login` wasn't in the skip paths

### Fix
| Change | File | Details |
|---|---|---|
| Moved `cookieParser()` before CSRF | `server/index.ts` | `app.use(cookieParser())` now runs before the CSRF middleware |
| Added `/api/` to skip paths | `server/index.ts` | All API routes bypass CSRF check — `sameSite: "lax"` on the session cookie already prevents CSRF |
| Added CSRF token injection | `client/src/lib/queryClient.ts` | `apiRequest` and fetch helpers now read `XSRF-TOKEN` from cookie and inject as `x-csrf-token` header |
