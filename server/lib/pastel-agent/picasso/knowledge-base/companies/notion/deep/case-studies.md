# Notion — Case Studies

## Screen 1: Workspace Home

**Context:** The first screen after login. User needs to orient themselves, find recent work, and start something new. This is the navigation hub — it must communicate the entire workspace structure at a glance while staying calm and uncluttered.

**Layout:**
- Left sidebar (220px): Workspace name at top (14px medium). Below: collapsible page tree with emoji icons (16px), page names (14px, `#37352F`), disclosure triangles for children, depth indented at 16px per level with subtle vertical connection lines. "Add a page" link at bottom of each section. Workspace switcher compact at very top.
- Main area (centered, max-width ~900px): "Quick links" section at top with 2-3 favorited pages displayed as horizontal cards. Below: "Recent" section with a 3-4 column card grid. Each card: emoji icon (36px, centered or left-aligned), page title (14px medium), last-edited timestamp (12px secondary, `#9B9996`), hover reveals subtle background tint (`#F7F6F3`).
- Top: Breadcrumb reads "Home" — the workspace name, 14px secondary color.
- Right: No side peek open by default. Clean, focused, no distractions.

**Card grid details:**
- Cards are defined by whitespace and a subtle hover background — no borders, no shadows at rest
- Card dimensions: roughly 180-200px wide, flexible height for title wrapping
- 16px gap between cards in the grid
- Cards are clickable (full card is a link to the page)
- Right-click shows context menu: Open, Open in new tab, Rename, Duplicate, Move to, Delete

**Sidebar details:**
- Page tree shows exact nesting depth via left padding increments (16px per level)
- Connection lines: subtle vertical lines connecting parent to children, `#E8E7E4` color, 1px
- Disclosure triangles: 12px, `#6B6966`, rotate 90deg when expanded (150ms ease-out)
- Hover on a tree item: light background tint (`#EAE9E6`), drag handle appears (six dots)
- Drag-and-drop reordering: translucent placeholder, smooth reflow (200ms ease-in-out)
- Pages can be dragged OUT of the sidebar to move them to different parent pages
- Ctrl+click or Cmd+click opens a page in a new Notion tab (browser-level or app-level tab)

**Empty state (first-time user):**
- Main area: hand-drawn illustration (sparse, muted accent palette) — a simple character or abstract shape
- Text: "This is your workspace. Create your first page to get started."
- Prominent "Add a page" button (blue primary, 4px radius, 8px 16px padding)
- Sidebar shows only "Workspace" with "Add a page" link below
- No tour, no tutorial overlay, no "skip intro" button — just the invitation to start

**States:**
- Loading: sidebar shows skeleton rows (subtle gray pulsing bars), main area shows skeleton card grid
- Empty workspace (no pages ever created): graceful empty state as described above
- Many pages (50+): sidebar scrolls, main area paginates or shows "View all recent" link
- Offline: subtle banner at top "You're offline. Changes will sync when you reconnect." (amber tint)

## Screen 2: Document Page

**Context:** User is reading/editing a rich document page with mixed content types. This is the core Notion experience — the screen where users spend 80% of their time. The design must support focused writing, comfortable reading, and fluid interaction with many block types.

**Layout:**
- Center-aligned content column, 740px wide, left-justified text within. The column is centered in the viewport with generous side margins (64-96px depending on viewport width).
- Top of page (if no cover image): emoji icon (72px, clickable to open icon picker), page title below (40px, weight 700, editable in place — click to edit, shows text cursor).
- Optional cover image: full content-width, 200px tall, 0px radius (flush with column edges). The cover image has a "Change cover" button on hover (bottom-right, translucent dark background, white text).
- Content blocks flow vertically from top to bottom, with infinite scroll downward.
- Floating formatting toolbar: appears on text selection — a compact bar with B/I/U, link, comment, text color, background color. Positioned near the selection, never obscuring it. 8px internal padding, 6px radius, subtle shadow (`0 2px 8px rgba(0,0,0,0.10)`), white background.
- Block hover toolbar: six-dot drag handle appears on the left margin (outside the text column, overlapping into the gutter), "+" add-below button appears below the block. Both appear on hover with a subtle fade-in (100ms).
- Right side peek (toggled via page properties button): 320px panel slides in from right, reducing content area. Shows: Page properties (status, tags, created date, last edited), Backlinks (pages that link here), Comments (threaded).

