# Uber design language

## When to reach for this reference
Use Uber's design language when building mobility, logistics, delivery, or on-demand service products — or any high-utility consumer app where the user's job is "get from A to B" and the interface must make that feel effortless and trustworthy. Reach for it when the product needs black-and-white authority with one reserved signal color, concrete transactional copy, and form-first screens where every field earns its place. It fits apps whose core moment is a decision: see the price, confirm the ride.

## Brand personality
Utterly concrete and quietly dominant. Uber behaves like the reliable service it is: no rhetoric, no persuasion — a black header, a location form, a price. The personality is direct, efficient, and urban: it respects the user's time by showing exactly what they need to know (price, ETA, options) and nothing else. Authority comes from contrast and simplicity: black and white, decided and done.

## Color philosophy
Black-and-white foundation with green as the only loaded signal. The canvas is white (`#ffffff`) with near-black ink (`#000000`) for text, headers, and primary actions; `#545454`-class muted for secondary copy and `#f6f6f6` soft surfaces for cards. Hairlines are `#ddd`-class. Green (`#06c167`) is reserved for confirmed/live states and the single primary action — its scarcity makes it meaningful; red (`#da291c`) appears only for genuine error. The system is monochrome with two semantic colors, each with a strict job.

## Typography approach
A neutral sans (Arial/Helvetica-class) with weight as the hierarchy instrument. Hero statements run 40px at weight 700 with 1.05 leading; section headings are 26px bold; body is 14px at 1.45 leading. Labels are 11px uppercase-bold — the signature micro-detail that makes forms feel engineered. Prices and ETAs are 18px bold with tabular numerals so columns of numbers align. The type system is the interface's voice: heavy where it decides, small where it informs.

## Spacing & density
Precise, form-led spacing. Content rails cap near 1180px with 24–48px section rhythm. Form fields are 44px tall with 4px radii and gray borders — consistent, predictable, and touch-friendly. Cards carry 16–24px padding with 12–16px gaps; hero regions split into functional columns (form left, media/map right). Sheets and panels collapse to rounded-top bottom sheets on mobile. Every pixel belongs to the job: get input, show options, confirm choice.

## Corner radius & shape language
Sharp-to-soft, by function. Small controls use 4px radii; cards use 12px; sheets and panels round to 20px; pills exist only for badges and status. The geometry is urban and engineered — rectangles for work, rounded sheets for mobile comfort. No ornament, no organic shapes; the shape language says "built to be used fast."

## Elevation & depth
Functional depth only. Panels and sheets lift with soft shadows (`0 -4px 20px rgba(0,0,0,0.16)`-class for bottom sheets); cards separate by tint (`#f6f6f6`) and hairlines rather than shadows. The map panel is a flat functional rectangle with corner controls — never a decorative image. Elevation is a signaling device: floating surfaces are interactive and current.

## Iconography & imagery
Geometric, thin-stroke, and utilitarian. Icons are monoline at 16–24px for inputs, controls, and service types; the brand mark is a clean geometric wordmark. Imagery is photographic and grounded — riders, vehicles, city streets — presented in straight-edged frames. Illustrations are simple and functional (service icons, vehicle shapes). The visual rule: imagery shows the real world the service moves through; nothing is abstracted into decoration.

## Signature patterns
- **The form-first hero** — a concrete input block (pickup, dropoff, see prices) paired with media, not a slogan
- **The concrete ETA/price moment** — tabular bold numbers that answer the user's real question instantly
- **Service grids** — pale, quiet cards naming the service types, each with one obvious entry point
- **The reserve/plan-ahead panel** — a distinct surfaced panel for scheduling, visually separate from instant actions
- **Black action discipline** — black primary buttons on white; green only when something is live or confirmed
- **Map as a working surface** — the map is a functional panel with controls, never a background

## Motion philosophy
Fast, businesslike, and state-confirming. Transitions run 100–200ms; buttons invert (black↔white) on hover; sheets slide up quickly; map and list updates settle without ceremony. Motion's only job is confirming state — loading forms hold their dimensions, and nothing bounces, spins, or performs. Reduced-motion preferences are respected.

## Voice & copy tone
Concrete to the point of terse. Copy is placeholders and outcomes: "Pickup location", "Arriving in 3 min", "$14.20", "Reserve". The voice states facts in the fewest words; labels are specific, prices are exact, and errors are honest. There is no marketing language inside the working product — trust is earned by the interface showing the user exactly what they asked to know.

## Explicitly do not
- Do not reproduce Uber logos, wordmarks, or trademarked assets
- Do not copy Uber's product copy, fare/ETA display formats, or map experience verbatim
- Do not clone Uber's ride-booking flow or data model
- This reference describes a design language to draw from — it is not a license to clone any Uber interface
