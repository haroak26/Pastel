# Vercel — Case Studies

## Screen 1: Vercel Dashboard

**Context:** User lands on their dashboard after login. They need to see all projects, deployment statuses, and navigate to specific projects. This is the command center — it must communicate the state of every project at a glance and provide immediate access to the most important information.

**Layout:**
- Left sidebar (220px): Dark background (`#111111`). Vercel logo (triangle mark, 24px) at top — this is the only persistent brand element on every screen. Navigation items with icons (20px, monochrome, stroke-based) + labels (14px medium, `#EDEDED`): Overview, Projects, Domains, Analytics, Settings, Team. Active item: `#222222` background highlight + 2px left-edge white border. Inactive items: no background, subtle hover to `#1A1A1A`. User avatar + name at the bottom of sidebar (24px avatar, 14px medium name, 12px secondary email). Sidebar separated from main content by 1px `rgba(255,255,255,0.08)` right border.
- Top bar (48px): Minimally populated. Search/command palette trigger on the right side (magnifying glass icon + "Search..." placeholder, 14px, monospace styling). Bell icon (notification indicator — small red dot when unseen notifications exist). User menu dropdown (avatar + name, click to reveal: Account, Settings, Logout). Background matches sidebar (`#111111`). This bar exists primarily for the command palette trigger — power users rarely click anything else here.
- Main content area: Section heading "Projects" (24px semibold, `#FFFFFF`, negative letter-spacing -0.03em) at top-left. "New Project" button (white primary: white background, black text in dark mode, 4px radius, 8px 16px padding, 14px medium) at top-right. Below: grid of project cards.
- Project card grid: 3-4 columns (responsive), 16px gap. Each card is a `#1A1A1A` dark surface with 1px `rgba(255,255,255,0.08)` border, 6px radius. No shadow at rest. Cards are clickable — full card is a link to the project overview.
  - Card top: Deployment preview image (16:9 aspect ratio, full card width, rounded top corners 6px). This is a live screenshot of the deployed application, not a placeholder. Updates on each deployment.
  - Card body (16px padding): Project name (16px semibold, `#FFFFFF`), domain name (13px mono, `#888888`, truncated with ellipsis), status row below: 8px status dot + label (12px medium). Green dot + "Ready" (production deployments), green dot + "Preview" (preview deployments). Last deployed timestamp (12px secondary). Framework logo may appear as a small icon in the corner of the card body.
  - Card hover: Background lightens to `#222222`. Border becomes slightly more prominent (`rgba(255,255,255,0.12)`). No shadow change — the background shift is the sole hover signal.
  - Card right-click: Context menu with Open, Open in new tab, View latest deployment, Settings, Delete.

**Responsive behavior:**
- Wide viewport (1440px+): 4 columns, cards ~330px wide
- Standard viewport (1024-1439px): 3 columns
- Tablet viewport (768-1023px): 2 columns
- Mobile: 1 column, sidebar collapses to hamburger menu

**Status dot conventions across the dashboard:**
- Green dot (`#0F9D58`, 70% saturation): Ready, Deployed, Active, Online
- Amber dot (`#F4B400`, 70% saturation): Building, In Progress, Pending, Queued
- Red dot (`#DB4437`, 70% saturation): Error, Failed, Canceled
- Gray dot (`#888888`): Disabled, Paused, Archived

**Empty states:**
- No projects at all: "No projects yet. Import a Git repository to get started." with a prominent "Import Project" button (white primary, 4px radius). No illustration. No decoration. Just the message and the button. The sidebar still shows all navigation items.
- All projects filtered (search with no matches): "No projects match '[search query]'." with "Clear search" link.
- No recent deployments (project exists but never deployed): Card shows without a preview image — a placeholder dark gradient or "No preview" text.

**Loading state:**
- Skeleton cards: Dark pulsing rectangles matching the card grid layout. 3-4 columns of card-shaped skeletons with subtle brightness oscillation (1.5s loop). Sidebar loads immediately — navigation is always available.

**Key design decisions:**
- Every pixel communicates project status and identity — no decorative elements
- Preview images are the primary visual differentiation between cards — they make the dashboard feel alive
- The sidebar is compact and consistent — always present, always the same
- Status dots enable ultra-fast scanning: a green-heavy dashboard means "everything is healthy"
- The "New Project" button is always in the same position — muscle memory for frequent users

