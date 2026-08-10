# Picasso Product Mode: Documentation

## Mode Definition

**Documentation** — Reference docs, API documentation, guides, tutorials, and knowledge bases. Users arrive with a specific question, search for an answer, and read to learn. The interface must prioritize readability, searchability, and navigation above all else. Unlike dashboards or landing pages, documentation is utilitarian — every design decision serves the reader's ability to find and understand information.

---

## Core Layout Architecture

### Three-Panel Layout

The documentation layout consists of up to three panels. The left sidebar and content area are mandatory; the right sidebar is optional.

```
+----------+ +-----------------------------------+ +----------+
|          | |                                   | |          |
| Sidebar  | |        Content Area               | |  TOC     |
| Fixed    | |        (centered,                  | |  Sticky  |
| Left     | |         max-w-prose ~700px,        | |  Right   |
| 240-280px| |         or wider for API tables)   | |  180-220 |
| Scroll.  | |                                   | |  px      |
|          | |                                   | |          |
|          | |                                   | |          |
+----------+ +-----------------------------------+ +----------+
```

| Region | Width | Scroll | Content |
|---|---|---|---|
| Left sidebar | 240-280px | Scrollable independently, sticky top (100vh minus topbar) | Navigation tree: search, section groups, page links |
| Content area | Centered, max-width 700-750px (prose) or 900-1000px (API reference) | Scrollable (main page scroll) | Article content: text, code blocks, tables, callouts |
| Right sidebar (TOC) | 180-220px | Sticky top (100vh minus topbar) | Table of contents for current page: h2 and h3 links. Only for pages with 5+ headings |

**When to include the right sidebar:**
- Pages with 5+ h2 headings (long-form guides, comprehensive API docs)
- Pages where users need to jump between sections frequently
- Pages over 2000 words

**When to omit the right sidebar:**
- Short pages (less than 5 h2 headings)
- Pages where the TOC would be sparse (wasted space)
- Mobile/responsive views (TOC collapses or moves to top of content)

### Responsive Behavior

| Breakpoint | Layout |
|---|---|
| >= 1024px | Full 3-panel layout (sidebar + content + TOC) |
| 768-1023px | Sidebar (collapsible to hamburger) + content. TOC hidden or at top of content |
| < 768px | Hamburger menu for sidebar + full-width content. TOC at top of page as expandable |

---

## Left Sidebar Navigation

### Sidebar Anatomy

```
+---------------------+
|  Search docs...     |  <- Search bar, full-width, prominent
+---------------------+
|                     |
| GETTING STARTED     |  <- Section label: 11-12px, uppercase,
| > Introduction      |     neutral-400, letter-spacing 0.5px
| > Installation      |
| > Quick Start       |
|                     |
| CORE CONCEPTS       |
| > Architecture      |
| > Data Model        |
| > Authentication    |
|                     |
| API REFERENCE       |  <- Collapsible sections
| v REST API          |
|   > Overview        |  <- Nested items (16px indent per level)
|   > Authentication  |
|     > API Keys      |  <- 3 levels deep max
|     > OAuth 2.0     |
|   > Endpoints       |
|     > Users         |
|     > Projects      |
|     > Billing       |
| > GraphQL API       |
|                     |
| GUIDES              |
| > Migrating from v1 |
| > Best Practices    |
| > Troubleshooting   |
|                     |
| SDKS & TOOLS        |
| > JavaScript        |
| > Python            |
| > CLI               |
|                     |
+---------------------+
```

### Search Bar

Located at the very top of the sidebar, always visible.

| Property | Specification |
|---|---|
| Position | Top of sidebar, sticky |
| Width | Full sidebar width minus padding (8-12px each side) |
| Height | 36-44px |
| Background | neutral-100 (light) or neutral-800 (dark) |
| Border radius | 6-8px |
| Icon | Search/magnifying glass icon, 16-18px, neutral-400, left-aligned inside input with 8-10px padding |
| Placeholder | Search docs... or Type / to search |
| Keyboard shortcut | CMD+K or / (slash key) opens search modal globally |
| Behavior on focus | Input expands to full-width search modal with recent searches and suggestions |

### Section Groups

Navigation items are organized into collapsible labeled groups.

