# Notion design language

## When to reach for this reference
Use Notion's design language when building knowledge management tools, wikis, documentation platforms, note-taking apps, or any product where user-generated content is the primary material. It is the gold standard for content-first UIs where the chrome recedes and the user's own text, images, and databases take center stage. Also the right reference for block-based editors and tools that need to feel endlessly flexible without becoming visually chaotic.

## Brand personality
Calm, neutral, and quietly empowering. Notion has the personality of a perfectly organized desk — it doesn't impose a workflow, it provides a canvas. The brand is egalitarian: it treats a student's class notes with the same visual dignity as a startup's pitch deck. There is a gentle, almost Zen-like restraint; Notion never yells at you. The occasional hand-drawn illustration or friendly empty-state doodle adds warmth without breaking the calm.

## Color philosophy
Monochrome-first with sparse, low-saturation accents. The default canvas is a very light warm gray (`#FBFBFA`) or white — so close to white that it reads as clean without feeling sterile. UI chrome (sidebar, toolbar, menus) is a slightly darker gray-beige (`#F1F1F0`). Text is near-black (`#37352F`) — a warm off-black that is softer on the eyes than pure `#000`. The accent palette is pastel and restrained: muted blue, soft pink, pale yellow, sage green, light lavender. These appear in page icons, callout blocks, and database property tags. The color saturation is dialed way back — no color in the UI ever exceeds 30–40% saturation. The cumulative effect is calm and unobtrusive. Dark mode mirrors this: deep warm grays with the same muted accent set.

## Typography approach
Type that disappears into the content. Notion's default is a carefully tuned system font stack at 16 px for body — comfortable for long-form reading. The brand's custom serif headings (when enabled) add an optional editorial flair without compromising legibility. Three font styles are offered — Default (sans-serif), Serif, and Mono — each with consistent spacing. The hierarchy is minimal: page titles get a generous 40 px bold treatment, headings use a simple 3-level scale, and body text is uniform. Inline formatting (bold, italic, code, links) uses subtle color shifts and style changes that don't disrupt reading flow. Line height is a comfortable 1.5 for body text. The type system's primary job is to stay out of the way.

## Spacing & density
Content-first with generous margins. The editing canvas is centered with wide outer gutters that narrow to a comfortable 700–800 px column width for prose — optimal for readability. Block-based content (headings, paragraphs, lists, databases) uses a tight but not cramped vertical rhythm: 2–4 px between consecutive lines, 8–12 px between distinct blocks. The sidebar is compact (220–240 px) with 6–8 px padding in items. Database views (tables, boards, calendars) are denser than the prose view but never crowded — table rows are 32–36 px tall. The overall density philosophy is: "give content the space it asks for, no more, no less."

## Corner radius & shape language
Soft and barely-there. Page content blocks have no visible bounding boxes or cards until hovered — they are defined by whitespace alone. UI chrome elements (sidebar items, tooltips, dropdowns) use 4–6 px border-radius — a minimal rounding that softens edges without calling attention. Buttons and callout blocks use 3–4 px rounding. Database views introduce slightly more rounding (6–8 px) on card and board views for visual grouping. The shape language is essentially rectangular with the corners eased just enough to avoid any sharpness. No pill shapes, no circular buttons, no decorative rounded bounding boxes around content.

## Elevation & depth
Nearly flat, with depth created through background contrast and hairline borders. Cards in board views float on a very subtle shadow (`0 1px 2px rgba(0,0,0,0.06)`). The sidebar is separated from the editing canvas by a single 1 px border and a slight background tint difference. Popovers, tooltips, and the slash-command menu sit on a white background with a 1 px border and a soft 0–4 px blur shadow. Modals use a tinted backdrop with a border on the modal itself. The depth model says: "the user's content is the surface; admin UI floats just barely above it."

## Iconography & imagery
Hand-drawn and human. Custom emoji-style page icons are the primary iconographic element — they are flat, slightly organic, and rendered at 48–72 px. The icon picker provides a curated set that spans standard emoji, custom glyph icons, and uploaded images. UI chrome icons (sidebar, toolbar, menus) are simple geometric stroke icons at 16×16 px with 1.5 px stroke weight, rounded caps. Illustrations are line-art style, hand-drawn in feel, sparse in detail, and used primarily in empty states and onboarding screens — they feature simple characters and abstract shapes in the muted accent palette. Photography is entirely absent from the product UI. The visual world is built from the user's own content plus a small, warm set of illustrated moments.

## Signature patterns
- **The slash command (`/`)** — the primary creation pattern; typing `/` anywhere opens a context-aware menu of blocks and actions, making the entire interface feel like a keyboard-first power tool
- **Block handles (six-dot drag icons)** — hover-revealed drag handles on every content block that allow reordering and transforming content without a separate editing mode
- **Callout blocks** — tinted, icon-leading content blocks that create visual hierarchy within a page without breaking the monochrome flow
- **Database views as content blocks** — tables, boards, calendars, timelines, and galleries are not separate pages; they are block types that live inline within any page
- **Synced blocks and linked databases** — content that mirrors itself across pages, reinforcing the sense of a living, connected workspace
- **The sidebar page tree** — a clean, collapsible, drag-and-drop hierarchy that mirrors the user's mental model of their workspace

## Motion philosophy
Subtle to the point of being subliminal. Page transitions are instant or use a 100–150 ms cross-fade. Sidebar toggle animates smoothly in 200 ms. The slash-command menu fades in with a slight upward slide (150 ms). Drag-and-drop shows a translucent placeholder and a smooth reflow (200 ms). Opening a page feels more like a reveal than a navigation, achieved by an expanding content area animation. Peek views (preview modals) slide up from the bottom with a gentle spring. Everything is tuned for frequent, prolonged use — nothing is distracting, nothing vibrates with enthusiasm.

## Voice & copy tone
Warm, clear, and minimalist. Microcopy is precise and human. Placeholder text says "Press `/` to add a block" — instructional without being bossy. Empty states are friendly and gently encouraging: "This page is empty. Start writing or drag in some content." The copy is written for a global audience and avoids idioms, cultural references, and overly casual language. Help documentation matches the product tone — clear, example-driven, and reassuring without being patronizing. There is a quiet confidence in the voice that makes the product feel stable and dependable.

## Explicitly do not
- Do not reproduce Notion logos, wordmarks, or trademarked assets
- Do not copy Notion's UI copy, onboarding text, or template content verbatim
- Do not build block-based editors that replicate Notion's specific block types, slash-command menu, or data model
- This reference describes a design language to draw from — it is not a license to clone any specific Notion interface