## Screen 2: Project Overview

**Context:** User has clicked into a specific project. They need deployment history, domain configuration, analytics summaries, environment variables, and settings access — all from a single organized view.

**Layout:**
- Project header bar: Project name (20px semibold, `#FFFFFF`, negative letter-spacing -0.02em) on the left. Git branch indicator (pill shape, dark background, branch icon + branch name "main", 12px mono, 4px radius). "Visit" button (external link icon, opens deployed site in new tab). Right-aligned: Settings gear icon, "..." more menu.
- Tab navigation: Horizontal row of tabs — Deployments | Analytics | Domains | Environment Variables | Settings | Logs. Active tab: white underline (2px), white text. Inactive tabs: `#888888` text, no underline. 14px medium. Tabs separated by 24px gaps. Full-width, sits below the project header.
- Main content area (Deployments tab active): 
  - Deployment list: Vertical list, latest deployment at top. Each deployment row: 40px height, 1px `rgba(255,255,255,0.05)` bottom border. Layout: left side shows commit message (14px medium, `#EDEDED`, truncated after ~60 characters with ellipsis), below the message: Git branch name + commit hash (12px mono, `#888888`, hash is truncated to 7 characters with "Copy hash" on click). Right side shows: status dot + label (12px), deployment timestamp (12px secondary, relative time like "2 hours ago"), "Visit Preview" link (12px, blue/accent, only for preview deployments).
  - Rows are clickable — navigate to deployment detail.
  - Row hover: Background highlight (48px full-width, extending beyond the text content).
  - "Current" badge: small white pill on the production deployment row (4px radius, 8px horizontal padding, white background, black text, 11px medium).
  - Pagination: "Load more deployments" button at the bottom for long histories.
- Side panel (right column, ~280px): Project information summary.
  - Repository section: Git icon + repo name (14px medium). Repository URL below (13px mono, `#888888`, truncated). "View on GitHub/GitLab/Bitbucket" link.
  - Framework section: Framework logo (16px) + framework name (14px medium). Detected automatically on import.
  - Team section: Face pile of team members with access. "Manage access" link.
  - Domain section: List of configured domains. Production domain highlighted. Each domain: domain name (14px mono), SSL status indicator (small green lock icon).
  - Latest deployment summary: small card with commit message + timestamp + status dot.

**Analytics tab (when active):**
- Time range selector: 24h | 7d | 30d | Custom — horizontal pill selector
- Summary metrics row: 4 metric cards in a row — Requests, Bandwidth, Error Rate, Avg Response Time. Each: large number (32px semibold, tabular), label below (12px secondary), trend indicator (green up arrow + "12%" or red down arrow + "3%")
- Mini chart: small sparkline showing requests over the selected time period. Dark background, thin white plot line, subtle fill below.
- "View full analytics" link — navigates to the dedicated Analytics page

**Environment Variables tab (when active):**
- Section heading: "Environment Variables" (16px semibold)
- Table layout: Key | Value | Environments | Actions
- Value column: Redacted by default (••••••••). "Reveal" toggle per variable.
- Environments: Pill badges (Production, Preview, Development) — multi-select
- "Add variable" button. Each row has Edit/Delete actions on hover.

**Settings tab (when active):**
- Sections: Build & Development Settings, Serverless Functions, Domains, Security, Integrations, Transfer
- Each section: collapsible or scroll-to. Section sub-heading (16px semibold), organized form fields below.
- Build settings: Framework preset (dropdown), Build command (text input with monospace value), Output directory (text input), Install command (text input), Root directory (text input). Each field: label above (13px medium), input below (36px height, 4px radius, 1px border, monospace value inside).
- "Save" button per section or global "Save changes" button.

**States:**
- Loading: Tab navigation visible immediately. Content area shows skeleton rows (deployment list) or skeleton cards (analytics). Project header always loads first for context.
- No deployments: "No deployments yet. Push a commit to your [branch] branch to trigger your first deployment."
- Failed deployment: Row shows red status dot + "Failed" label. Row has subtle red-tinted left border (2px) if the failure is recent. "View logs" link prominent.
- Building deployment (in progress): Row shows amber status dot + "Building" label. A subtle progress bar may appear at the top of the content area if a build is currently active.