| Element | Specification |
|---|---|
| Section label | 11-12px, uppercase, weight 600, neutral-400, letter-spacing +0.5px. Padding: 4px 16px, 16px top margin |
| Collapse toggle | Chevron icon (right of section label) rotates 90deg on expand/collapse. Or click section label to toggle |
| Collapse state | Persist across page views (localStorage). Default: all expanded |
| Gap between sections | 8-12px after last item of previous section, 4px before next section label |

### Navigation Items

| Property | Default | Active | Hover |
|---|---|---|---|
| Height | 32-36px (denser than dashboard nav) | 32-36px | 32-36px |
| Background | Transparent | accent-50 (light) or accent-900 (dark) | neutral-100 |
| Left border | None | 2-3px solid accent-500 | None |
| Text size | 13-14px | 13-14px (weight 500) | 13-14px |
| Text color | neutral-700 | accent-600 or neutral-900 | neutral-900 |
| Border radius | 4-6px | 4-6px | 4-6px |
| Horizontal padding | 8-16px (8px margin from sidebar edge) | Same | Same |

### Nesting Levels

Documentation sidebars commonly have nested navigation (up to 3 levels deep).

| Level | Indent | Font Size | Example |
|---|---|---|---|
| Level 1 (section pages) | 0px (aligned with section label) | 13-14px, weight 500 | Getting Started > Introduction |
| Level 2 (sub-pages) | 16px indent | 13-14px | API Reference > REST API > Endpoints |
| Level 3 (deep pages) | 32px indent | 13px, weight 400 | REST API > Endpoints > Users > List Users |

**Nesting rules:**
- Max 3 levels deep. If you need 4+ levels, restructure the information architecture
- Nesting is indicated ONLY by left padding (indentation). No tree lines, no folder icons
- Collapsed parent shows a chevron that rotates when expanded. Child items are hidden when collapsed
- Active child item also highlights its parent (parent gets accent-50 background if expanded)

### Scroll Sync

The sidebar should scroll to keep the active page visible.

| Behavior | Specification |
|---|---|
| On page load | Sidebar auto-scrolls so the active page is vertically centered in the sidebar viewport |
| Scroll behavior | Smooth scroll (behavior: smooth), 300ms |
| Parent expansion | If the active page is inside a collapsed section, auto-expand that section |

---

## Content Area Typography

Documentation typography prioritizes readability above visual flair.

### Body Text

| Property | Specification |
|---|---|
| Font | High-readability sans-serif: Inter, SF Pro Text, Segoe UI, system fonts |
| Size | 16-18px (16px minimum for readability) |
| Weight | 400 (regular) |
| Color | neutral-800 (light mode) or neutral-200 (dark mode) |
| Line height | 1.6-1.75 (generous for long-form reading) |
| Max width | 65-70 characters per line (max-width: 65ch or ~700px) |
| Paragraph spacing | 16-24px margin-bottom between paragraphs |

### Headings

| Level | Font Size | Weight | Color | Margin Top | Margin Bottom |
|---|---|---|---|---|---|
| h1 (page title) | 32-40px | 700-800 | neutral-900 | 0px | 16-24px |
| h2 (section) | 24-28px | 600-700 | neutral-900 | 40-48px | 12-16px |
| h3 (subsection) | 18-22px | 600 | neutral-800 | 32-40px | 8-12px |
| h4 (sub-subsection) | 16-18px | 600 | neutral-800 | 24-32px | 8px |

**Heading rules:**
- h2 gets a subtle bottom border (1px solid neutral-200) if the section is long, to visually anchor the heading
- No decorative or display fonts. Documentation is for reading, not branding
- Heading anchors: on hover, a # or link icon appears next to the heading. Click to copy the heading URL to clipboard
- h1 appears once per page. It is the page title. No multiple h1s

### Inline Code

```
This is a sentence with inline code like `config.yaml` in it.
```

| Property | Specification |
|---|---|
| Background | neutral-100 (light) or neutral-800 (dark) |
| Text color | accent-600 or red-500 (for string values/URLs) |
| Font | Monospace: JetBrains Mono, Fira Code, SF Mono, 0.9em size |
| Padding | 2px 6px horizontal |
| Border radius | 4px |
| Border | 1px solid neutral-200 (optional) |
| Word break | Do NOT break inline code across lines (white-space: nowrap for short snippets, break-word for long ones) |

