# Notion — Do / Don't

## Color

### Backgrounds

**Do:** Use a warm off-white (`#FFFCF7`) for the primary canvas background. This slight warmth makes long reading comfortable without looking beige or tinted. Use warm gray-beige (`#F1F1F0`) for chrome elements (sidebar, toolbar, menus) to create a subtle but clear separation from the content area. In dark mode, use deep warm grays (`#191919`, `#202020`, `#2A2A2A`) — never cool grays.

**Don't:** Use pure white (`#FFFFFF`) for the canvas. It reads as sterile and fatiguing over long sessions. Use pure black (`#000000`) for dark mode backgrounds. Use cool grays (blue-ish or green-ish undertones) — the warmth is essential to the Notion feel. Use the same background color for content and chrome — they must be distinguishable.

### Text

**Do:** Use warm near-black (`#37352F`) for body text instead of pure `#000`. Use secondary text (`#6B6966`) for captions, metadata, and labels. Use tertiary text (`#9B9996`) for placeholder text and disabled states. Maintain a clear 3-tier text hierarchy with sufficient contrast between each level.

**Don't:** Use pure black text — it creates too much contrast against the warm off-white background and feels harsh. Use gray text that's too light (below `#9B9996`) for any readable content. Skip the secondary text tier — labels and metadata need their own visual weight. Use color for any text beyond links and the accent.

### Accent

**Do:** Limit the accent color to exactly these uses: links, primary buttons (solid fill), focus rings, selected states in navigation, and database property tags. Apply accent as a solid fill on interactive elements. Use 10-15% opacity accent tints for callout block backgrounds and select tag backgrounds — never full opacity. Default to blue (`#2383E2`) as the system accent.

**Don't:** Use accent color decoratively — no accent borders, no accent section dividers, no accent icon fills. Use multiple competing accent colors on the same screen (user-customized accent per workspace is fine, but one accent at a time). Apply accent backgrounds at full opacity — they should be barely-there tints. Use accent on non-interactive elements.

### Semantic Colors

**Do:** Use subdued semantic indicators: green checkmark for success/completion, red exclamation for errors, amber for warnings. Keep them small (14-16px icons) and at low saturation. Apply 10% background tints when a semantic background is needed (e.g., a to-do complete state). Position semantic indicators inline with text, not as standalone banners.

**Don't:** Use bright, saturated red (`#FF0000`) or green (`#00FF00`). Use large colored banners or alerts. Rely on color alone to communicate status — always include an icon or text label. Use semantic colors for anything other than status/feedback signals. Let semantic colors compete visually with the accent color.

### Dark Mode Equivalence

**Do:** Mirror the light mode palette exactly in dark mode — same relative contrast ratios, same saturation levels, same warmth. Use `#FFFFFF` text (softened to `#E8E7E4`) on `#191919` backgrounds. Keep accent and semantic colors at the same saturation as light mode — do not increase saturation to compensate.

**Don't:** Simply invert colors. Change the saturation or warmth of the palette when switching modes. Make dark mode text pure white — soften it slightly. Increase accent saturation in dark mode — the same colors work if backgrounds are properly tuned.

## Typography

### Typeface Selection

**Do:** Use Inter (or system sans-serif) for all UI text. Offer serif and mono as user-selectable content options, but keep UI chrome in sans-serif only. Always include a robust system font fallback stack. The typeface should be invisible — if users notice the font, it's doing too much.

**Don't:** Use display fonts, handwritten fonts, or any typeface with strong personality for UI text. Rely on a single font with no fallbacks. Use different typefaces for different parts of the UI — consistency is the point.

### Type Scale

**Do:** Use exactly: 40px weight 700 for page titles, 24px weight 600 for H2, 20px weight 600 for H3, 18px weight 600 for H4, 16px weight 400 (line-height 1.5) for body, 14px weight 400 for captions and metadata, 12px weight 400 for small labels. The scale should feel limited and deliberate — every size has a clear job.

**Don't:** Add intermediate sizes between the defined scale. Use different weights for the same size (e.g., 16px at both 400 and 500 in the same context). Allow heading sizes to overlap with body sizes. Create a type scale larger than 5-6 stops.