## Screen 3: Deployment Detail (Build Logs)

**Context:** User is inspecting a specific deployment. They need build output, deployment configuration, and actionable information about success or failure. This is the most "developer-native" screen in Vercel.

**Layout:**
- Deployment header bar: Commit message (16px semibold) on the left. Below: branch name + commit hash (13px mono, copy-on-click). Right side: deployment duration (14px mono, "1m 23s"), deployment status indicator (dot + label). Action buttons: "View Preview" (white primary), "Cancel" (only visible during active builds, red/destructive), "Redeploy" (secondary, ghost).
- Main content area — Build log terminal:
  - Terminal container: Full-width, `#0A0A0A` background (darker than cards — the deepest background in the interface), 6px radius, 1px `rgba(255,255,255,0.08)` border. No internal chrome — just the terminal surface.
  - Terminal header bar: Minimal — "Build Logs" label (12px medium, `#888888`) on the left. Right side: "Copy raw logs" button (ghost, icon + label), "Download logs" button (ghost).
  - Log output: Geist Mono at 13px, line-height 1.6 for readability. Each log line structured as:
    - Timestamp: `[12:34:56]` — 13px mono, `#666666` (tertiary text)
    - Level indicator (optional, for structured logs): INFO, WARN, ERROR, DEBUG — colored text
    - Message: 13px mono, white (`#FFFFFF`) for standard output
    - Color conventions: INFO = white, SUCCESS/COMPLETE = muted green, WARNING = muted amber, ERROR/FAILED = muted red, BUILD STEP = bold white
  - Build step labels: Each major step (Installing dependencies, Building, Optimizing, Uploading) is visually separated by 8px spacing above and a bold label line.
  - Active builds: Terminal auto-scrolls to the latest output. A pulsing cursor or indeterminate progress bar at the bottom indicates activity.
  - Completed builds: Terminal shows the full output. Final line shows build result: green "Build completed successfully." or red "Build failed with exit code 1."
- Side info panel (right of terminal, or below on narrow screens):
  - Deployment ID: "dpl_abc123..." — monospace, selectable, copy button
  - Build time: start and end timestamps (14px secondary)
  - Source: Repository + branch + commit (with links to the commit on the Git provider)
  - Environment: Production or Preview label (pill badge)
  - Environment variables: Count ("12 variables") — click to reveal list (values redacted)
  - Deployment URL(s): Production URL and/or Preview URL — monospace, clickable links
  - Serverless functions: Count + list (if any)

**Interaction details:**
- The terminal text is selectable — developers often need to copy error messages
- Scroll position is independent — the user can scroll back to review earlier output while the build continues (auto-scroll can be toggled)
- "Copy raw logs" copies the full, unformatted log output including ANSI color codes (if rendered)
- Failed builds: the error lines are visually highlighted with a subtle red left-border (2px) within the terminal. "View full error" expands collapsed error details.
- Build step timing: Some steps show duration ("Dependencies installed in 12.3s") at the end of the step output
- Clicking the commit hash in the header navigates to the Git provider's commit page

**States:**
- Build queued (not yet started): Terminal shows a single line "Build queued..." with a subtle animation (ellipsis incrementing). Estimated wait time if available.
- Build in progress: Active terminal output, auto-scrolling, amber status dot. "Cancel" button prominent. Timer showing elapsed build time.
- Build succeeded: Terminal shows full output + green "Build completed successfully." at the bottom. Green status dot + "Ready." "Visit Preview" button prominent.
- Build failed: Terminal shows full output + red "Build failed." Error lines highlighted. Red status dot + "Failed." "View full error" option. "Redeploy" button prominent.
- Build canceled: Terminal shows output up to cancellation point + "Build canceled by [user]." Gray status dot + "Canceled."

**The terminal aesthetic is critical:**
- It must feel like a real terminal, not a styled UI widget — developer authenticity matters
- No rounded corners inside the terminal area, no decorative borders between log lines
- The monospace rendering must be pixel-perfect — misaligned characters destroy trust
- ANSI color codes (if used by the build process) should be rendered correctly — Vercel preserves the developer's own log formatting choices

## Screen 4: Vercel Homepage (Marketing)

**Context:** Prospective user visiting vercel.com. This is the only surface where Vercel allows itself to be visually expressive. The page must communicate the product, build trust, and drive signup — while remaining unmistakably "Vercel."