### Links

| State | Style |
|---|---|
| Default | accent-500, underline (text-decoration: underline) |
| Hover | accent-600, underline |
| Visited | No special styling (visited state is not necessary in docs) |
| External link | Small arrow icon after link text (box-arrow-up-right, 10-12px) |
| Heading anchor link | Neutral-300 default, accent-500 on hover. # or link icon. Appears on heading hover |

---

## Content Patterns

### Text Content

#### Paragraphs

- Maximum width: 65 characters (~700px at 16px font). This is the optimal line length for reading comprehension
- Left-aligned. Never centered or justified text
- One idea per paragraph. Short paragraphs (2-4 sentences) are easier to scan
- First paragraph after a heading should be the most important

#### Bullet Lists

```
- First item in the list
- Second item that spans multiple lines should
  wrap and align with the text above
- Third item
```

| Property | Specification |
|---|---|
| Bullet style | Disc (filled circle) or dash (en-dash). Use disc for most lists |
| Bullet color | neutral-400 or accent-500 |
| Bullet size | 6-8px disc, same as font size for dash |
| Item spacing | 4-8px margin between list items |
| Indent | 20-24px from left margin |
| Nested lists | 20px additional indent per level. Different bullet style per level (disc -> circle -> square) |
| Paragraphs in lists | If a list item has multiple paragraphs, indent the paragraph to align with the item text |

#### Numbered Lists

Same spacing as bullet lists. Used for step-by-step instructions and ordered content.

| Property | Specification |
|---|---|
| Number style | 1. 2. 3. (followed by period) |
| Number color | neutral-700 (same as text) |
| Number alignment | Right-aligned within a fixed-width number column |

#### Blockquotes

```
> This is a blockquote. It is used for quoting external sources
> or highlighting important excerpts.
```

| Property | Specification |
|---|---|
| Left border | 3-4px solid neutral-300 or accent-300 |
| Background | neutral-50 (optional, for emphasis) |
| Text color | neutral-600, italic (optional) |
| Padding | 12-20px vertical, 16-20px horizontal |

### Callouts / Admonitions

Callouts are colored boxes that call attention to important information.

```
+------------------------------------------------------+
| !  INFO                                              |
|                                                      |
|  This feature requires API version 2.0 or later.     |
|  See the migration guide for upgrade instructions.   |
+------------------------------------------------------+

+------------------------------------------------------+
| !!  WARNING                                          |
|                                                      |
|  This action is irreversible. Deleted data cannot    |
|  be recovered. Make sure you have a backup.           |
+------------------------------------------------------+

+------------------------------------------------------+
| ?  TIP                                               |
|                                                      |
|  You can use the --dry-run flag to preview changes   |
|  before applying them.                                |
+------------------------------------------------------+
```

| Type | Icon | Border Color | Background | Text Color | Usage |
|---|---|---|---|---|---|
| Info | ! (circle-info) | accent-400 (4px left border) | accent-50 | neutral-800 | General information, notes, context |
| Warning | !! (triangle-exclamation) | yellow-500 or orange-500 | yellow-50 | neutral-800 | Actions with consequences, deprecation notices, breaking changes |
| Tip | ? (lightbulb or question) | green-500 | green-50 | neutral-800 | Best practices, shortcuts, pro tips |
| Danger | X (circle-x) | red-500 | red-50 | neutral-800 | Destructive actions, security warnings, critical issues |
| Success | check (circle-check) | green-500 | green-50 | neutral-800 | Confirmation messages, success states |

**Callout styling:**
- Left border: 4px wide, the primary visual indicator
- Background: subtle tinted background (50 shade)
- Icon: 16-18px, matching the border color, top-left
- Title: 14-15px, weight 600, matching border color. INFO / WARNING / TIP
- Body: 14-15px, neutral-700. Can contain multiple paragraphs, lists, and inline code
- Padding: 14-18px. Rounded corners: 6-8px
- Margin: 20-24px vertical (above and below callout)

### Code Blocks

