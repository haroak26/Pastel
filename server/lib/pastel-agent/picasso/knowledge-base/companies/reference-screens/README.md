# Reference Screen Images — Sourcing Note

This directory is structured to hold reference screenshots for each company's
design language. These images are NOT fabricated placeholders — they should be
real, legitimate screenshots from public-facing product pages or official
marketing materials.

## Sourcing guidelines

For each company:
- `reference-screens/dashboard.png` — main product dashboard/app view
- `reference-screens/list-view.png` — list/data-dense view
- `reference-screens/detail-view.png` — single item detail/modal view

Sources (legitimate, public):
- Official product marketing pages (e.g., stripe.com, linear.app)
- Public blog posts showing product screenshots
- Official press kits
- Your own captured screenshots of the product (if you have access)

## What to avoid:
- Scraping behind login walls
- Screenshots of competitor UIs used in ways that create legal exposure
- Fabricated "recreations" — the point is to ground the model in reality

## Current status:
- Structure created, directories ready
- NO images committed yet — sourcing needs to happen before shipping
- Images should be PNG, 1440px width preferred
- File size: <2MB per image

## How they're used:
In the pipeline, when a company reference is selected in the brief
(e.g., companyRefs: ["stripe", "duolingo"]), the reference screenshots
are passed as image inputs to:
1. The creative-directions stage (visual grounding for design decisions)
2. The visual-QA critique stage (calibration context: "here's what good looks like")

For briefs without a specific company reference, generic reference images
matched to the detected niche/mode are used instead.

## Wiring:
The `stage-1-brief.ts` `loadContextForStage1` function is extended to also
load reference screenshots alongside markdown descriptions. The images are
passed as base64-encoded image blocks in the message format.
