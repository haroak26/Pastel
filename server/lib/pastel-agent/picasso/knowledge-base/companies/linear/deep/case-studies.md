# Linear — Case Studies

## Case Study 1: Issue List

### Layout Structure

Three-zone layout (the canonical Linear structure):

1. **Left sidebar** (240px, fixed): Dark background (Neutral 100), collapsible. Team/project hierarchy: Teams at top (with expandable project lists), then "Your issues," then custom views. Active item: accent text. Hover: subtle Neutral 300 background. Sidebar is 220-260px depending on collapsed state.
2. **Topbar** (48px, full remaining width): Breadcrumb path + view options (Filters, Display, Sort) + search/CMD+K trigger. Neutral 200 background, 1px Neutral 400 bottom border. Compact.
3. **Content area** (flex 1, scrollable): The issue list. Neutral 200 background. Header row with column labels. Issue rows below.

### Surface Treatments

- **Sidebar**: Darker than content (Neutral 100 vs Neutral 200), creating layered depth with color alone.
- **Topbar**: Matches content background (Neutral 200), minimal border below.
- **Issue list header**: 32px height, Neutral 200 background, column labels (12px, Neutral 500, weight 500). Subtle 1px Neutral 400 bottom border.
- **Issue rows**: 38px height. 1px Neutral 400 bottom border between rows (divider style, not card). Hover: Neutral 100 background (slightly darker, subtle). Selected: accent-colored 3px left border, no background change.
- **No alternating row colors.** Every row gets the same treatment. Divider lines separate.

### Typography Choices

- Page title / breadcrumb: 14px, Neutral 700, in topbar
- Issue title: 14px, Neutral 900, weight 400, truncates with ellipsis
- Issue ID: 12px, Neutral 500, monospace-ish, tabular-nums (LIN-1234)
- Column headers: 12px, Neutral 500, weight 500
- Metadata (dates, counts): 12px, Neutral 500, tabular-nums
- Keyboard shortcut hints: 10px, Neutral 500

Everything at 12-14px. Dense and consistent.

### Color Application

- Priority indicators (left edge of row): 3px colored bar — red (Urgent), amber (High), gray (Medium/Low)
- Status indicator (right side): 8px filled circle — green (Done), amber (In Progress), gray (Todo/Backlog)
- Assignee avatar: 20px grayscale circle
- Accent appears on: primary action button ("Create Issue"), active sidebar item, selected issue row left-border, focus rings
- All else: neutral grays

### Spacing

- Sidebar-to-content: 0px gap (color boundary)
- Content padding: 0px (list fills edge to edge, only internal cell padding)
- Row internal padding: 8px vertical, 12px horizontal (left) and 12px horizontal (right)
- Row height: 38px fixed
- Columns: variable width, 16-24px between

### What Makes It Distinctively Linear

The issue list is Linear's home screen, and it rejects every convention of project management tools. No cards. No board-as-default. No bright colors. Just a clean, keyboard-navigable list of rows with precisely the right amount of information. The priority color-coding is restrained (3px bar, not a badge). The density allows 25-30 issues visible without scrolling. The hover states are subtle. The selected state is clear but not loud. This is a tool for people who live in it 8 hours a day — every pixel decision prioritizes long-term usability over first-impression wow.

---

## Case Study 2: Issue Detail

### Layout Structure

Two-panel layout (context preserved on left):

1. **Left (70%)**: Issue detail content. Title (editable, 20px), description (rich text editor, 14px), activity feed below (comments, status changes, timeline events).
2. **Right (30%, 400-480px)**: Properties panel. Fixed position on this issue. Scrollable independently if content is long.
3. **Topbar**: Breadcrumb + issue ID + view options. Back arrow to return to list.
4. **Bottom**: Activity/comment composer, fixed at bottom of left panel.

The detail panel slides in from the right when an issue is opened from the list. The list remains visible on the left (blurred or shifted), preserving context.

### Surface Treatments

- **Left panel**: Neutral 200 background, scrollable. Description area: subtle Neutral 300 background card, 16px padding, 4px radius (rich text area).
- **Right panel**: Neutral 300 background (slightly elevated from content). Separated by 1px Neutral 400 vertical border.
- **Properties**: Compact label-value pairs. Label: 12px, Neutral 500. Value: 13px, Neutral 900. 8px vertical gap between properties. Grouped under section headers (14px, Neutral 800, weight 500).
- **Activity items**: Timeline-style with small colored icons/dots. Comment: left-aligned with author avatar. System event: compact, Neutral 500 text.
- **Composer**: Fixed at bottom, Neutral 200 background, 1px Neutral 400 top border. Textarea with minimal styling.

### Typography Choices