```
+------------------------------------------------------+
| filename.py                                   [Copy]  |  <- Optional header
+------------------------------------------------------+
|                                                      |
|  import requests                                     |
|                                                      |
|  response = requests.get(                             |
|      https://api.example.com/v1/users,               |
|      headers={Authorization: Bearer <token>}         |
|  )                                                   |
|                                                      |
|  print(response.json())                              |
|                                                      |
+------------------------------------------------------+
|  1  import requests                                  |
|  2                                                   |
|  3  response = requests.get(                         |  <- Optional line numbers
|  4      https://api.example.com/v1/users,            |
|  5      headers={Authorization: Bearer <token>}     |
|  6  )                                                |
+------------------------------------------------------+
```

| Property | Specification |
|---|---|
| Background | neutral-900, #1a1a2e, #0d1117, or #1e1e1e (dark backgrounds only) |
| Text color | neutral-100 or #e1e4e8 |
| Border radius | 8-10px |
| Padding | 16-24px |
| Margin | 20-28px vertical (between code blocks and surrounding text) |
| Font | Monospace: JetBrains Mono, Fira Code, SF Mono, Cascadia Code. 14px |
| Line height | 1.5-1.6 |
| Horizontal scroll | For long lines, scroll horizontally (overflow-x: auto). No line wrapping |
| Max height | Optional: 400-500px max-height with overflow-y: auto for very long code blocks |

**File name header (optional):**
| Property | Specification |
|---|---|
| Background | neutral-800 (slightly lighter than code bg) |
| Text | File name in 12-13px, neutral-300, monospace font |
| Copy button | Right-aligned. 28-32px, copy icon. Tooltip: Copy to clipboard. Changes to checkmark on click for 2s |

**Line numbers (optional):**
| Property | Specification |
|---|---|
| Column | Left side, 40-48px wide. Separated from code by 1px border (neutral-700) |
| Numbers | 12px, neutral-500, right-aligned, monospace |
| Highlight line | Background accent-900 or neutral-700 on the highlighted line. Used to draw attention to specific lines |

**Syntax highlighting:**
- Use a well-known theme: GitHub Dark, One Dark Pro, Dracula, Monokai, or Nord
- Support all common languages: JavaScript, Python, Ruby, Go, Rust, Java, C#, PHP, SQL, Bash, YAML, JSON, HTML, CSS
- Keywords: accent color (blue or purple)
- Strings: green
- Numbers: orange
- Comments: neutral-500, italic
- Functions: accent color
- Types: accent color or yellow

### API Reference Tables

```
+------------------------------------------------------+
|                                                      |
|  Parameters                                          |
|                                                      |
|  +----------+--------+----------+-------------------+|
|  | Name     | Type   | Required | Description       ||
|  +----------+--------+----------+-------------------+|
|  | `id`     | string | REQUIRED | The unique        ||
|  |          |        |          | identifier for    ||
|  |          |        |          | the resource.     ||
|  +----------+--------+----------+-------------------+|
|  | `name`   | string | optional | A human-readable  ||
|  |          |        |          | name for display. ||
|  +----------+--------+----------+-------------------+|
|  | `email`  | string | optional | The email address ||
|  |          |        |          | of the user.      ||
|  +----------+--------+----------+-------------------+|
|  | `role`   | enum   | REQUIRED | The user role.    ||
|  |          |        |          | One of: `admin`, ||
|  |          |        |          | `member`,        ||
|  |          |        |          | `viewer`.        ||
|  +----------+--------+----------+-------------------+|
|                                                      |
+------------------------------------------------------+
```

| Column | Specification |
|---|---|
| Name | Monospace font (14px), accent-600 color. The parameter/field name |
| Type | Monospace font (13-14px), accent-500 or neutral-500. string, number, boolean, object, array, enum, etc. |
| Required | Badge/pill. REQUIRED: red-500 background, white text, 10-11px. optional: neutral-300 background, neutral-600 text |
| Description | Body font (14-15px), neutral-700. Full description including default values, constraints, and examples |

**Table styling:**
| Property | Specification |
|---|---|
| Header row | neutral-100 background, 12-13px, weight 600, neutral-600, uppercase |
| Row height | Variable (auto height based on content), min 44-48px |
| Row border | Bottom 1px solid neutral-100 |
| Row hover | neutral-50 background (optional) |
| Cell padding | 10-14px horizontal, 8-12px vertical |
| Border radius | 8px (table container) |
| Full width | Table should fill the content area width (700px+) |