**Layout:**
- Navigation bar (72px): Dark background (`#0A0A0A`). Vercel logo (triangle + wordmark, white) on the left. Nav items (14px medium, `#888888`): Products, Docs, Templates, Customers, Enterprise, Pricing. Right side: "Deploy" (white primary button, 4px radius), "Sign In" (ghost link).
  - Nav hover: white text (from `#888888` to `#FFFFFF`), instant transition.
  - Mobile: hamburger menu, same options.
- Hero section (full viewport height, dark `#0A0A0A` background):
  - Large headline: 48-64px, Geist, semibold, tight letter-spacing (-0.04em), white. Example: "Develop. Preview. Ship." or "Your complete platform for the web." Single line or short two-liner.
  - Subheadline: 20px, Geist, weight 400, `#888888`. One to two sentences explaining the value proposition.
  - CTA row: "Start Deploying" (white primary button, large — 14px medium text, 12px 24px padding, 4px radius) + "Talk to Sales" (ghost secondary, white border, same dimensions). Buttons horizontally adjacent with 12px gap.
  - Hero visual: Abstract geometric composition — intersecting translucent planes, wireframe spheres, triangular elements, layered shapes in the accent color (purple/pink, `#FF0080` territory) over the near-black background. This visual occupies ~50% of the hero area, opposite or surrounding the text. It is abstract and architectural — never a product screenshot, never a device mockup, never photography. The visual communicates "infrastructure" and "precision" through geometry.
- Framework logos strip: Horizontal row of framework/logos icons — Next.js, Svelte, Vue, Nuxt, Astro, Remix, Angular, etc. Each 24px, monochrome white (or original color if recognizable). Evenly spaced with 32-48px gaps. This section is 48-64px tall — compact, informational. It says "we work with everything" without a single word.
- "Develop" section: Alternating dark background. Content: "Develop" heading (32px semibold) + description (16px secondary) on the left. Product screenshot or demo animation on the right. Screenshots: actual product UI, not mockups. Dark backgrounds to blend with the page.
- "Preview" section: Alternating lighter background (dark gray `#111111` or slightly lighter). Same layout pattern. Screenshot showing preview URLs and collaboration features.
- "Ship" section: Alternating dark background. Screenshot showing deployment metrics, global edge network map, or speed indicators.
- Features grid: 3 columns (responsive: 2 on tablet, 1 on mobile). Each feature card: `#1A1A1A` background, 1px border, 6px radius, 16px padding. Feature icon (24px, white, stroke-based). Heading (20px semibold). Description (14px secondary). Cards have no hover effect — they are informational, not interactive.
- Enterprise section: Dark background band. Heading "Enterprise" (32px semibold). Security compliance badges in a row: SOC 2, GDPR, ISO 27001, PCI DSS — each as a small badge (official or custom rendered in monochrome). Enterprise features list: SSO, dedicated support, custom SLAs, etc. Enterprise customer logos: monochrome white, small (80-100px wide), horizontal row.
- Stats/metrics banner: Dark background. Large numbers in Geist (48px semibold, tabular): "35+ million," "99.99% uptime," "100+ countries." Each number paired with a short label (14px secondary) below.
- Footer: Dark background (`#0A0A0A`). Sitemap layout — columns for Products, Resources, Company, Legal. Each column: heading (14px medium, `#FFFFFF`), links below (14px, `#888888`, hover to white). Bottom: Vercel logo + copyright + language selector. No decorative elements.

**Key design decisions for the marketing site:**
- The marketing site uses the same Geist typography, dark backgrounds, and 4-6px radii as the product — it feels continuous, not separate
- Geometric abstract visuals in the hero are THE brand statement — they're more memorable than any screenshot could be
- Framework logos are always visible (hero strip) — they signal ecosystem compatibility immediately
- Photography, stock imagery, and illustrations are completely absent — even on the marketing site
- The "Develop. Preview. Ship." triad appears on this page as the headline — it's a brand message, not UI copy
- Light background sections exist (alternating pattern) but the site always returns to dark — dark is the default
- Typography (Geist) carries the visual weight more than any other element

## Screen 5: Analytics

**Context:** User is viewing detailed analytics for a project. Charts, metrics, and Web Vitals displayed with high data density and zero decoration. This is engineering analytics, not marketing analytics.