- Issue title: 20px, weight 600, Neutral 900, editable inline (click to edit)
- Issue ID in topbar: 14px, Neutral 500, monospace (LIN-1234)
- Description text: 14px, Neutral 700, rich text (supports markdown)
- Property labels: 12px, weight 500, Neutral 500
- Property values: 13px, weight 400, Neutral 900
- Comments: 14px, Neutral 700, author name 13px weight 600
- Timestamps: 12px, Neutral 500, tabular-nums

### Color Application

- Priority: displayed as colored label (text in priority color)
- Status: 8px colored circle + text (green/amber/gray)
- Assignee: 20px avatar + name
- Labels/tags: small Neutral 300 background pill, 12px text
- Accent on: "Save" button, editable field focus rings, active property dropdowns
- Activity icons: small colored dots to distinguish comment vs status change vs assignment

### Spacing

- Left panel padding: 32px top, 24px sides
- Right panel padding: 24px
- Between properties: 12px (compact)
- Between property groups: 24px
- Between activity items: 16px
- Composer height: 60-80px (expands with content)

### What Makes It Distinctively Linear

The issue detail rejects the "full-page detail" pattern. By keeping the list visible and sliding the detail in as a panel, Linear preserves spatial context — you know where you are and what's around you. The properties panel is aggressively compact, fitting assignee, status, priority, labels, project, cycle, estimate, and due date into 400px without scrolling. The activity feed is minimalist, with system events (status changes, assignments) rendered as quiet timeline items rather than chat bubbles. The overall feel is "information dashboard, not social feed."

---

## Case Study 3: Project Board View

### Layout Structure

Horizontal scrollable columns (Kanban-style):

1. **Topbar** (48px): Project name + breadcrumb + view switcher (List / Board / Calendar / Timeline) + filters + "Add issue" button.
2. **Board area** (remaining height): Horizontal scroll container. Columns auto-distribute. Each column: 280-320px width, fixed gap (16-24px) between columns.
3. **No sidebar** — or sidebar exists but content fills remaining space.

### Surface Treatments

- **Column header**: 40px height, Neutral 200 background, sticky at top. Status name (14px, weight 600) + issue count badge (12px, Neutral 500, Neutral 300 background pill). Draggable handle (subtle).
- **Column body**: Neutral 200 background (slightly transparent or solid), issue cards stacked vertically.
- **Issue cards**: White/light background (Neutral 300 in dark mode), 4px radius, no shadow. Compact: 8-12px padding. Card content: ID + title (14px, truncates) + assignee avatar (16px) + priority indicator + status. 8px gap between cards.
- **Drop zone**: Highlighted area (accent tint, subtle) when dragging over a column.
- **No column backgrounds** — board background is uniform Neutral 200.

### Typography Choices

- Column header: 14px, weight 600, Neutral 900
- Issue count: 12px, Neutral 500, inside subtle pill
- Card title: 13px, Neutral 900, truncates to 2 lines max
- Card ID: 11px, Neutral 500, monospace-ish
- Card metadata: 11px, Neutral 500

### Color Application

- Column headers: neutral
- Cards: neutral (no color)
- Priority: small colored bar on left edge of card (same as list view)
- Status: small colored dot on card
- Drop zone: subtle accent background (10% opacity)
- Accent on: "Add issue" button, active column header (if editable), drag handle hover

### Spacing

- Column width: 280-320px
- Between columns: 16-24px
- Card internal padding: 8-12px
- Between cards in column: 8px
- Topbar-to-board: 0px (flush)

### What Makes It Distinctively Linear

The board view is the same data as the list view, displayed with the same visual language — just arranged differently. The cards are NOT decorative. No card shadows, no rounded corners above 4px, no colored card backgrounds, no cover images. The board is a productivity surface, not a design showcase. The column layout is responsive (horizontal scroll, not wrapping). Drag-and-drop is responsive and keyboard-accessible. The view switcher (List / Board / Calendar) reinforces that these are the same issues, just organized differently — the visual language stays consistent across all views.

---

## Case Study 4: Command Palette (CMD+K)

### Layout Structure

Centered overlay, floating above all content:

1. **Backdrop**: Semi-transparent dark overlay (rgba(0,0,0,0.4)), covers entire viewport.
2. **Palette container**: 560-640px max-width, centered horizontally, positioned 20-25% from top of viewport. Neutral 300 background (dark mode), 4px radius, shadow-md. 1px Neutral 400 border.
3. **Search input**: Full-width at top. No border, merges with container. 44px height. 16px font. Placeholder: "Type a command or search..." Cursor auto-focused on open.
4. **Results list**: Below input. Grouped by category (Recent, Issues, Projects, Actions, Settings). Each group: header label (12px, Neutral 500, weight 500) + 4-8 item rows. Scrollable if results exceed viewport.
5. **Footer**: Subtle hint bar (32px height) showing keyboard shortcuts: "↑↓ Navigate  ↵ Open  ⌘+↵ New Tab  Esc Dismiss"

### Surface Treatments