**Block types and their visual treatments:**
- **Heading H2 (24px, weight 600):** 32px top margin, 8px bottom margin. Sits above body content with clear visual weight.
- **Body paragraph (16px, weight 400, line-height 1.5):** 8px top and bottom margin. Flows naturally.
- **Bullet list:** 8px between items, bullet marker is a small filled circle (4px), 16px indent from left edge. Each item is a full block, independently draggable.
- **To-do list:** Same as bullet but with a checkbox (16x16px, 4px radius, 1px `#DEDDDA` border, unchecked). Checked: green background tint, green checkmark. Click toggles with smooth 150ms transition.
- **Toggle:** Disclosure triangle (12px, rotates 90deg when open), heading text (16px weight 600), collapsed preview shows first ~40 characters in secondary color. Content inside is indented 24px from the toggle heading.
- **Callout:** 10% accent tint background (e.g., 10% blue), 4px radius, emoji icon on left (20px), 16px internal padding, body text at 16px. Full content width. The callout is the only block with a visible background.
- **Image:** Full content-width, 8px radius, optional caption below (14px secondary, centered). Click to expand to lightbox view (dark backdrop, image at natural size, click or Escape to close).
- **Code block:** `#F1F1F0` background (subtle warm gray), 4px radius, 16px padding, monospace font at 14px, language label in top-right (12px secondary), copy button on hover.
- **Quote block:** 2px left border in `#E8E7E4`, no background, 8px left padding, body text at 16px, slightly reduced opacity.
- **Divider:** 1px horizontal rule, `#E8E7E4`, 16px top and bottom margin. Full content width.
- **Database (inline):** Full content width (can break out of column). View tabs at top. "Add a view" + button. The database shows the currently selected view type.
- **Embed (Figma, YouTube, etc.):** Full content width, 8px radius, 1px `#E8E7E4` border. Renders the embedded content inline. Loading: gray placeholder until content loads.
- **Table of Contents:** Auto-generated list of page headings, each with heading level indent. Updates in real-time as headings change. Click to scroll to section.

**Scrolling and spatial cues:**
- Scroll position: subtle indicator. No prominent scrollbar — content flows seamlessly.
- An empty paragraph block is always present at the bottom of the document, shown as a faint blinking cursor in an otherwise blank line. This is the "keep writing" invitation.
- There is no "end of document" — content simply ends, implying that more can be added.
- When scrolling, a subtle "Back to top" button may appear (floating, bottom-right, 36x36px, 6px radius, shadow).

**States:**
- Loading: Content area shows skeleton blocks (gray pulsing bars matching the approximate layout). Page title loads first for immediate context.
- Read-only (shared page, no edit access): All blocks visible, toolbars hidden, cursor shows as default (not text). "You cannot edit this page" shown subtly at top.
- Editing conflict (multiplayer): If another user edits the same text, their changes appear seamlessly. No lock, no conflict dialog. Cursors are not shown — Notion is asynchronous-multiplayer.
- Offline editing: All changes saved locally. "Syncing..." indicator appears subtly until connection is restored.

## Screen 3: Database View (Table)

**Context:** User is viewing structured data in a table format. This is where Notion transitions from "document" to "spreadsheet" while maintaining the document feel. The table is likely filtered and sorted to show a specific subset of data.

**Layout:**
- Full-width table, not constrained to the 740px content column. Stretches to the full content area width (viewport minus sidebar, minus page margins: ~900-1100px).
- Top toolbar (table header area): View name displayed on the left ("Tasks" — 18px weight 600, editable in place). View switcher tabs: Table | Board | Calendar | Gallery | Timeline | List — active tab underlined (2px, accent color), inactive tabs in secondary text. Filter, Sort, Search, and "..." menu buttons on the right. "New" button (blue primary, far right) — creates a new row and opens it as a page.
- Column header row: Property names (12px medium, `#6B6966`), property type icons (14px, `#9B9996`), sort indicator when active. Column resize handle on right edge of each header (draggable).
- Data rows: 36px height. Alternating subtle backgrounds — white and `#F7F6F3` (the zebra striping is very faint, 2% brightness difference). Row number appears on hover at the far left (12px tertiary).
- Row hover: slight highlight across entire row, row operations appear at the left (drag handle, checkbox for multi-select), inline editing cursor appears when clicking a cell.

