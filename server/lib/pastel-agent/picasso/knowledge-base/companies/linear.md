# Linear design language

## When to reach for this reference
Use Linear's design language when building productivity tools, project management apps, developer workflows, or any knowledge-worker interface that demands speed and clarity above all else. It is the reference for keyboard-first, dense-but-breathable UIs where experienced users live and work for hours. Also ideal for dark-mode-first applications and any tool that wants to feel impossibly fast.

## Brand personality
Minimalist to the point of austerity — but warm in its precision. Linear has the personality of a finely tuned instrument: every part has a purpose, every interaction is optimized. It is serious about craft without being self-serious about itself. The brand projects quiet competence and respects the user's time absolutely. There is no whimsy, but there is elegance.

## Color philosophy
A near-monochrome base with a single, restrained accent. The dark mode is the canonical experience: a cool, slightly blue-tinted dark gray background sequence (`#1A1A1F` base, `#222228` elevated, `#2A2A30` hover states). Light mode inverts to a clean off-white (`#F7F7F8`). Color identity is carried almost entirely by a single accent — a distinctive desaturated violet-blue (`#5E6AD2` is their brand accent) — used exclusively for interactive states, selection indicators, checkmarks on completed tasks, and the cursor. Status colors (red, amber, green) exist but are desaturated and pushed far into the background so they never compete with the primary accent. Tags and labels are rendered as subtle tinted backgrounds with colored text at very low contrast. The overall effect is monochrome at a glance with color revealing itself only where the user's attention is needed.

## Typography approach
Type in Linear is invisible by design — it disappears so the data can speak. The stack is an Inter-variant or tuned system font at 13–14 px for body, which is small by modern SaaS standards but completely legible due to generous line-height (1.5x) and careful weight distribution. Issue IDs and metadata use tabular-nums at smaller sizes (11–12 px). The heading scale is compressed: only two or three weights appear, and size jumps are modest. Italics are almost entirely absent. This creates a uniform, scannable texture where information density is high but the eye never struggles.

## Spacing & density
Linear achieves high information density without feeling cluttered. List items are 32–36 px tall, which places them denser than most competitors but still comfortably within touch/click guidelines. Vertical spacing between sections is tight (8–12 px) so the user can see more context at once. The left sidebar and issue list work together as a unified horizontal rhythm; columns are sized proportionally and reorderable. Inline metadata sits beside content rather than below it, saving vertical space. The philosophy is "pack information in, but give every piece exactly as much room as it needs."

## Corner radius & shape language
Sharp and deliberate. Linear uses very small corner radii: 3–4 px on buttons and inputs, 6 px on cards and panels. Elements feel crisp, almost rigorous. There are no pill shapes, no floating circular buttons, no rounded avatars (they're square or gently rounded-rect). The shape language communicates seriousness — this is a tool, not a toy. Checkerboard issue boards, kanban columns, and list rows adhere to clean rectangular geometry.

## Elevation & depth
Nearly flat. Linear doesn't use shadows to convey depth; it uses background color. UI layers are differentiated by a very subtle lightening or darkening of the background (1–3% luminance shift in dark mode). Hover states tint a row slightly lighter. Modals and command palettes sit on a slightly elevated background with a hairline 1 px border for separation. The Cmd+K command palette is the most elevated surface — everything else is functionally flat or uses a 1 px stroke divider. This lack of shadow contributes to the feeling of speed and tightness.

## Iconography & imagery
Icons are custom, geometric, stroke-based at 16×16 px and drawn on a strict pixel grid for sharp rendering at all densities. They weigh 1.5 px with rounded caps and joins. The icon set is internally consistent — every icon shares the same visual metaphors and construction rules. Illustrations are extremely rare and, when they appear, are abstract geometric compositions made from basic shapes in the accent color, often used in empty states. User avatars and project icons are the only non-geometric visual elements, and they are rendered small and circumspect.

## Signature patterns
- **The Command Palette (Cmd+K)** — the spiritual center of the app; nearly every action is accessible from a fast, fuzzy-searchable command input
- **Inbox → triage flow** — items don't live in a "list view," they flow through a triage system that treats unprocessed work as transient
- **In-line editing everywhere** — click any field to edit it directly; there is no detail modal, no edit mode toggle
- **Keyboard shortcuts as a first-class feature** — shortcut hints displayed inline, global and contextual shortcuts, and the ability to navigate the entire UI without a mouse
- **Batched optimistic updates** — changes appear to take effect instantly, with rollback on failure, making the UI feel preternaturally fast
- **Cycle-based timeline views** that compress work into a dense, calendar-adjacent visualisation
- **Hover reveals** — actions and metadata that stay hidden until hover to maintain default cleanliness

## Motion philosophy
Linear's animations are fast, purpose-built, and nearly invisible. Hover and focus transitions happen in 50–100 ms — fast enough that you rarely notice them, just feel the responsiveness. Page transitions use brief 150 ms cross-fades. The issue detail view slides in from the right with a satisfying but understated spring that takes under 200 ms. Drag-and-drop reordering shows a translucent placeholder immediately with a 120 ms reflow. Nothing bounces, nothing eases in slowly, nothing calls attention to itself. The motion model says: "the computer is keeping up with you."

## Voice & copy tone
Direct, utilitarian, and understatedly warm. Every label, error message, and empty state is written to be the shortest possible text that fully communicates the information. There is a dry wit in empty states that never interferes with usability. Inline help text is brief. The app doesn't congratulate you for completing tasks. The overall tone assumes the user is competent, busy, and appreciates not having their time wasted. Placeholder text and onboarding copy follow the pattern of friendly minimalism.

## Explicitly do not
- Do not reproduce Linear logos, wordmarks, or trademarked assets
- Do not copy Linear's UI copy, keyboard shortcut schemes, or interaction patterns verbatim
- Do not recreate Linear's exact issue tracking workflow or data model
- This reference describes a design language to draw from — it is not a license to clone any specific Linear interface