### Weight Usage

**Do:** Stay within 400-700. Use 400 (Regular) for body text, captions, metadata, labels, and menu items. Use 500 (Medium) sparingly for button text and emphasis within body. Use 600 (Semibold) for all headings. Use 700 (Bold) for page titles only. The narrow weight range creates visual calm.

**Don't:** Use weight 800+ anywhere in the UI. Use weight 700 for body emphasis — it's too strong. Mix regular and medium weights in the same paragraph. Use bold styling to create hierarchy — sizes and color should handle that.

### Line Height & Readability

**Do:** Set body text line-height to 1.5 for comfortable long-form reading. Set heading line-height to 1.2-1.3 (tighter, since headings are short). Set caption line-height to 1.4. Ensure text columns stay within 700-800px for optimal readability (65-75 characters per line).

**Don't:** Use line-height below 1.4 for body text — it becomes tiring to read. Use line-height above 1.6 — it looks loose and unfocused. Let text columns extend wider than 800px for prose content (database views are the exception).

### Text Color Hierarchy

**Do:** Use a clear 3-tier hierarchy: primary (`#37352F`) for all body text and headings, secondary (`#6B6966`) for captions, metadata, timestamps, and inline labels, tertiary (`#9B9996`) for placeholder text, disabled states, and very low-priority information. The tiers should be immediately distinguishable at a glance.

**Don't:** Use only two text colors (e.g., black and gray) — three tiers are needed for the content density Notion supports. Make secondary text too light to read comfortably. Use the same text color for content and chrome — content text should be warmer and slightly more prominent.

## Spacing & Layout

### Content Column

**Do:** Center the content column within the viewport. Set max-width to 700-800px for prose readability. Use generous page margins: 64px minimum, expanding to 96px at wide viewports. Allow database views and full-width blocks to break out of the content column and span the full content area.

**Don't:** Constrain database views to the prose column — they need horizontal space for columns. Use page margins narrower than 64px on desktop — the breathing room is functional, not decorative. Left-align content without centering the column — the centered column creates a focused reading experience.

### Sidebar

**Do:** Keep the sidebar at a fixed 220-240px. Use compact items: 28-32px row height, 6-8px text padding, 16px indent per nesting level. Show emoji page icons at 16px, page names at 14px. Show disclosure triangles for pages with children. Allow the sidebar to be collapsible.

**Don't:** Make the sidebar wider than 260px — it's navigation, not content. Add large icons or thumbnails to sidebar items. Use more than 3 levels of visual nesting depth — deeper nesting should use indent only, not additional visual treatment. Remove the collapse option.

### Block Spacing

**Do:** Use 24-32px between distinct content blocks (paragraphs, headings, lists). Use 4px between consecutive text lines within a block. Use 8-12px between block-level child elements (list items, to-do items). The rhythm should feel like a well-spaced document, not a UI layout.

**Don't:** Collapse block spacing below 16px — blocks need visual separation to be distinguishable. Use uniform spacing for all block types — headings need more space above than below. Add spacing that creates a fragmented, disconnected feel. Cram blocks together in database views even when displaying rich text.

### Chrome Padding

**Do:** Use 8px toolbar internal padding. Use 8-12px for input fields and dropdowns. Use 6-8px for sidebar item padding. Chrome should be compact and efficient — it's the frame, not the painting.

**Don't:** Add generous padding to chrome elements. Make toolbars tall or spacious — they should be compact utility zones. Apply the same spacing logic to chrome as to content — chrome is denser by design.

## Corner Radius & Shape

### Interactive Elements

**Do:** Use 4px radius for buttons (primary and secondary). Use 4px for inputs, selects, and form fields. Use 4px for sidebar item hover states. Use 6px for dropdowns, tooltips, and floating menus. Use 8px for modals and dialogs. This small range (4-8px) keeps everything visually coherent.

**Don't:** Use pill shapes (fully rounded buttons, tags, or inputs). Use radii larger than 8px on any functional element. Use 0px (perfectly sharp) on interactive elements — they should feel slightly softened. Use different radii on similar elements — consistency matters more than variety.

