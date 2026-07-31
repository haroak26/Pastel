---
name: Pastel Agent v2 architecture
description: How the rebuilt Pastel design agent works — stages, state, registry, model routing, and the infra gotchas discovered during validation.
---

## Rule
The Pastel Agent (`server/lib/pastel-agent/`) is a staged pipeline orchestrated by `orchestrator.ts`:
intake → spec → designSystem → architecture → designGate → implement → verify → visualQA → publish.
Stages read/write persistent `ProjectState` (table `agent_project_state`) and a per-project component
registry (`agent_component_registry`); markdown docs in the UI are RENDERED from state, never parsed back.

## Model routing
- Terra (`openai/gpt-5.6-terra`): intake, spec, designSystem, architecture, designGate, visualQA.
- Luna (`openai/gpt-5.6-luna`): component, screen, patch (surgical repair).
- Gateway tags must come from the org-registered `betagroupa` value set (clarify, brief, plan,
  componentPlan, planFallback, code, fixSimple — **there is no "review" value**). `chat()` retries once
  without tags when the gateway answers "Unknown tags" — keep that safety net.

## Infra gotchas (validated live)
- esbuild reports virtual files as `pastel:pastel:src/...` (double prefix). Always strip with
  `/^(?:pastel:)+/` — a single replace silently drops errors from per-screen attribution.
- A screen that bundles to EMPTY output must be an error, and incremental verification is only `ok`
  when EVERY screen has a bundle — otherwise broken artifacts pass silently.
- zod-less optional fields: models emit `null` for missing optionals — use `.optional().nullable()`.
- Models annotate component refs ("Card (highlighted)") and rename blueprint keys ("name"→"screen");
  normalization lives in `codegen/derive.ts` (`normalizeComponentRef`) and `stages/delta.ts`.
- Architecture/copy arrays need generous zod caps (copy ≤24) — 12 was too strict and burned corrective retries.

## Validation tooling
- `npx tsx script/pastel-e2e.ts` — full live E2E (needs DATABASE_URL + MERGE_GATEWAY_API_KEY).
- `npx tsx script/pastel-delta-probe.ts "Add an X screen"` — delta-only probe against the latest E2E project.
- `npx tsx script/verify-repro.ts <runId>` — offline incremental verification of a past run's files.
- Measured cost: ~1.3 credits full 4-screen run, ~0.3–0.6 credits delta run (2026-07-31).