- **Backdrop**: Dark overlay, click to dismiss, keyboard Escape to dismiss
- **Palette**: Neutral 300 background, distinct from page behind it. Shadow-md provides elevation.
- **Search input**: Active border: accent (1px, subtle). Cursor visible, blinking.
- **Result items**: 40px height. Icon (18px, Neutral 500) + title (14px, Neutral 900) + shortcut hint (10px, Neutral 500, keycap style) on right. Active/hovered item: accent background (10-15% opacity), icon inherits accent color.
- **Group headers**: Compact, 24px height, 12px Neutral 500 text, 12px left padding.

### Typography Choices

- Search text: 16px, weight 400, Neutral 900
- Result title: 14px, weight 500, Neutral 900
- Result description (if present): 12px, Neutral 500, below title
- Shortcut hints: 10px, weight 500, Neutral 500, inside subtle keycap (Neutral 400 background, 2px radius)
- Group headers: 12px, weight 500, Neutral 500, uppercase or tracking
- Footer: 11px, Neutral 500

### Color Application

- Palette background: Neutral 300 (elevated from page)
- Active item: accent background tint + accent text
- Icons: Neutral 500 (inherit accent on active)
- Keyboard hints: Neutral 500, subtle containers
- Backdrop: semi-transparent black
- Accent: only on active/hovered result item and search input focus border

### Spacing

- Palette width: 560-640px
- Palette margin from top: 15-25vh
- Search input height: 44px
- Result item height: 40px
- Group header height: 24px
- Item internal padding: 0 16px
- Icon size: 18px, 12px gap from text
- Between groups: 8px (subtle divider or empty space)
- Footer height: 32px

### What Makes It Distinctively Linear

The command palette is the spiritual center of Linear. It embodies every design value: keyboard-first, minimal visual weight, efficient density, warm accent against cool neutrals, sharp corners, no decoration. Opening CMD+K feels like unlocking the product's full power. The palette does not just search — it exposes every action in the app: create issue, switch team, change theme, navigate to settings, assign, set status. The keyboard shortcut hints on each result train the user to bypass the palette next time. This is the "teach a person to fish" approach to UX. The palette also reflects Linear's commitment to native-app feel — it opens instantly (100ms), focuses cursor, and responds to every keystroke without lag.

---

## Case Study 5: Settings

### Layout Structure

Three-column with sub-navigation:

1. **Left sidebar** (240px, fixed): Same as main sidebar but with Settings navigation. Sections: General, Account, Teams, Projects, Billing, Integrations, API, Notifications, Appearance, etc. Active section: accent text.
2. **Sub-nav (optional)** (180-220px): When a section has sub-pages (e.g., Teams → Members, Workflow, Permissions), a narrower sub-nav appears. Neutral 100 background. Compact link list.
3. **Content area** (remaining width): The settings form. White/Neutral 200 background, scrollable. Grouped settings panels.

### Surface Treatments

- **Settings panels**: Neutral 200 (or white in light mode) rectangular areas, no card borders, no shadow. Groups separated by 32px vertical space. Each panel: heading (16px, weight 600) + description (13px, Neutral 500) + form fields.
- **Form fields**: Compact (40px height), full-width in panel. Input: Neutral 300 background (dark), 1px Neutral 400 border, 4px radius. Label above input (12px, Neutral 600).
- **Toggle switches**: Compact, accent when active, Neutral 400 when inactive. No animation flourish — just on/off.
- **Danger zone** (bottom): Separated by extra vertical space (48px). Red-accented heading. Destructive button: transparent with red text and red border (1px).

### Typography Choices

- Section headings: 20px, weight 600, Neutral 900
- Panel headings: 16px, weight 600, Neutral 900
- Panel descriptions: 13px, Neutral 500, below heading
- Form labels: 12px, weight 500, Neutral 600
- Form values: 14px, Neutral 900
- Helper text: 12px, Neutral 500
- Danger zone heading: 16px, weight 600, Danger red

### Color Application

- Normal panels: neutral
- Active toggle: accent background
- Danger zone: red heading, red-outlined button
- Save button (per panel or global): accent (primary action)
- Section dividers: 1px Neutral 400

### Spacing

- Content padding: 32px top, 48px sides
- Between panels: 32px
- Panel internal padding: 24px
- Between panel heading and form: 16px
- Between form fields: 16px
- Danger zone margin-top: 48px

### What Makes It Distinctively Linear

Settings in Linear feel like the rest of the product — not an afterthought. The same sidebar, the same typography, the same spacing, the same accent behavior. Grouped panels replace bordered cards. The sub-navigation for complex sections (like Teams) keeps hierarchy clean without overwhelming the main sidebar. Danger zones are clearly demarcated with red but not alarming — just enough to signal caution. The overall impression: "This settings page was designed with the same care as the issue tracker." No feature feels like it was bolted on.