### Content Blocks

**Do:** Define content blocks by whitespace alone — no visible containers, no borders, no backgrounds on standard blocks. Content should float on the page, separated by breathing room. This is the key to Notion's "document, not interface" feel.

**Don't:** Add visible bounding boxes, cards, or containers around content blocks. Add borders around paragraphs or headings to "structure" the page. Create the type of rigid layout boxes that make content feel like a form rather than a document.

### Special Blocks

**Do:** Use 4px radius on callout blocks (with 10% accent tint background). Use 4px radius on code blocks (with subtle gray background `#F1F1F0`). Use 2px left border (no radius, no background) on quote blocks. Use 6px on board view cards. Use 8px on gallery cards.

**Don't:** Give callout blocks large radii or heavy shadows — they should blend into the page flow. Add visible frames around code blocks beyond the subtle background. Make quote blocks look like callouts or vice versa — each has a distinct treatment.

### Database Elements

**Do:** Use 6px radius on board cards with 1px border and minimal shadow. Use 8px radius on gallery cards with image preview. Use 4px radius on select/multi-select tags inside cells. Use no visible radius on table cells — they're defined by the row background.

**Don't:** Add cell borders to table views. Use shadows on table rows. Make board cards look like external UI cards — they should feel like content that happens to be arranged in columns. Use rounded corners on table headers.

## Elevation & Shadows

### Depth Model

**Do:** Create depth through background contrast, not shadows. The page sits on `#FFFCF7`, the sidebar sits on `#F7F6F3`, the toolbar floats slightly above both. This 3-level background system communicates hierarchy without any shadow. Use 1px borders (`#E8E7E4`) for the sidebar/canvas boundary and modal edges.

**Don't:** Use drop shadows on the page, sidebar, or content blocks. Create a multi-layered elevation system. Rely on shadows to communicate hierarchy — background contrast should do 90% of the work.

### When Shadows Are Appropriate

**Do:** Use minimal shadows on: board view cards (`0 1px 2px rgba(0,0,0,0.06)`), the slash command menu (`0 2px 8px rgba(0,0,0,0.10)`), tooltips (same), modals (`0 4px 16px rgba(0,0,0,0.12)`). Shadows should be so subtle they're almost subliminal — the user shouldn't consciously notice them.

**Don't:** Use shadows larger than 16px blur. Use shadows on more than 4-5 elements per screen. Make shadows dark enough to be immediately noticeable. Use colored or tinted shadows. Stack shadows (multiple box-shadows on one element).

### Dark Mode Shadows

**Do:** Use white at 4-8% opacity instead of black for shadows in dark mode. Keep the same blur radii and offsets as light mode. Shadows should be even subtler in dark mode since there's less ambient light to create visible drop shadows.

**Don't:** Use black shadows in dark mode — they're invisible against dark backgrounds. Increase shadow opacity in dark mode to compensate — keep them subtle. Change the elevation model between light and dark mode.

## Content & Blocks

### Block Creation

**Do:** Make the `/` command the primary creation pattern. Open the menu instantly on keystroke. Show categorized options (Basic, Database, Media, Embeds, Advanced). Make the menu searchable as-you-type. Position the menu near the cursor in the content flow.

**Don't:** Require clicking a toolbar button to add content — the `/` command is the signature. Make the menu slow to open or search. Show all options in one undifferentiated list. Position the menu far from the cursor — it should feel like an extension of the typing experience.

### Drag-and-Drop

**Do:** Show six-dot drag handles on block hover only (hidden by default). Display a translucent placeholder at the drop target during drag. Animate the content reflow smoothly (200ms) around the placeholder. Allow drag reordering both within and between pages.

**Don't:** Show drag handles persistently — they create visual noise when not needed. Use a different drag handle pattern than the six-dot icon. Animate the reflow with spring physics or dramatic motion. Make drag targets ambiguous — the placeholder should be crystal clear.

### Callout Blocks

**Do:** Use a 10-15% accent tint background. Lead with an emoji icon (18-20px) on the left. Apply 4px border radius. Use 12-16px internal padding. Use callouts sparingly — one or two per page for emphasis. Maintain the monochrome flow — the callout should whisper, not shout.

