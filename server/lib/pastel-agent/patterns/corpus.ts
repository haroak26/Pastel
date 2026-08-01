/**
 * Curated design-pattern corpus — the library behind Stage 11 (design
 * pattern retrieval). script/seed-design-patterns.ts embeds this corpus into
 * the design_patterns table (pgvector); the retrieval stage falls back to a
 * subset of it when the vector store is unavailable.
 */

export interface CorpusPattern {
  category: string;
  name: string;
  summary: string;
  structure: {
    layout: string;
    sections: string[];
    components: string[];
    spacing?: string;
  };
  bestFor: string[];
}

export const PATTERN_CORPUS: CorpusPattern[] = [
  // ── App shell & navigation ──────────────────────────────────────────────
  {
    category: "navigation",
    name: "Sidebar App Shell",
    summary: "Fixed left sidebar with grouped nav, logo at top, user block at bottom; content column scrolls independently.",
    structure: { layout: "240px fixed sidebar + fluid content column", sections: ["Sidebar", "Content header", "Scrollable content"], components: ["AppShell", "Navbar"], spacing: "Content padded with the section gap rhythm" },
    bestFor: ["dashboard", "crm", "settings", "billing", "analytics", "saas"],
  },
  {
    category: "navigation",
    name: "Topbar Marketing Shell",
    summary: "Sticky top navigation with wordmark left, links center, primary CTA right; full-width stacked sections below.",
    structure: { layout: "56-64px sticky topbar + full-width sections", sections: ["Topbar", "Content sections", "Footer"], components: ["Navbar", "Footer"] },
    bestFor: ["landing", "marketing", "pricing", "about", "docs"],
  },
  {
    category: "navigation",
    name: "Tab Bar Section Nav",
    summary: "Horizontal tab strip anchoring peer views of the same object; content swaps under a persistent header.",
    structure: { layout: "header + tab strip + single content pane", sections: ["Header", "Tabs", "Active pane"], components: ["Tabs", "Badge"] },
    bestFor: ["settings", "profile", "detail", "admin"],
  },
  {
    category: "navigation",
    name: "Command Palette",
    summary: "cmd+k centered overlay with fuzzy search across actions and destinations; grouped results with keyboard navigation.",
    structure: { layout: "centered overlay panel (max-width ~560px)", sections: ["Search input", "Grouped results", "Footer hints"], components: ["Dialog", "Input", "Badge"] },
    bestFor: ["saas", "dashboard", "crm", "docs", "admin"],
  },

  // ── Dashboards & analytics ───────────────────────────────────────────────
  {
    category: "dashboard",
    name: "Stat Row + Main Chart",
    summary: "A row of 3-4 KPI stat cards on top, one full-width primary chart beneath, secondary list/grid below.",
    structure: { layout: "stat row → full-width chart → two-column detail", sections: ["KPI row", "Primary chart", "Detail split"], components: ["StatCard", "Chart", "DataTable"] },
    bestFor: ["dashboard", "analytics", "saas", "finance"],
  },
  {
    category: "dashboard",
    name: "Stat Block",
    summary: "2-4 oversized metric blocks with a small label, the value in display type, and a delta marker.",
    structure: { layout: "even column split within one band", sections: ["Stat 1..n"], components: ["StatCard", "Badge"] },
    bestFor: ["dashboard", "analytics", "landing"],
  },
  {
    category: "dashboard",
    name: "Bento Grid",
    summary: "Asymmetric card grid (one large tile + smaller satellites) mixing stats, charts and quick actions.",
    structure: { layout: "12-col grid, tiles spanning 4-8 columns", sections: ["Hero tile", "Satellite tiles"], components: ["Card", "StatCard", "Chart"] },
    bestFor: ["dashboard", "landing", "features", "overview"],
  },
  {
    category: "analytics",
    name: "Filter Bar + Data Grid",
    summary: "A compact filter/toolbar strip (search, date range, saved views) above a dense sortable data grid.",
    structure: { layout: "sticky toolbar + full-width grid", sections: ["Filters", "Grid", "Pagination"], components: ["Input", "Dropdown", "DataTable", "Badge"] },
    bestFor: ["analytics", "crm", "admin", "reports"],
  },
  {
    category: "analytics",
    name: "Report Summary Header",
    summary: "A report title row with date range picker and export action, followed by segmented tabs for metric groups.",
    structure: { layout: "title row + tabs + stacked metric sections", sections: ["Header", "Metric tabs", "Chart panes"], components: ["Tabs", "Dropdown", "Button", "Chart"] },
    bestFor: ["analytics", "reports", "finance"],
  },

  // ── Lists, detail & CRM ─────────────────────────────────────────────────
  {
    category: "crm",
    name: "Master-Detail List",
    summary: "Searchable list column (left ~360px) with selected-item detail pane on the right; selection state is always visible.",
    structure: { layout: "fixed list column + fluid detail pane", sections: ["List toolbar", "List", "Detail pane"], components: ["ListItem", "Input", "Avatar", "Badge"] },
    bestFor: ["crm", "inbox", "contacts", "tickets", "messages"],
  },
  {
    category: "crm",
    name: "Kanban Board",
    summary: "Horizontal status columns of stacked cards with drag affordance, counts on each column, and compact card metadata.",
    structure: { layout: "horizontal column scroller, fixed-width columns (~300px)", sections: ["Column headers", "Card columns"], components: ["Card", "Badge", "Avatar"] },
    bestFor: ["kanban", "crm", "projects", "pipeline", "tasks"],
  },
  {
    category: "crm",
    name: "Activity Timeline",
    summary: "Centered vertical timeline: timestamped events with avatars, dividers per day, key events emphasised.",
    structure: { layout: "narrow centered column (max ~640px)", sections: ["Day groups", "Event rows"], components: ["Avatar", "Badge", "Divider"] },
    bestFor: ["crm", "detail", "history", "audit"],
  },
  {
    category: "detail",
    name: "Record Header + Field Groups",
    summary: "Detail page with identity header (avatar, name, status, primary action) followed by grouped, labelled field sections.",
    structure: { layout: "full-width header band + two-column field groups", sections: ["Identity header", "Field groups", "Related records"], components: ["Avatar", "Badge", "Button", "Card"] },
    bestFor: ["crm", "profile", "detail", "admin"],
  },

  // ── Tables & data ───────────────────────────────────────────────────────
  {
    category: "data",
    name: "Dense Data Table",
    summary: "Full-width table with sticky header, hairline row dividers, right-aligned numerics, status badges, row hover.",
    structure: { layout: "full-width table within the content column", sections: ["Header row", "Body rows", "Footer/pagination"], components: ["DataTable", "Badge", "Button"] },
    bestFor: ["dashboard", "analytics", "billing", "crm", "admin"],
  },
  {
    category: "data",
    name: "Faceted Card Grid",
    summary: "Filter rail (left) + responsive card grid (right); each card carries a thumbnail/title/metadata and one action.",
    structure: { layout: "200-240px filter rail + 2-4 col card grid", sections: ["Filter rail", "Card grid"], components: ["Card", "Checkbox", "Input", "Badge"] },
    bestFor: ["storefront", "catalog", "file-manager", "assets"],
  },
  {
    category: "data",
    name: "Empty State with Primary Action",
    summary: "Centered illustration-free empty state: short headline, one-sentence explanation, single accent action.",
    structure: { layout: "centered block within the content area", sections: ["Headline", "Explanation", "Action"], components: ["Button"] },
    bestFor: ["dashboard", "crm", "file-manager", "inbox", "analytics"],
  },

  // ── Settings, forms & billing ───────────────────────────────────────────
  {
    category: "settings",
    name: "Settings Nav + Form Sections",
    summary: "Left section nav (General/Account/Billing…) with stacked form cards on the right; save bars per card.",
    structure: { layout: "180-220px section nav + narrow form column (max ~640px)", sections: ["Section nav", "Form cards"], components: ["Tabs", "Card", "Input", "Button"] },
    bestFor: ["settings", "profile", "admin", "workspace"],
  },
  {
    category: "settings",
    name: "Danger Zone Card",
    summary: "A distinctly bordered card at the bottom of settings listing destructive actions with explicit confirmations.",
    structure: { layout: "full-width card at page end", sections: ["Warning header", "Destructive actions"], components: ["Card", "Button", "Dialog"] },
    bestFor: ["settings", "admin"],
  },
  {
    category: "billing",
    name: "Plan Cards + Comparison",
    summary: "Current-plan card with usage meters, sibling plan cards with prices, and a feature comparison table below.",
    structure: { layout: "summary card → plan cards row → comparison table", sections: ["Current plan", "Plan options", "Comparison"], components: ["Card", "Badge", "DataTable", "Button"] },
    bestFor: ["billing", "settings", "pricing"],
  },
  {
    category: "billing",
    name: "Invoice Table + Payment Method",
    summary: "Two-part billing detail: payment method card on the left, invoice history table on the right.",
    structure: { layout: "4/8 split", sections: ["Payment method", "Invoice history"], components: ["Card", "DataTable", "Badge"] },
    bestFor: ["billing", "settings"],
  },
  {
    category: "forms",
    name: "Single-Column Form",
    summary: "One-column centred form with clear labels, helper text, inline validation states and a sticky action bar.",
    structure: { layout: "centered column (max ~480px)", sections: ["Fields", "Action bar"], components: ["Input", "Select", "Button", "Toast"] },
    bestFor: ["auth", "onboarding", "settings", "contact"],
  },
  {
    category: "forms",
    name: "Multi-Step Wizard",
    summary: "Progressive form with a step indicator on top, one focused question per step, back/next footer bar.",
    structure: { layout: "centered column (max ~560px), steps stacked vertically", sections: ["Step indicator", "Step body", "Footer actions"], components: ["Steps", "Input", "Button"] },
    bestFor: ["onboarding", "auth", "setup", "checkout"],
  },

  // ── Auth ────────────────────────────────────────────────────────────────
  {
    category: "auth",
    name: "Centered Auth Card",
    summary: "Deep brand backdrop with a centered card: wordmark, single headline, email/social actions stacked, quiet footer links.",
    structure: { layout: "full-viewport centered card (~400px)", sections: ["Wordmark", "Form", "Footer links"], components: ["Card", "Input", "Button"] },
    bestFor: ["auth", "login", "signup"],
  },
  {
    category: "auth",
    name: "Split Auth Layout",
    summary: "50/50 split: product panel (brand, one proof point, testimonial) beside the auth form column.",
    structure: { layout: "two equal columns, product panel hidden on mobile", sections: ["Brand panel", "Form column"], components: ["Input", "Button", "Card"] },
    bestFor: ["auth", "login", "signup", "onboarding"],
  },

  // ── AI chat ─────────────────────────────────────────────────────────────
  {
    category: "ai-chat",
    name: "Chat Thread + Composer",
    summary: "Centered message thread (~720px) with role-lettered bubbles, streaming affordance, and a sticky rounded composer with attachment + send.",
    structure: { layout: "centered thread + sticky bottom composer", sections: ["Thread", "Composer"], components: ["Avatar", "Card", "Input", "Button"] },
    bestFor: ["ai-chat", "assistant", "support"],
  },
  {
    category: "ai-chat",
    name: "Conversation Sidebar + Thread",
    summary: "History sidebar listing past conversations (recents grouped by day) with the active thread + composer on the right.",
    structure: { layout: "260px history sidebar + fluid thread column", sections: ["History", "Thread", "Composer"], components: ["ListItem", "Avatar", "Input"] },
    bestFor: ["ai-chat", "assistant"],
  },
  {
    category: "ai-chat",
    name: "Suggestion Grid",
    summary: "Empty-thread greeting with 2x2 grid of suggested prompts as selectable cards.",
    structure: { layout: "centered greeting + two-column prompt grid", sections: ["Greeting", "Prompt cards"], components: ["Card"] },
    bestFor: ["ai-chat", "assistant", "onboarding"],
  },

  // ── Docs & content ──────────────────────────────────────────────────────
  {
    category: "docs",
    name: "Docs Three-Column",
    summary: "Left doc tree, center reading column (~680px), right on-this-page anchor list; prev/next footer links.",
    structure: { layout: "240px tree + reading column + 200px anchors", sections: ["Doc tree", "Article", "Anchors"], components: ["Navbar", "ListItem", "Divider"] },
    bestFor: ["docs", "help-center", "guides"],
  },
  {
    category: "docs",
    name: "Article Hero + Body",
    summary: "Title block with eyebrow/meta over a narrow, generously spaced reading column.",
    structure: { layout: "centered single column (~680px)", sections: ["Title block", "Body"], components: ["Divider", "Badge"] },
    bestFor: ["docs", "blog", "changelog", "editorial"],
  },

  // ── File management ─────────────────────────────────────────────────────
  {
    category: "file-manager",
    name: "Folder Tree + File Table",
    summary: "Left folder tree + breadcrumb/file table with sortable columns and inline rename; upload dropzone on empty.",
    structure: { layout: "220px tree + fluid table", sections: ["Breadcrumb bar", "File table"], components: ["DataTable", "Input", "Button", "Dialog"] },
    bestFor: ["file-manager", "assets", "admin"],
  },
  {
    category: "file-manager",
    name: "Preview Drawer",
    summary: "Right-anchored drawer showing the selected file's preview, metadata list, and actions.",
    structure: { layout: "overlay drawer (~400px) from right edge", sections: ["Preview", "Metadata", "Actions"], components: ["Dialog", "Button", "Badge"] },
    bestFor: ["file-manager", "assets", "detail"],
  },

  // ── Marketing / landing ─────────────────────────────────────────────────
  {
    category: "landing",
    name: "Split Hero",
    summary: "Two-column hero: headline + subcopy + CTA on the left, product visual/graphic on the right, balanced at the grid gutter.",
    structure: { layout: "6/6 or 7/5 grid split", sections: ["Copy column", "Visual column"], components: ["Button", "Card"] },
    bestFor: ["landing", "marketing", "pricing"],
  },
  {
    category: "landing",
    name: "Full-Bleed Statement",
    summary: "Centered oversized statement with an overline, no imagery; whitespace does the work.",
    structure: { layout: "centered band", sections: ["Overline", "Statement", "CTA"], components: ["Button"] },
    bestFor: ["landing", "marketing", " editorial", "manifesto"],
  },
  {
    category: "landing",
    name: "Alternating Rows",
    summary: "Feature rows alternating media left/right with tight copy blocks and one inline link each.",
    structure: { layout: "repeating 6/6 rows with alternating order", sections: ["Row A", "Row B", "Row C"], components: ["Card", "Button"] },
    bestFor: ["landing", "features", "marketing"],
  },
  {
    category: "landing",
    name: "Divider Row",
    summary: "A hairline-divided horizontal strip of 3-5 short features or logos — quiet proof without cards.",
    structure: { layout: "single row split by vertical hairlines", sections: ["Items"], components: ["Divider"] },
    bestFor: ["landing", "marketing", "social-proof"],
  },
  {
    category: "landing",
    name: "Pull Quote",
    summary: "Oversized serif quotation with attribution — a single strong voice breaking the page rhythm.",
    structure: { layout: "centered column (~760px)", sections: ["Quote", "Attribution"], components: [] },
    bestFor: ["landing", "testimonial", "editorial"],
  },
  {
    category: "landing",
    name: "Statement + Button",
    summary: "Terminal CTA band: one confident line, one action, generous vertical padding.",
    structure: { layout: "centered band", sections: ["Statement", "Action"], components: ["Button"] },
    bestFor: ["landing", "marketing", "cta"],
  },
  {
    category: "landing",
    name: "Pricing Tier Cards",
    summary: "3-4 aligned pricing cards, middle tier visually emphasised, feature lists hairline-separated, annual toggle above.",
    structure: { layout: "even column row", sections: ["Billing toggle", "Tier cards", "Footnote"], components: ["Card", "Button", "Badge", "Toggle"] },
    bestFor: ["pricing", "landing", "billing"],
  },
  {
    category: "landing",
    name: "Logo Cloud",
    summary: "Muted single-row strip of customer marks, low contrast, centered.",
    structure: { layout: "one centered row", sections: ["Logos"], components: [] },
    bestFor: ["landing", "social-proof"],
  },
  {
    category: "marketing",
    name: "Footer Sitemap",
    summary: "Wordmark + 3-5 link columns with hairline top border and legal row at the bottom.",
    structure: { layout: "grid of link columns over a legal row", sections: ["Link columns", "Legal"], components: ["Footer"] },
    bestFor: ["landing", "marketing", "docs"],
  },
  {
    category: "marketing",
    name: "FAQ Accordion",
    summary: "Two-thirds width accordion of questions with short, specific answers; chevron rotation on open.",
    structure: { layout: "narrow centered column", sections: ["Accordion items"], components: ["Accordion"] },
    bestFor: ["pricing", "landing", "help-center"],
  },

  // ── Overlays & feedback ─────────────────────────────────────────────────
  {
    category: "overlay",
    name: "Confirmation Dialog",
    summary: "Centered modal with a single-sentence consequence statement and paired cancel/confirm actions.",
    structure: { layout: "centered overlay (~440px)", sections: ["Statement", "Actions"], components: ["Dialog", "Button"] },
    bestFor: ["settings", "admin", "billing", "crm"],
  },
  {
    category: "overlay",
    name: "Toast Stack",
    summary: "Bottom-right transient toast stack with status icon, one-line message, optional undo.",
    structure: { layout: "fixed bottom-right stack", sections: ["Toasts"], components: ["Toast", "Badge"] },
    bestFor: ["settings", "forms", "billing", "file-manager"],
  },
  {
    category: "overlay",
    name: "Tooltip Hint",
    summary: "Small dark tooltip on hover/focus for icon-only controls; 150ms ease, 4px offset.",
    structure: { layout: "anchored overlay", sections: ["Tooltip"], components: ["Tooltip"] },
    bestFor: ["dashboard", "analytics", "crm", "editor"],
  },
  {
    category: "feedback",
    name: "Inline Banner",
    summary: "Full-width status banner above content for warnings/downtime/plan limits, dismissible unless critical.",
    structure: { layout: "full-width strip", sections: ["Message", "Action"], components: ["Badge", "Button"] },
    bestFor: ["dashboard", "settings", "billing"],
  },
  {
    category: "feedback",
    name: "Skeleton Loading Rows",
    summary: "Skeleton placeholders mirroring final layout geometry; shimmer is subtle or absent.",
    structure: { layout: "matches the loaded layout", sections: ["Skeleton blocks"], components: [] },
    bestFor: ["dashboard", "crm", "analytics", "inbox", "ai-chat"],
  },
];

/** The static fallback subset when pgvector/seed is unavailable. */
export const STATIC_FALLBACK_PATTERNS: string[] = [
  "Split Hero",
  "Full-Bleed Statement",
  "Alternating Rows",
  "Bento Grid",
  "Divider Row",
  "Stat Block",
  "Pull Quote",
  "Statement + Button",
  "Stat Row + Main Chart",
  "Master-Detail List",
  "Dense Data Table",
  "Settings Nav + Form Sections",
];