### Step-by-Step Guides

```
## Step 1: Install the CLI

First, install the command-line interface using npm:

```bash
npm install -g @product/cli
```

Verify the installation:

```bash
product --version
# Output: v2.4.1
```

## Step 2: Initialize your project

Navigate to your project directory and run:

```bash
cd my-project
product init
```

This creates a `product.config.json` file in your project root.

## Step 3: Deploy

```bash
product deploy
```

Your project is now live at `https://my-project.product.sh`

---

## Before You Begin

- Node.js 18 or later
- A Product account (sign up at https://product.sh)
- A project to deploy
```

| Element | Specification |
|---|---|
| Step headings | h2 with Step N: prefix. 24-28px. Numbered sequentially |
| Step content | Paragraphs, code blocks, images. Any combination |
| Code examples | Every step should have at least one code example or screenshot |
| Expected output | Show expected terminal output in a separate code block (or after the command) |
| Prerequisites | Before You Begin section at top of guide. Bullet list of requirements |
| Estimated time | Optional: Time to complete at top (5 minutes, 15 minutes) |
| Screenshots | Optional: Screenshot after key steps. Caption below image in 13px, neutral-400 |

### Interactive Examples (Optional)

```
+------------------------------------------------------+
|  Try It                                              |
|                                                      |
|  +----------------------------------------------+    |
|  | GET /v1/users                               |    |
|  | https://api.example.com/v1/users             |    |
|  +----------------------------------------------+    |
|                                                      |
|  Headers                          [Send Request]     |
|  +----------------------------------------------+    |
|  | Authorization: Bearer sk_test_4eC39HqLyj... |    |
|  +----------------------------------------------+    |
|                                                      |
|  Response                                           |
|  +----------------------------------------------+    |
|  | {                                            |    |
|  |   data: [...],                               |    |
|  |   has_more: true,                            |    |
|  |   total: 42                                  |    |
|  | }                                            |    |
|  +----------------------------------------------+    |
+------------------------------------------------------+
```

Interactive API explorers embedded in docs allow users to make live API calls.

| Element | Specification |
|---|---|
| Container | Card with Try It heading, accent-100 background (light) or border |
| Method + URL | GET / POST / PUT / DELETE badge (color-coded) + endpoint URL input |
| Headers/Body | Editable JSON editor for request headers and body |
| Send button | accent-500 filled button. Triggers live request |
| Response | Code block showing the actual API response. Auto-formatted JSON |
| Auth | Uses the user's API key if logged in, or a test key for anonymous users |

---

## Search System

### Search Trigger

| Trigger | Behavior |
|---|---|
| CMD+K (Mac) / Ctrl+K (Win) | Opens search modal. Works globally from any page |
| / (slash key) | Opens search modal. Only when not focused in an input |
| Click search bar | Opens search modal or focuses sidebar search input |

### Search Modal

```
+------------------------------------------------------+
|                                                      |
|  +--------------------------------------------------+|
|  |  Search documentation...           CMD+K   [esc] ||
|  +--------------------------------------------------+|
|                                                      |
|  Recent Searches                                     |
|  > authentication       > rate limiting              |
|  > webhooks             > api keys                   |
|                                                      |
|  ────────────────────────────────────────────────── |
|                                                      |
|  Suggested                                           |
|  > Getting Started                                   |
|  > API Reference                                     |
|  > Authentication                                    |
|  > Webhooks                                          |
|  > Rate Limiting                                     |
|                                                      |
+------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Modal width | 560-640px |
| Modal position | Centered horizontally and vertically (or top: 15% from top) |
| Backdrop | Semi-transparent black (opacity 0.5), blur(2px) optional |
| Input | 48-56px height, 16-18px font, full width of modal. Autofocus on open |
| Keyboard shortcut | CMD+K badge in right side of input (informational, not clickable) |
| Close | Esc key or click backdrop |

### Search Results

```
+------------------------------------------------------+
|                                                      |
|  +--------------------------------------------------+|
|  |  authentication                            [esc] ||
|  +--------------------------------------------------+|
|                                                      |
|  DOCUMENTATION                                       |  <- Group label
|  > Authentication Overview                           |
|    Learn about authentication methods...             |
|                                                      |
|  > API Key Authentication                            |
|    Authenticate requests using API keys...           |
|                                                      |
|  > OAuth 2.0 Flow                                    |
|    Implement OAuth 2.0 for user-based access...      |
|                                                      |
|  API REFERENCE                                       |
|  > POST /v1/auth/token                               |
|    Exchange credentials for an access token          |
|                                                      |
|  > GET /v1/auth/session                              |
|    Retrieve the current session information          |
|                                                      |
|  GUIDES                                              |
|  > Setting Up Authentication                         |
|    Step-by-step guide to configure auth...           |
|                                                      |
|  ────────────────────────────────────────────────── |
|                                                      |
|  Press Enter to open  |  Arrow keys to navigate     |
|                                                      |
+------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Results grouped by type | Documentation, API Reference, Guides, SDKs, Changelog. Each group has a 11-12px uppercase label |
| Result title | 14-15px, weight 500-600, neutral-900. Page title |
| Result description | 12-13px, neutral-400. First sentence of the page or meta description. 1 line, truncated with ellipsis |
| Highlighting | Matching keywords are highlighted: accent-100 background or accent-500 text + weight 600 |
| Result icon | Optional: document icon for docs, code icon for API, book icon for guides |
| Navigation | Arrow keys (up/down) to move between results. Enter to open selected. Esc to close |
| Max results | 10-15 results visible without scrolling. Overflow: scroll with max-height: 400px |
| No results | Show No results for [query] with suggestions: Check spelling, Try different keywords, Browse documentation |

---

## Version Selector

Documentation that supports multiple product versions needs a version selector.

```
+---------------------+
|  [v2.4 (latest)  v] |
+---------------------+
```

| Property | Specification |
|---|---|
| Position | Top of sidebar (below search bar) or in topbar |
| Style | Dropdown/select. 32-36px height, neutral-100 background, rounded-6px |
| Current version | Displayed as selected value: v2.4 (latest) |
| Options | v2.4 (latest), v2.3, v2.2, v2.1, v2.0, v1.x (archived) |
| Separator | Divider between current versions and archived versions |
| Archived label | (archived) or (deprecated) badge next to old versions |
| Warning | If viewing old docs, show a banner: You are viewing documentation for v2.1. View the latest version -> |

---

## Breadcrumbs (Optional)

```
Docs > Getting Started > Installation
```

| Property | Specification |
|---|---|
| Position | Top of content area, above h1 |
| Separator | > (chevron) or / (slash). neutral-400 color |
| Link style | 13-14px, neutral-400 default, neutral-600 hover |
| Current page | 13-14px, neutral-700, not clickable |
| Use case | Deeply nested pages (3+ levels). Not needed for top-level docs pages |

---

## Page Meta Information

### Edit on GitHub Link

```
+------------------------------------------------------+
|                                            [Edit Page] |
+------------------------------------------------------+
```

| Property | Specification |
|---|---|
| Position | Top-right of content area, inline with page title or above it |
| Icon | GitHub icon or pencil/edit icon, 14-16px |
| Text | Edit this page or Edit on GitHub, 13px, neutral-400 |
| Link | Direct link to the Markdown/MDX source file on GitHub |
| Hover | neutral-700 text color |

### Feedback Widget

```
+------------------------------------------------------+
|                                                      |
|  Was this page helpful?                              |
|                                                      |
|  [Yes]  [No]                                         |
|                                                      |
|  (If No selected:)                                   |
|  What was the issue?                                 |
|  +----------------------------------------------+    |
|  |                                              |    |
|  +----------------------------------------------+    |
|  [Submit Feedback]                                   |
|                                                      |
+------------------------------------------------------+
```

| Element | Specification |
|---|---|
| Position | Bottom of content area, after the last section |
| Divider | Top border (1px solid neutral-200) to separate from content |
| Question | 14-15px, weight 500, neutral-600. Was this page helpful? |
| Buttons | Yes (green-500 outline) and No (red-500 outline). 32-36px height |
| Follow-up | If No: textarea appears for additional feedback (smooth height transition) |
| Thank you | After submission: Thanks for your feedback! message replaces the widget |

---

## Dark Mode

Essential for developer documentation. Dark mode must be a first-class experience.

| Element | Light Mode | Dark Mode |
|---|---|---|
| Page background | White (#ffffff) | neutral-900 (#0d1117 or #1a1a2e) |
| Sidebar background | neutral-50 | neutral-900 or #161b22 |
| Content text | neutral-800 | neutral-200 |
| Headings | neutral-900 | neutral-100 |
| Inline code bg | neutral-100 | neutral-800 |
| Code block bg | neutral-900 or #1a1a2e | #0d1117 or #161b22 |
| Table border | neutral-200 | neutral-700 |
| Callout bg (info) | accent-50 | accent-900 (with 0.2 opacity text) |
| Links | accent-500 | accent-400 |
| Search input bg | neutral-100 | neutral-800 |

**Dark mode toggle:**

| Property | Specification |
|---|---|
| Position | Bottom of sidebar or in topbar |
| Style | Sun/Moon icon toggle. 20-24px icon |
| Transition | Smooth color transition (200ms ease) on all elements |
| Persistence | Save preference to localStorage. Default: match system preference (prefers-color-scheme) |

---

## Anti-Patterns for Documentation

### 1. Decorative Elements That Distract from Reading

**WRONG:** Animated illustrations for every section header. Gradient backgrounds on code blocks. Colorful icons scattered throughout the text. Decorative dividers between every paragraph.

**Why it is wrong:** Documentation is for reading, not browsing. Visual decorations compete with content for attention. Every decorative element increases cognitive load.

**CORRECT:** Minimal decoration. Clean typography. Subtle dividers. Icons only when they convey meaning (callout types, file type indicators). No animations in docs (except for interactive examples).

### 2. Marketing CTAs in Documentation

**WRONG:** Banners like Get started for free!, Sign up now!, or Try Pro features! embedded within documentation pages.

**Why it is wrong:** The user is reading docs to solve a problem. Marketing content interrupts their flow and erodes trust in the documentation.

**CORRECT:** Subtle link to the product in the sidebar footer or navigation. Example: Powered by ProductName or a Docs link back to the main site. No in-content CTAs. If an upsell is appropriate, it belongs in a separate section clearly labeled as such, not inline.

### 3. Centered Text in Reading Areas

**WRONG:** Documentation paragraphs that are centered or justified.

**Why it is wrong:** Centered text is harder to read because the eye must find the start of each new line at a different position. Left-aligned text provides a consistent anchor point.

**CORRECT:** All body text is left-aligned. The content container itself may be centered on the page, but the text within it is left-aligned. Headings are also left-aligned.

### 4. Poor Code Formatting

**WRONG:** Code examples without syntax highlighting. Code in the wrong font (not monospace). Code without proper indentation. Code mixed inline with body text without visual distinction.

**Why it is wrong:** Unformatted code is nearly unreadable. Developers rely on syntax highlighting to parse code structure. Wrong fonts make code look like body text.

**CORRECT:**
- Every code block has syntax highlighting with a proper theme
- All code uses monospace font (JetBrains Mono, Fira Code, SF Mono)
- Inline code has distinct background and monospace font
- Code examples are complete and runnable (no ... or // TODO)
- Code blocks have proper indentation and spacing

### 5. Missing Search

**WRONG:** Documentation without a search function — users must navigate through the sidebar to find information.

**Why it is wrong:** Developer documentation without search is nearly unusable. Users arrive with specific questions. Without search, they must guess which section contains the answer. Large documentation sets (50+ pages) are impossible to navigate without search.

**CORRECT:** Full-text search with CMD+K shortcut. Results grouped by type. Instant results as you type. Search indexes all content: headings, body text, code samples, and API reference tables.

### 6. Empty or Incomplete Pages

**WRONG:** Documentation pages that say Coming soon, TODO, or This page is under construction. Stub pages in the sidebar that lead to empty content.

**Why it is wrong:** Broken promises erode trust. Empty pages waste the user's time. They suggest an incomplete or neglected product.

**CORRECT:** Never publish empty pages. If a page is not ready, do not include it in the sidebar. If a section must reference future content, add a small inline note: This feature is coming in v2.5. Not a full page.

### 7. Non-Scannable Content

**WRONG:** Long walls of text without headings, lists, or visual breaks. 500-word paragraphs. No code examples in a guide that should have code.

**Why it is wrong:** Users scan documentation, they do not read it word-for-word. They look for headings that match their question, then read that section. Walls of text are impossible to scan.

**CORRECT:**
- Every 3-5 paragraphs, insert a heading or visual break
- Use bullet lists for features, options, and steps
- Use code blocks liberally — every concept should have an example
- Keep paragraphs short (2-4 sentences)
- Use bold for key terms and important notes

---

## Brand Personality in Documentation

### Developer-First / Technical

| Attribute | Specification |
|---|---|
| Color palette | Dark sidebar (neutral-900 or darker), white content area. Accent: technical colors (blue, green, or cyan) |
| Typography | Inter or system fonts for UI. JetBrains Mono or Fira Code for code. Clean, no display fonts |
| Tone | Direct, precise, technical. Assumes reader is competent. No hand-holding |
| Code style | Dark code blocks. Full syntax highlighting. Complete, runnable examples. Terminal-style UI elements |
| Search | CMD+K prominently displayed. Instant search. Keyboard-first navigation |
| Key features | Copy button on all code blocks. Edit on GitHub link. Version selector. Dark mode toggle |
| Reference | Stripe Docs, Vercel Docs, Tailwind CSS Docs, Rust Docs, Supabase Docs |

**Design keywords:** precise, complete, fast, code-first, dark mode, keyboard-navigable

### Friendly / Educational

| Attribute | Specification |
|---|---|
| Color palette | Light sidebar (neutral-50), warm accent (coral or teal). Inviting colors |
| Typography | Readable sans-serif. Slightly larger body text (17-18px). Friendly headings |
| Tone | Welcoming, patient, educational. Explains concepts before showing code. Uses you and your |
| Code style | Light or dark code blocks. Comment annotations in code. Step-by-step examples |
| Key features | Estimated reading time. Prerequisites section. Step-by-step format. Screenshots for visual learners. Glossary tooltips |
| Reference | MDN Web Docs, Django Docs, Ruby on Rails Guides, Notion Guides |

**Design keywords:** welcoming, patient, thorough, visual, beginner-friendly, educational

---

## Real-World Reference Documentation

### Stripe Docs
- **Mode:** Developer-first / technical
- **Signature traits:** Dark sidebar (navy/dark blue), white content area, excellent 3-panel layout (sidebar + content + TOC), code examples in multiple languages with tab switcher, copy button on every code block, API reference tables with required badges, CMD+K search, version selector, Edit on GitHub link
- **Key takeaway:** The gold standard. Multi-language code examples, complete API reference tables, excellent information architecture. Dark sidebar + light content is the most common docs layout.

### Vercel Docs
- **Mode:** Developer-first / clean
- **Signature traits:** Minimal sidebar (neutral-50), white content area, clean typography (Inter), careful use of callouts, excellent IA (Information Architecture), code blocks with file name headers, copy buttons, dark mode support, good search
- **Key takeaway:** Clean, readable, minimal. The sidebar navigation is exceptionally well-organized. Content is concise and precise.

### Tailwind CSS Docs
- **Mode:** Developer-first / excellent search
- **Signature traits:** Light sidebar, very clean layout, exceptional search (fast, relevant results, grouped by section), utility-class references styled as small colored chips, responsive utilities rendered as interactive examples, dark mode support
- **Key takeaway:** Search is the killer feature. The sidebar is useful, but most users CMD+K to find what they need. Documentation search should be fast, relevant, and keyboard-first.

### Linear Docs
- **Mode:** Minimal / fast
- **Signature traits:** Extremely minimal. No right sidebar. Clean left sidebar with just page titles (no nesting deeper than 2 levels). Content area is centered and narrow. Fast page loads. Keyboard shortcuts for navigation. Dark mode by default
- **Key takeaway:** Speed and simplicity. Remove everything that is not the content. No TOC (keep pages short enough to not need one). Keyboard shortcuts for power users. Pages load instantly.