**Don't:** Use full-opacity accent backgrounds. Create callouts without emoji icons — the icon is half the visual signal. Use callouts as a primary layout mechanism (every other block shouldn't be a callout). Make callouts visually disruptive to the reading flow.

### Empty States

**Do:** Make empty pages inviting but not pushy. Show "This page is empty. Start writing or drag in some content." in a friendly, warm tone. Provide clear next actions: "Press `/` to add a block." Use the hand-drawn illustration style for empty state visuals. Keep empty states compact — the user should feel invited to fill the space, not observe it.

**Don't:** Leave empty pages completely blank with no guidance. Use marketing-style onboarding nudges. Display large, attention-demanding illustrations. Make the user feel like they're looking at an error — empty is a natural state, not a problem.

## Navigation

### Sidebar Behavior

**Do:** Allow collapse/expand of the sidebar. Make page tree items draggable for reordering. Show indent depth via 16px per level with subtle vertical connection lines. Add a "+" button at the bottom of each section for adding new pages. Auto-expand to the current page on navigation.

**Don't:** Force the sidebar to be always visible. Show more than 3 levels of nesting without collapsing deeper levels. Use heavy or dark connection lines for nesting depth. Require a right-click or menu action to add a page.

### Breadcrumbs

**Do:** Show at the top of every page (below the cover image if present). Display full hierarchy: Workspace > Parent Page > Current Page. Use "/" as separator. Make each segment clickable. Use 14px with secondary text color for non-active segments, primary for current.

**Don't:** Hide the breadcrumb path — users need spatial orientation. Use icons or decorative separators instead of simple "/". Make the breadcrumb large or attention-demanding. Show only the current page without context.

### Quick Find (CMD+P)

**Do:** Open instantly on `CMD+P`. Show a search input with recent pages below. Filter results as-you-type across pages, database entries, and workspace content. Show page emoji icons next to results. Navigate on Enter, close on Escape.

**Don't:** Add a delay before showing results. Limit search to page titles only. Show results without identifying icons or context. Require clicking to activate — keyboard-first is the pattern.

## Database Views

### Table View

**Do:** Use alternating 2% brightness row backgrounds (zebra striping) instead of grid lines. Keep column headers compact (12px medium text, 14px property type icon). Make rows 32-36px tall. Show row number on hover. Allow inline editing that doesn't disrupt the reading flow. Right-align numbers, left-align text.

**Don't:** Add cell borders or heavy grid lines. Make rows tall and spacious — density is needed. Use bright or large header text. Show the database as a separate, disconnected view — it should feel part of the page.

### Board View (Kanban)

**Do:** Use columns with subtle gray tint backgrounds. Display cards with 1px border, 6px radius, and minimal shadow. Show 2-3 properties on each card (e.g., priority tag, due date, assignee). Include a `+ New` button at the bottom of each column. Animate drag-and-drop with translucent placeholder and smooth reflow.

**Don't:** Use white column backgrounds — they blend with cards and lose structure. Show all properties on cards — surface only the most important 2-3. Make cards with heavy shadows or large radii. Animate drag-and-drop with spring or bounce physics.

### Calendar View

**Do:** Show cards with title + 1-2 properties in day cells. Use the same card styling as board view for consistency. Allow drag-to-reschedule within the month. Highlight today's date cell subtly. Show month/week toggle.

**Don't:** Display only titles without property context. Use a different card style from board view — consistency across views matters. Make date cells feel crowded — show a "+N more" link when there are too many cards for a day.

### Gallery View

**Do:** Use image-leading cards with metadata below. Apply 8px radius to cards. Show the cover image (or first image in page) as the primary visual. Display page title and 1-2 properties below the image. Use a responsive grid that reflows naturally.

**Don't:** Show text-only cards — gallery is image-first. Use the same radius as board cards — gallery cards are slightly softer. Crop images aggressively — show representative previews.

## Motion

### Timing

**Do:** Use 100-150ms for micro-interactions (tooltips, hover states, button presses). Use 150-200ms for UI element transitions (menus, dropdowns, toggles). Use 200ms for page transitions. Use 250ms for panels (side peek slide-in). Everything should feel fast but not abrupt.