**Layout:**
- Header: Project name + "Analytics" label (20px semibold). Time range selector: horizontal pill tabs — Last 24h | 7d | 30d | Custom. Active tab: white background, black text. Inactive: transparent, `#888888` text. Custom opens date range picker.
- Summary metrics row: 4 metric cards in a horizontal row (responsive: 4 on wide, 2x2 on narrow).
  - Each card: `#1A1A1A` background, 1px border, 6px radius, 16px padding.
  - Large number (32px semibold, Geist, tabular figures). Examples: "1.2M" (Requests), "42.8 GB" (Bandwidth), "0.12%" (Error Rate), "124ms" (Avg Response).
  - Label below number (12px secondary).
  - Trend indicator: small arrow (up-green or down-red) + percentage change compared to previous period. 12px, positioned to the right of or below the number.
  - Sparkline: a miniature trend line (40px wide, 20px tall) inside the card showing the last 24h or 7d trend — subtle, thin white line, no fill, no axes. Provides instant visual context for the number.
- Charts section (2-column grid, full-width): Request volume over time (line chart), bandwidth over time (area or line chart), error rate over time (line chart), response time percentiles (p50/p75/p95/p99 line chart). Each chart card: `#1A1A1A` background, 1px border, 6px radius.
  - Chart area: Dark background (`#0A0A0A` within the card), subtle horizontal grid lines (`rgba(255,255,255,0.04)`, 1px). X-axis: time labels (12px secondary, rotated or abbreviated). Y-axis: values (12px secondary, left-aligned). Plot lines: thin (1.5px), colored per series. No fill under lines unless it's an area chart for bandwidth. No 3D effects. No gradients in chart plots.
  - Hover tooltip: appears on data point hover. Dark background (`#1A1A1A`), 1px border, 4px radius, 8px padding. Time + value displayed in monospace (Geist Mono, 13px). Tooltip follows cursor with small offset.
  - Chart loading: skeleton area matching chart dimensions.
- Filters row: Path/route filter (text input — autocomplete with common paths), Device type (All | Desktop | Mobile | Tablet — segmented control), Country (dropdown with search), Status code filter (2xx, 4xx, 5xx — multi-select pills).
- Web Vitals section: Table layout below charts.
  - Heading: "Web Vitals" (16px semibold) + short description (14px secondary) explaining what's measured.
  - Table columns: Metric (14px medium) | Value (14px mono, tabular) | Rating (Good/Needs Improvement/Poor — green/amber/red label) | P75 (14px mono) | P95 (14px mono) | P99 (14px mono)
  - Rows: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift), FCP (First Contentful Paint), TTFB (Time to First Byte). Each row: 40px height, 1px bottom border.
  - Rating labels: "Good" (green text or green-tinted pill, 12px), "Needs Improvement" (amber), "Poor" (red). All muted — never saturated.
- Route-level data table: Breakdown by URL route.
  - Columns: Route Path (14px, left-aligned) | Requests (14px mono, right-aligned, tabular) | Bandwidth (14px mono, right-aligned) | Error Rate (14px mono, right-aligned) | Avg Response (14px mono, right-aligned).
  - Rows: 36px height, alternating subtle backgrounds. Sorted by requests (descending by default). Sortable columns — click header to change sort.
  - Row hover: subtle highlight. Click navigates to route-specific analytics.

**Key design decisions for Analytics:**
- Charts use dark backgrounds, subtle grid lines, thin plot lines — they look like developer monitoring tools, not business dashboards
- All numbers use tabular figures for perfect vertical alignment
- Tooltip values are monospace for technical precision
- Time range selector is prominent — users switch time ranges frequently
- No 3D charts, no gradients in data visualization, no decorative chart elements, no animated chart entrances beyond initial render
- Filters are exposed (not hidden behind menus) — the audience wants to slice data quickly
- Export and sharing actions are available but not prominent (top-right, "Export CSV" and "Share report" links)

**Contrast with typical SaaS analytics:**
- No colorful banner metrics, no "Congratulations!" cards, no gamification
- No "personalized insights" or AI-generated suggestions — raw data, clearly presented
- Data density is higher than typical — the audience is technical and wants precision
- The typography and monospace usage signal "this is for engineers" more than any label could
