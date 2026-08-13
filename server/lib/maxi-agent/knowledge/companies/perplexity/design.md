# Perplexity design language

## When to reach for this reference
Use Perplexity's design language when building AI answer engines, research assistants, search-adjacent products, or any tool whose core loop is: ask a question, get a cited, composed answer. Reach for it when the product must feel like a capable research partner — clean, fast, and transparent about its sources — rather than a chat novelty. It fits light-first interfaces where the answer surface and its citations carry the entire design weight.

## Brand personality
Intellectually assured and radically transparent. Perplexity presents as the sharp research assistant: it answers directly, shows its sources, and lets the user steer follow-ups — no mystery, no filler. The personality is precise and a touch academic, but friendly enough to stay approachable. The interface's calmness signals that the hard thinking is happening underneath, not in the chrome.

## Color philosophy
Light-neutral with ink-led hierarchy. The canvas is white (`#ffffff`) with gray surfaces for panels and search chrome (`#f4f4f5`-class) and hairline borders (`#d8d8d8`-class). Ink is near-black (`#1f1f1f`) with `#4b4b4b`-class muted for metadata and citations. Accent color is used sparingly for the primary action and active states — a single brand hue that never floods the surface. Links and sources are the one place conventional blue communicates affordance. The system is monochrome-first; content, not color, carries the visual interest.

## Typography approach
A clean neutral sans (Inter-class) with a research-document texture. Interface type runs 14–16px with 1.4–1.5 leading; the answer surface uses a slightly larger, more readable size with generous line spacing because reading is the product. Headings are 20–28px at weight 600 with tight leading. Source labels, model names, and metadata are small (12–13px), muted, and set apart so the answer's prose dominates. Emphasis comes from weight and size, never from color or ornament.

## Spacing & density
Composed and airy where reading happens, compact where working happens. The answer column is narrow and centered (640–900px) with 24–48px vertical rhythm; search and input chrome stays dense and utilitarian. Cards for related queries and sources use 16px padding with 8px internal gaps. The contrast — a calm reading column inside a functional search frame — is the layout signature.

## Corner radius & shape language
Rounded-rect and friendly-functional. Radii run 6–8px on inputs and buttons, 12–16px on cards and panels, pills only for avatars and chips. The geometry is approachable without being soft-edged to the point of toy-like: it is the shape language of a well-built consumer tool, not a toy or a bank.

## Elevation & depth
Flat, hairline-defined. Surfaces separate by 1px borders and faint luminance steps; shadows are reserved for floating surfaces (dropdowns, menus) and stay small (`0 2px 8px rgba(0,0,0,0.08)`-class). The interface reads as two layers at most: the page and whatever is floating above it. No skeuomorphic depth, no heavy panels.

## Iconography & imagery
Thin, geometric, and utilitarian. Icons are monoline at 16–20px used for search, navigation, and source affordances only. Imagery is minimal — the product is textual, so imagery appears as query context or article thumbnails at small, quiet sizes. There is no decorative illustration system; the "imagery" of the product is the cited answer content itself.

## Signature patterns
- **The focused ask box** — a single prominent input at the top of the view that dominates the empty state
- **Cited, composable answers** — numbered sources inline with the prose, with a source rail or panel alongside
- **Follow-up threading** — the conversation continues beneath the answer as a lightweight thread of related queries
- **Transparency chrome** — model, sources, and answer-type metadata shown plainly and compactly
- **Related-query cards** — dense suggestion clusters that invite the next question without interrupting the answer
- **Research-over-chat posture** — the interface frames the experience as inquiry (questions, sources, answers), not casual chat

## Motion philosophy
Fast and unobtrusive. Focus transitions run 100–200ms; answers surface without ceremony; menus and suggestions fade in briefly. The product's speed is expressed by the interface staying still — content arrives fast, so motion must not add latency to the feeling. Reduced-motion preferences collapse all decorative movement.

## Voice & copy tone
Direct, informative, and unpretentious. The product explains what it found and where it found it in plain language. Labels are concrete ("Ask anything", source names, model names); empty states invite a question rather than advertise a brand. The tone is that of a good librarian: precise, helpful, and brief.

## Explicitly do not
- Do not reproduce Perplexity logos, wordmarks, or trademarked assets
- Do not copy Perplexity's answer layout, citation format, or product copy verbatim
- Do not mimic a search engine's result-page structure or claim live web capabilities the product lacks
- This reference describes a design language to draw from — it is not a license to clone any Perplexity interface