**Property type renderings:**
- **Text:** Plain text, left-aligned, 14px. Inline formatting supported (bold, italic, links).
- **Number:** Right-aligned, 14px, tabular figures. Formatted with commas/decimals as configured.
- **Select:** Small rounded badge, 4px radius, 10% accent tint background, 12px text, 2px vertical 6px horizontal padding. Color determined by the select option's configured color.
- **Multi-select:** Multiple badges inline, separated by 4px gap, wrapping to next line if needed.
- **Date:** Formatted date string (e.g., "Aug 9, 2026"), 14px. Relative dates shown with subtle "3 days ago" in secondary on hover.
- **Person:** Small avatar (20px, circle) + name (14px). Multiple people stacked horizontally.
- **Files & media:** Thumbnail preview (40x40px, 4px radius) + filename (14px). Click to preview.
- **Checkbox:** 16x16px checkbox, same styling as to-do items.
- **URL:** Link text in accent color, clickable. Shows domain in secondary on hover.
- **Email:** Mailto link, same styling as URL.
- **Phone:** Tel link, same styling as URL.
- **Formula:** Computed value displayed in 14px, light gray background (4px radius), 4px horizontal padding. Monospace for numeric formulas, text for string formulas.
- **Relation:** Page links, same styling as text links. Click to open related page.
- **Rollup:** Computed aggregate, displayed as text, number, or list depending on configuration.

**Interaction patterns:**
- Click a cell to enter inline edit mode. Cursor appears. Start typing to replace content.
- Tab moves to next cell. Shift+Tab moves to previous cell.
- Click the row's "Open" area (or double-click row number) to open the row as a full page.
- Column resize: drag the right edge of the column header. Minimum column width: 100px.
- Column reorder: drag the column header to a new position. Translucent placeholder during drag.
- "Add a property" `+` button: always visible at the far right. Opens property type picker.
- Right-click a row: context menu with Open, Duplicate, Delete, Copy link.

**Filter, Sort, and Search:**
- Filter button: shows count badge when active ("Filter 2"). Click to open filter panel (dropdown from button, 280px wide). Add filter rules: Property > Condition > Value. Multiple rules can be AND/OR.
- Sort button: shows count badge. Click to open sort panel. Add sort rules: Property > Ascending/Descending. Multiple sorts applied in order.
- Search field: text input, filters rows in real time as you type. Searches across all text properties.
- All filters/sorts/settings are per-view and do not modify the underlying data.

**States:**
- Empty database (no rows): "This database is empty. Add a new row to get started." with prominent "New" button. Column headers still visible.
- All rows filtered out: "No results match your current filters." with "Clear filters" link.
- Loading: skeleton rows (36px bars) with column structure visible.
- Very wide (many columns): horizontal scrollbar appears. First column (usually the title) can be frozen (pinned).
- Very long (many rows): rows load incrementally (virtual scrolling). Bottom rows load as user scrolls.

## Screen 4: Database View (Board / Kanban)

**Context:** User is managing workflow items in a Kanban-style board, grouped by a Select property (e.g., "Status": To Do, In Progress, Done). This is a direct visual translation of the same data shown in screen 3.

