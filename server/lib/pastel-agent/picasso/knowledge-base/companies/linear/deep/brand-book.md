# Linear — Brand Book

## Brand Personality

Linear feels like a **precision tool**. It is keyboard-first, intentionally dense, and unapologetically made for builders. The experience communicates: "We removed everything that slows you down."

Three words: **Dense. Calm. Builder-first.**

There is no decoration, no hand-holding, no "getting started" fluff. Linear assumes competence. The UI rewards power users without punishing newcomers — everything is discoverable via CMD+K.

The warmth comes from a single unexpected choice: a coral/rose accent against a sea of cool slate neutrals. It is the one humanizing note in an otherwise ruthlessly efficient interface.

## Tone of Voice

Direct, minimal, confident. Every word earns its place. No marketing superlatives. No exclamation marks. No adjectives that don't add information.

- **Do:** "Create issue." "Assign to." "Set priority."
- **Don't:** "Get started with issue tracking." "Learn more about our features."

Instructions are imperative and terse. Tooltips explain mechanics, not concepts. Error messages state the problem and the fix in one line. The voice is the same in the app, the changelog, and the marketing site: a calm engineer explaining how something works.

The about page says "Linear is a better way to build software." That's it. No "revolutionary," no "world-class." Just "better way." The product proves the claim.

## Visual Identity

### Core Palette

Dark mode by default (or at minimum, strongly associated with dark). Light mode exists but the brand's visual memory is dark.

- **Backgrounds:** Dark slate (`#1C2024`, `#212529`), slightly lighter surface (`#2A2F35`) for elevated areas. Pure black is never used.
- **Text:** Near-white (`#EEEEEE` or `#E6E8EB`) for primary text, muted gray (`#8F96A0`) for secondary, dimmer for tertiary (`#646B74`).
- **Accent:** Coral/rose family (`#E04F37` or warm `#F26B4E`). Used for primary actions, active states, priority indicators. Appears 2-4 times per screen.
- **Borders:** Subtle (`#2E3338`), thin (1px), used for dividers between list rows.
- **Semantic:** Green for Done/Completed (`#46A758`), amber for In Progress (`#D9A34A`), red for Urgent (`#E5484D`).

### Dark by Default

Linear's dark mode is not an option — it is the visual identity. The sidebar is darker than the content area, creating layered depth. The overall feel is calm and focused, like a code editor at night.

### Warm Accent Against Cool Neutrals

The single most distinctive Linear design choice: warm coral/rose accent against a field of cool slate grays. This contrast is humanizing — it prevents the interface from feeling sterile or clinical. The accent appears on:
- The primary action button (one per screen)
- Priority indicators (urgent issues)
- Active/focus states
- The CMD+K command palette highlight

### Sharp, Consistent

Corners are 2-4px everywhere. No rounded cards, no pill buttons, no soft edges. The geometry says "precision instrument." Consistency is absolute — every radius is the same, every border is the same, every divider is the same.

## Typography

### Sans-Only: Inter or Custom Geometric Sans

One typeface for everything. No serif moments, no display faces, no decorative typography. Linear uses Inter (or a custom geometric sans derived from it) at a compact scale:

- Body: 14px — denser than most products
- UI small: 12px — labels, metadata, timestamps
- Headings: 16-20px — modest, functional
- Page titles: 20-24px
- Tabular numbers on all numeric/ID columns

The compact scale is a feature: more information per viewport without feeling cluttered. It is readable because of meticulous spacing and hierarchy, not because of large type.

### Weight Discipline

One or two weights only. Regular (400) for body, medium (500-600) for headings and emphasis. No light weights, no black/extrabold. The limited weight range keeps the typography calm.

## Spacing Philosophy

Dense but not cramped. Every pixel of padding is intentional. The goal is to display the maximum useful information before the user must scroll — without feeling tight.

- Component padding: 8-16px (tight but adequate)
- Section margins: 32-48px (moderate — never 96px like Stripe)
- List row height: 36-40px (compact, keyboard-navigable)
- Sidebar item spacing: 6-8px between items

If Stripe asks "how much space can I give this?", Linear asks "how little space can this function with?"