**Don't:** Use transitions longer than 250ms anywhere. Make any interaction feel sluggish or delayed. Use different timing for similar interactions — consistency creates predictability.

### Easing

**Do:** Use ease-out for entrances (elements appearing — accelerate into position). Use ease-in for exits (elements disappearing — decelerate away). Use ease-in-out for continuous transitions (sidebar collapse, content reflow). No custom cubic-bezier curves — standard easing functions work perfectly.

**Don't:** Use linear easing for anything — it feels mechanical. Use spring physics or bounce easing. Create custom easing curves that feel inconsistent with the rest of the UI. Use different easing for similar interactions.

### What to Animate

**Do:** Animate: slash command menu (fade + 4px slide up), tooltips (fade), modals (fade backdrop + subtle scale), sidebar toggle (smooth width), peek panel (slide from right), block reordering (translucent placeholder + reflow), page transitions (cross-fade or subtle reveal). Motion should answer "where did this come from?"

**Don't:** Animate: text input, scrolling, content loading (skeleton is fine), page painting/rendering, static elements on hover, background colors abruptly. Avoid anything that delays the user's ability to act.

### What Never Moves

**Do:** Keep these static: content text (never animated), database query results (appear, don't animate in), page breadcrumbs, sidebar page tree (except on reorder), static form labels. The content IS the interface — it should feel solid and stable.

**Don't:** Animate content blocks appearing on page load. Make database results stagger or fade in. Add scroll-triggered animations to the editing surface. Make the reading experience feel dynamic — reading requires stability.

## Voice & Copy

### Tone

**Do:** Write in a warm, professional, encouraging tone. Use the voice of a helpful peer, not a manager or cheerleader. Be globally accessible — no idioms, no cultural references, no puns. Match the product's calm, neutral personality in every word.

**Don't:** Write copy that feels pushy, urgent, or high-pressure. Use marketing language ("amazing," "powerful," "game-changing"). Add exclamation marks anywhere. Write in a tone that doesn't match the visual calm of the product.

### Action Language

**Do:** Use gentle action verbs: "Write, plan, organize." "Add a page." "Try `/` to add a block." Keep instructions minimal and precise. Use verb-first patterns in menus: "Create page," "Add block," "Set reminder."

**Don't:** Use commanding language: "You must..." "Click here to..." Over-explain simple actions. Write multi-sentence instructions where a short phrase would do. Use passive voice — active is clearer and warmer.

### Empty States

**Do:** Be encouraging but not patronizing: "This page is empty. Start writing or drag in some content." "Press `/` to add a block." Include a clear next action. Match the friendly, hand-drawn illustration style.

**Don't:** Use generic empty states: "No content." Leave users without a clear next step. Make empty states visually stark or error-like. Use the empty state to upsell features.

### Error Messages

**Do:** State what happened in plain, simple language. Provide a clear next action: "The page couldn't be saved. Check your connection and try again." Keep error messages brief — one sentence ideal, two max. Never blame the user.

**Don't:** Use technical jargon that assumes developer knowledge. Write error messages that offer no path forward. Make errors feel catastrophic — they're normal occurrences. Use red text or alarming visual treatments for routine errors.

### Case

**Do:** Use sentence case for all UI labels, headings, buttons, and menu items. "Create a page" not "Create a Page" or "CREATE A PAGE." Sentence case reads faster and feels less formal — it matches Notion's warm, approachable personality.

**Don't:** Use title case, all-caps, or inconsistent capitalization. Mix cases within the same context (e.g., one button in title case, another in sentence case). Use all-caps for emphasis — it reads as shouting.

### Consistency

**Do:** Refer to the same concept with the same word everywhere. If it's a "workspace," always call it a "workspace" — not a "team," "organization," or "account." If it's a "page," don't sometimes call it a "document" or "note." Consistency builds user confidence.

**Don't:** Use multiple terms for the same concept — pick one and stick with it. Change terminology between the product and documentation. Use synonyms to "keep copy fresh" — clarity over variety.