**Layout:**
- Horizontal scrolling columns. Each column represents a Select property value (grouping key).
- Column width: 280-320px, flexible. Columns fill available vertical space (full viewport height minus toolbar).
- Column header: colored dot (the select option's configured color, 10px) + column name (14px medium) + card count badge ("3" — 12px, light gray background, 4px radius) + "..." menu (more actions). `+` button at far right of header for adding a card directly to that column.
- Cards: white background, 1px border (`#E8E7E4`), 6px radius, subtle shadow (`0 1px 2px rgba(0,0,0,0.06)`), 12px internal padding. Cards are full column width minus 8px.
- Each card shows: page title (14px medium, 2 lines max then truncated), 2-3 visible properties below (configured per view), cover image preview if set (full card width at top, rounded top 6px).
- Property display on cards: priority tag (badge), due date (14px), assignee (20px avatar). Arranged vertically with 4px spacing.
- Drag-and-drop: card lifts on drag — slightly stronger shadow (`0 4px 8px rgba(0,0,0,0.12)`), slight scale up (1.02), translucent placeholder at drop target. Target column highlights (subtle border accent). Other cards reflow smoothly (200ms ease-in-out).

**Column and card interaction:**
- Click card: opens the page (same behavior as clicking a table row).
- Click `+` in header or at bottom of column: creates a new row, pre-set with that column's select value, opens as a new page.
- Drag card between columns: changes the select property value to the target column's value. Instant update in the underlying data.
- Column `...` menu: Hide column, sort cards within column, rename grouping (edit the select option), delete all cards in column.
- Horizontal scroll: columns scroll horizontally as a group. Drag on empty space to pan.

**Grouping options:**
- Grouped by any Select or Person property. Can be changed instantly via dropdown in the view toolbar.
- "No status" column appears for rows without a value for the grouping property.
- Hidden columns: select options can be hidden from the board via the "..." menu without deleting the data.

**States:**
- Empty column: "No items" text in tertiary (`#9B9996`), centered vertically in the column. Not alarming, just informative.
- Single card in column: card appears, column fills remaining height with empty space.
- Many cards (>20): column scrolls vertically. Scrollbar appears subtly on hover.
- Card drag conflict: if another user moves the same card simultaneously, the last update wins. No lock, no conflict UI.

## Screen 5: Settings & Members

**Context:** User is managing workspace-level settings: general preferences, team members, billing, security. This is where the product's utility language takes over from the content language. The design is clean, organized, and efficient.

**Layout:**
- Left sidebar (220px): Settings sub-navigation with grouped items in sections:
  - Workspace section: Settings, Members, Billing, Security & identity
  - Account section: My account, Notifications, Language & region
  - Data section: Import, Export, Trash
  - Developer section: Integrations, API
- Active nav item: subtle background highlight (10% accent tint), left-edge 2px accent indicator. Not bold, not oversized — the highlight is enough.
- Main panel (remaining width, max-width ~800px): Section heading at top (24px semibold), optional descriptive paragraph below (14px secondary). Then grouped form sections — each visually separated by 24px whitespace or subtle 1px dividers.
- Form section: card-like grouping (1px `#E8E7E4` border, 4px radius, 16px internal padding), section sub-heading (14px medium), input fields below with labels above.

**Form patterns:**
- Text inputs: 36px height, 4px radius, 1px `#DEDDDA` border, 8px horizontal padding, 14px text. Focus ring: 2px accent color outline. Placeholder text in `#9B9996`.
- Dropdowns/Selects: Same styling as text inputs. Custom dropdown panel (not native OS dropdown) for consistent styling. Selected value displayed with property-type icon if applicable.
- Toggle switches: 20px wide, 12px tall, 4px radius track. Knob: 12px circle, slides left (off, gray track) to right (on, accent track). Smooth 150ms transition.
- Buttons: Primary (accent background, white text, 4px radius, 8px horizontal 6px vertical padding, 14px medium), Secondary (transparent background, 1px `#DEDDDA` border, same dimensions), Danger (red text, transparent background, 1px red border — only for destructive actions like "Delete workspace").
- Radio groups: Vertical list of options, each with 16px radio circle (1px border, filled accent center when selected) + label (14px regular).
- File upload: dashed border area (1px `#DEDDDA`, 4px radius), centered text "Drag and drop or click to upload", click opens file picker.

**Members list view:**
- Table-style rows: avatar (28px, circle) + name (14px medium) + email (14px secondary) + role badge (12px, compact) + "..." menu on hover.
- Rows: 48px height, subtle bottom border (`#E8E7E4`).
- Role badges: "Workspace Owner," "Member," "Guest" — 4px radius, light gray background, 12px text, compact padding.
- Remove button: appears on hover, red text, only for removable members.
- Invite button: top-right of members section, primary blue. Opens invite modal (email input + role selector + "Send invite" button).

**Billing view:**
- Current plan displayed as a summary card: plan name (16px semibold), price (24px semibold), member count, features list.
- "Upgrade" button: primary. "Manage billing" link: opens Stripe customer portal.
- Payment method: last 4 digits, expiry, brand icon — displayed in a summary row.
- Invoice history: table with Date, Amount, Status (Paid/Open), Download PDF link.

**States:**
- Loading: The main panel shows skeleton content. The settings sidebar loads instantly.
- Saving: "Saving..." appears as a small inline indicator next to the changed field. Changes save automatically on blur.
- Saved: "Saved" checkmark appears briefly (2 seconds), then fades.
- Error: Inline error message below the field ("This field is required," "Invalid email format"). Red text, 12px. No modal, no banner.
- Unsaved changes when navigating away: subtle confirmation "You have unsaved changes. Leave anyway?"

**Key design decisions for Settings:**
- The settings interface feels consistent with the rest of Notion — same typography, same colors, same spacing, same calm restraint. There is no "settings UI" that looks different from "content UI."
- Breadcrumb at top: "Settings & members" — consistent with page breadcrumbs in the rest of the product.
- Settings navigation remains sticky/visible while the main panel scrolls.
- No decorative elements, no progress bars, no gamification. Clean, professional, utilitarian.
- The settings experience should feel reassuring: organized, clear, and trustworthy — exactly the qualities a user wants when managing their workspace infrastructure.