## Key Patterns

### Keyboard-First, Everywhere

CMD+K opens the command palette — the central navigation metaphor. Every action is keyboard-accessible. Hover reveals shortcut hints (e.g., "Ctrl+Enter" to submit). The app trains users to use the keyboard without tutorials: shortcut hints are visible, discoverable, and progressively revealed.

### Sidebar + Content + Optional Detail Panel

The canonical Linear layout:
- **Left sidebar:** Darker background, project/team hierarchy, compact icons + labels
- **Content area:** Issue list (primary) or board/calendar/timeline view
- **Right panel (optional):** Issue detail, slides open from right

### Issue Rows, Not Cards

Linear does not display issues as cards. Issues are rows: checkbox + ID + title + assignee avatar + priority badge + status. This is a list, not a grid. The density allows 20-30 visible issues per screen without scrolling. Cards feel slow; rows feel fast.

### Color-Coded Priority

One of the few places Linear deploys color aggressively: priority indicators. Urgent = red, High = amber/orange, Medium = neutral, Low = gray. But even these are restrained — a small colored left-border or a tiny dot, not a full-color badge.

## What Makes Linear Linear

1. **The density.** Information-rich without feeling chaotic. Every screen is a productivity surface, not a brochure.
2. **The warmth of the accent against cool neutrals.** Coral/rose is an unexpected choice for a dev tool, and it works because it humanizes without softening.
3. **Keyboard-first philosophy.** CMD+K is the heart of the product. Power users feel like they're operating a tool, not navigating a website.
4. **Native-app feel in browser.** Fast transitions, no page reloads, right-click context menus, drag-and-drop. It behaves like an OS-native application.
5. **Consistency at scale.** Every view, every setting, every detail panel follows the same spacing, color, and typography rules. The system is total.

## Signature Moves

- **Dark sidebar, darker than content** — layered depth without shadows
- **Warm coral accent** — the one human note in a cold palette
- **Keyboard shortcut hints on hover** — visible, discoverable, educational
- **Compact but readable typography** — 14px body, 12px metadata
- **Issue rows with color-coded priority** — amber/orange for high, not cartoonish red
- **Command palette as primary navigation** — CMD+K does everything
- **Status icons as solid-color circles** — green (done), amber (in progress), gray (todo), no outlines
- **Right-detail panel that slides in** — preserves list context, doesn't navigate away

---

## Comparative Positioning: Linear vs. Peers

Understanding Linear's design by contrast:

| Dimension | Linear | Jira | Asana | Notion |
|-----------|--------|------|-------|--------|
| Mode | Dark-first | Light-only (historically) | Light with dark option | Light with dark option |
| Density | High (14px body, 38px rows) | Low (large cards, lots of chrome) | Moderate | Moderate to low |
| Accent | Warm coral/rose | Blue | Pink/purple gradient | Black/white minimal |
| Navigation | Sidebar + CMD+K command palette | Top nav + sidebar + tabs | Sidebar + topbar | Sidebar only |
| Data display | Rows with 1px dividers | Cards with borders and shadows | Cards and lists | Blocks and pages |
| Keyboard | First-class (shortcut hints on hover) | Partial | Partial | Partial (CMD+P) |
| Typography | 14px body, 12px meta, one weight family | 14px body, inconsistent | 14px body, varied | 16px body (default) |
| Corners | Sharp (2-4px) | Rounded (6-8px) | Rounded (6-12px) | Soft (4-6px) |
| Motion | Fast (100-150ms), native-feel | Slower, web-feel | Moderate | Moderate |
| Philosophy | Precision tool, keyboard-first | Enterprise feature-maximalism | Team-friendly, colorful | Document-first, flexible |

### What Linear Borrows From

- **Code editors (VS Code, Sublime):** Dark mode as default, command palette as primary interaction, keyboard-first philosophy, minimal chrome, fast performance expectations.
- **macOS/iOS design patterns:** Sharp corners, minimal shadows, right-click context menus, smooth sliding panels, native-app responsiveness. Linear feels like a macOS app that happens to run in the browser.
- **Command-line tools:** CMD+K mirroring terminal workflows, concise feedback, power user assumptions, terse language.
- **Swiss typographic design:** One typeface, disciplined weight range, hierarchy through size and position rather than decoration.

### What Linear Deliberately Rejects

- **Material Design:** Shadows, cards, rounded everything, bright colors, floating buttons. Linear is sharper and flatter.
- **"Fun" productivity tools:** Emoji reactions, confetti animations, colorful illustrations, gamification. Linear is serious but not cold.
- **Enterprise bloat:** Endless settings pages, multi-level navigation, wizards, onboarding flows, feature flags visible in UI. Linear hides complexity behind the command palette.
- **Dashboard/reporting UI:** Metric cards, charts, graphs, summary dashboards. Linear's primary interface is the issue list — data is consumed inline, not on a separate analytics page.
- **Collaboration-as-social:** Chat bubbles, typing indicators, presence avatars everywhere, "likes" and reactions. Linear's collaboration is functional (assignments, comments, status changes), not social.

---

## The Linear Design Test

A heuristic for evaluating whether a design "feels like Linear." Score each question 0-2:

1. **Is dark mode the default (or strongly primary)?** (2 for yes, 0 for light-first)
2. **Is the accent warm (coral, rose, warm orange) rather than cool (blue, teal)?** (2 for warm, 0 for cool)
3. **Is body text 14px or smaller?** (2 for yes, 1 for 15px, 0 for 16px+)
4. **Is the corner radius ≤4px everywhere?** (2 for yes, 0 for 6px+)
5. **Are data displayed as rows with dividers, not as cards?** (2 for rows, 0 for card grids)
6. **Are keyboard shortcut hints visible on hover?** (2 for yes, 0 for no)
7. **Is there a command palette (CMD+K-style) as primary navigation?** (2 for yes, 0 for no)
8. **Is the sidebar darker than the content area?** (2 for yes, 0 for same-color)
9. **Is one typeface used for everything?** (2 for one family, 0 for multiple)
10. **Are status indicators minimal (small dots/lines, not filled badges)?** (2 for yes, 0 for filled badges)

**Scoring:** 17-20 = Authentically Linear. 12-16 = Influenced but not fully committed. 7-11 = Generic productivity tool. 0-6 = Not remotely Linear.

---

## Applying Linear Design Principles to New Products

### When to Use Linear as a Reference

Linear's design language works best for products that:
- Are used intensively (hours per day) by technically sophisticated users
- Benefit from information density (data-heavy tools, engineering interfaces, analytics)
- Need to feel fast, responsive, and native-like in the browser
- Serve power users who value keyboard shortcuts and efficiency
- Have a focused purpose (Linear does issue tracking; it doesn't try to do everything)

### When to Divert from Linear

Linear's approach is less suitable for:
- Consumer-facing products (too dense, too dark, too austere)
- Marketing websites or brand experiences (too minimal, not emotionally engaging)
- Products for casual or occasional use (power-user features feel like overhead)
- Products that need to onboard non-technical users quickly (keyboard-first assumes motivation)
- Products that benefit from visual richness (media, design, creative tools)

### Adapting, Not Copying

The goal is not to clone Linear but to understand WHY each decision was made:
- Dark mode default = reduces eye strain for all-day use
- Coral accent = humanizes a tool that could feel sterile
- 14px body text = more information on screen for power users
- Command palette = unifies all actions under one interaction pattern
- Row dividers instead of cards = scanning speed for repetitive data
- Sidebar darker than content = spatial depth without decoration

When you understand the "why," you can adapt the principle to your context rather than copying the surface. A design tool might use Linear's command palette pattern but with a light-first, more colorful visual language. A financial tool might use Linear's density and keyboard patterns but with Stripe's neutral palette and trust-focused typography.

---

## The Essence of Linear in One Sentence

**Linear is what happens when a developer who loves VS Code, uses macOS, and hates Jira designs an issue tracker.** Every design decision flows from that sensibility: dark, dense, keyboard-first, warm accent, sharp corners, native feel, no decoration, respect for the user's time.
