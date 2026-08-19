import test from "node:test";
import assert from "node:assert/strict";

// The deterministic suite runs with e2b OFF — esbuild verification still
// runs locally; the sandboxed smoke/render stages skip exactly as
// production would when e2b is unavailable. No external quota involved.
process.env.MAXI_DISABLE_E2B = "1";

import { startAgentLoop } from "../lib/maxi-agent/orchestrator";
import { subscribeToRun } from "../lib/maxi-agent/run-store";
import type { ModelChat } from "../lib/maxi-agent/lib/model-chat";
import type { MaxiEvent } from "../lib/maxi-agent/types";
import { copySet, type FileManifest } from "../lib/maxi-agent/lib/file-manifest";

import { blueprintFixture } from "./maxi-v25-blueprint.test";

/**
 * Maxi Agent v25 — the FULL pipeline with ZERO real model calls.
 *
 * The ModelChat injection point is the entire seam: the stub answers the
 * Direction call with a fixture blueprint, authors components/screens from
 * deterministic templates, and scores the advisory review. Everything else
 * is the production path — derive, data-gen, shell-gen, esbuild bundling,
 * the hard/advisory gate split, the manifest, and the fingerprint. e2b is
 * not configured here, so smoke + screenshots skip exactly as production
 * would when e2b is unavailable (esbuild verification still runs).
 */

// ── The stub chat ──────────────────────────────────────────────────────────

const PROP_SOURCE: Record<string, string> = {
  label: "{DATA.metrics[0].label}",
  value: "{DATA.metrics[0].value}",
  unit: "{DATA.metrics[0].unit}",
  delta: "{DATA.metrics[0].delta}",
  positive: "{DATA.metrics[0].positive}",
  rows: "{DATA.list.rows}",
  items: "{DATA.activity}",
  fields: "{DATA.detail.fields}",
  title: "{DATA.detail.title}",
  status: "{DATA.list.rows[0].status}",
  size: '"md"',
  variant: '"primary"',
};

const PROP_BY_TYPE: Record<string, string> = {
  string: "{DATA.brand.name}",
  number: "{7}",
  boolean: "{true}",
  array: "{DATA.list.rows}",
  object: "{DATA.detail}",
};

function parsePlannedComponents(user: string): Array<{ name: string; props: Array<{ name: string; type: string }> }> {
  const out: Array<{ name: string; props: Array<{ name: string; type: string }> }> = [];
  for (const m of user.matchAll(/^- (\w+) \[YOURS\]\([^)]*\): (.*?) — /gm)) {
    const props = [...m[2]!.matchAll(/(\w+)!?:([\w]+)/g)].map((p) => ({ name: p[1]!, type: p[2]! }));
    out.push({ name: m[1]!, props });
  }
  return out;
}

const COMPONENT_TEMPLATE = (name: string) => `export default function ${name}({ label = "Item", value = "0", unit = "", rows = [] }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}<span className="ml-1 text-sm text-muted-foreground">{unit}</span></p>
      {rows.length > 0 ? (
        <ul className="mt-2 divide-y divide-border">
          {rows.map((r) => <li key={r.id} className="py-2 text-sm text-foreground">{r.title}</li>)}
        </ul>
      ) : null}
    </div>
  );
}`;

const SCREEN_TEMPLATE = (id: string, nav: string, comps: Array<{ name: string; props: Array<{ name: string; type: string }> }>) => `import { useState } from "react";
import { NavAdapter, IconOf } from "../lib/shell.jsx";
import { DATA } from "../data.js";
${comps.map((c) => `import ${c.name} from "../components/${c.name}.jsx";`).join("\n")}

export default function ${id[0]!.toUpperCase()}${id.slice(1)}() {
  const [active, setActive] = useState("${id}");
  return (
    <NavAdapter nav="${nav}" activeId="${id}" onNavigate={setActive}>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-4xl font-semibold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {DATA.metrics[0].value}<span className="ml-2 text-base text-muted-foreground">{DATA.metrics[0].unit}</span>
        </h1>
${comps
  .map((c) => {
    const props = c.props
      .map((p) => {
        const src = PROP_SOURCE[p.name] ?? PROP_BY_TYPE[p.type] ?? "";
        return src ? `${p.name}=${src}` : "";
      })
      .filter(Boolean)
      .join(" ");
    return `        <${c.name} ${props} />`;
  })
  .join("\n")}
        <ul className="mt-6 divide-y divide-border">
          {DATA.list.rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-foreground">{row.title}</span>
              <span className="text-xs text-muted-foreground">{row.meta}</span>
            </li>
          ))}
        </ul>
        <IconOf name="chart" className="h-4 w-4 text-muted-foreground" />
      </div>
    </NavAdapter>
  );
}`;

function makeStubChat(directionJson: () => string): ModelChat & { authorCalls: number } {
  let authorCalls = 0;
  const chat: ModelChat = async (messages, opts) => {
    const user = messages.filter((m) => m.role === "user").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n");

    if (opts.model === "direction") return directionJson();

    if (opts.model === "author") {
      authorCalls++;
      const compMatch = user.match(/YOUR COMPONENT — (\w+)/);
      if (compMatch) return COMPONENT_TEMPLATE(compMatch[1]!);
      const screenMatch = user.match(/YOUR SCREEN — "([a-z-]+)"/);
      if (screenMatch) {
        const id = screenMatch[1]!;
        const nav = user.match(/<NavAdapter nav="([a-z+]+)"/)?.[1] ?? "sidebar";
        return SCREEN_TEMPLATE(id, nav, parsePlannedComponents(user));
      }
      throw new Error("stub chat: author call matched neither a component nor a screen");
    }

    if (opts.model === "review") {
      return JSON.stringify({
        score: 88,
        verdict: "polish",
        strengths: ["A committed concept with a real dominant moment."],
        improvements: ["Tighten the section rhythm."],
        summary: "Reads like a designed product, not a template.",
      });
    }

    if (opts.model === "repair") return COMPONENT_TEMPLATE("Button");
    throw new Error(`stub chat: unexpected model role ${opts.model}`);
  };
  return Object.defineProperty(chat, "authorCalls", { get: () => authorCalls }) as ModelChat & { authorCalls: number };
}

// ── Harness ────────────────────────────────────────────────────────────────

interface RunOutcome {
  events: MaxiEvent[];
  files: Record<string, string>;
  docs: Record<string, string>;
  activities: string[];
  chat: ModelChat & { authorCalls: number };
}

async function runPipeline(runId: string, directionJson: () => string, prompt: string): Promise<RunOutcome> {
  const chat = makeStubChat(directionJson);
  await startAgentLoop(runId, prompt, {}, undefined, undefined, undefined, { chat });

  const events: MaxiEvent[] = [];
  const stop = subscribeToRun(runId, (e) => events.push(e));
  stop();

  const files: Record<string, string> = {};
  const docs: Record<string, string> = {};
  for (const e of events) {
    if (e.type === "file" && e.file) files[e.file.path] = e.file.content;
    if (e.type === "doc" && e.doc) docs[e.doc.path] = e.doc.content;
  }
  const activities = events.filter((e) => e.type === "activity").map((e) => e.message ?? "");
  return { events, files, docs, activities, chat };
}

// ── The pipeline ───────────────────────────────────────────────────────────

test("pipeline: a full stubbed run produces a verified, gated, exported project", async () => {
  const outcome = await runPipeline("v25-pipeline-run-1", () => JSON.stringify(blueprintFixture()), "A running tracker for competitive runners");

  // 1. Completed cleanly — no error event, a done event.
  assert.ok(outcome.events.some((e) => e.type === "error") === false, `no error events: ${outcome.activities.filter((a) => a.startsWith("Sandbox error")).join("; ")}`);
  assert.ok(outcome.events.some((e) => e.type === "done"), "the run completed with a done event");

  // 2. The full output contract — every file individually copyable.
  for (const path of [
    "src/components/Button.jsx",
    "src/components/MetricCard.jsx",
    "src/components/ActivityList.jsx",
    "src/components/SplitTable.jsx",
    "src/screens/home.jsx",
    "src/screens/detail.jsx",
    "src/lib/shell.jsx",
    "src/data.js",
    "src/styles.css",
    "src/App.jsx",
    "package.json",
    "manifest.json",
    "README.md",
    ".build/home.js",
    ".build/detail.js",
  ]) {
    assert.ok(outcome.files[path], `file ${path} was generated and persisted`);
  }

  // 3. Screens verified by the real esbuild bundler (e2b smoke skipped cleanly).
  assert.ok(outcome.activities.some((a) => a.includes("bundled (esbuild)")), "esbuild verification ran");
  assert.ok(outcome.files[".build/home.js"]!.includes("createRoot"), "the browser bundle really bundled React");

  // 4. The hard gate PASSED (advisory review never blocks).
  const gate = JSON.parse(outcome.docs["docs/review/GateReport.json"]!);
  assert.equal(gate.passed, true, `hard gate clean — issues: ${JSON.stringify(gate.issues.slice(0, 5))}`);

  // 5. The advisory review ran once and is recorded, non-blocking.
  const advisory = JSON.parse(outcome.docs["docs/review/AdvisoryReview.json"]!);
  assert.equal(advisory.score, 88);
  assert.equal(advisory.estimated, false);

  // 6. The export manifest: dependency graph + copy sets.
  const manifest: FileManifest = JSON.parse(outcome.files["manifest.json"]!);
  assert.equal(manifest.entry, "src/App.jsx");
  const homeEntry = manifest.files.find((f) => f.path === "src/screens/home.jsx")!;
  assert.ok(homeEntry.deps.includes("src/lib/shell.jsx"));
  assert.ok(homeEntry.deps.includes("src/data.js"));
  assert.ok(homeEntry.deps.some((d) => d.startsWith("src/components/")));
  const copy = copySet(manifest, "src/screens/home.jsx");
  assert.ok(copy.includes("src/data.js") && copy.includes("src/lib/shell.jsx"), "copy-with-dependencies closure is complete");
  const buttonEntry = manifest.files.find((f) => f.path === "src/components/Button.jsx")!;
  assert.ok(buttonEntry.api, "component entries carry their API");

  // 7. The dataset is dense (the v24 sparse-list failure class is dead).
  const data = outcome.files["src/data.js"]!;
  const rowCount = (data.match(/"title":/g) ?? []).length;
  assert.ok(rowCount >= 6, `the generated list is dense (${rowCount} rows)`);

  // 8. Fingerprint + timing recorded.
  assert.ok(outcome.activities.some((a) => a.startsWith("Fingerprint:")), "the uniqueness fingerprint is recorded");
  const timing = JSON.parse(outcome.docs["docs/timing/TimingReport.json"]!);
  assert.ok(timing.wallSeconds > 0);
  assert.ok(timing.stages.some((s: { wave: number }) => s.wave === 0));
  assert.ok(timing.stages.some((s: { wave: number }) => s.wave === 1));

  // 9. Model-call discipline: 1 direction + 6 components + 2 screens + 1 review.
  assert.equal(outcome.chat.authorCalls, 8, "components and screens authored in the parallel batch");

  // 10. No repair was needed — the happy path spends zero repair calls.
  assert.ok(outcome.activities.every((a) => !a.startsWith("Polish:")), "no repair calls on a clean run");
});

test("pipeline: two different briefs produce two different design fingerprints", async () => {
  const a = await runPipeline("v25-pipeline-run-2a", () => JSON.stringify(blueprintFixture()), "A running tracker");
  const b = await runPipeline("v25-pipeline-run-2b", () => JSON.stringify(blueprintFixture(ALT_BLUEPRINT)), "A cabin rental marketplace");

  const fp = (o: RunOutcome) => o.activities.find((a) => a.startsWith("Fingerprint:"))!.split(":")[1]!.trim();
  const fa = fp(a);
  const fb = fp(b);
  assert.ok(fa && fb);
  assert.notEqual(fa, fb, "the anti-slop regression: different briefs → different designs");

  // Both runs still complete and pass the hard gate.
  for (const o of [a, b]) {
    assert.ok(o.events.some((e) => e.type === "done"));
    assert.equal(JSON.parse(o.docs["docs/review/GateReport.json"]!).passed, true);
  }
});

// ── The alternate brief (a different product, different concepts) ──────────

const ALT_BLUEPRINT = {
  brief: {
    title: "Cabin Index",
    productType: "cabin rental marketplace",
    mode: "browse",
    description: "A curated marketplace for design-forward forest cabins, from weekend escapes to month-long retreats.",
    audience: "Design-conscious remote workers",
    copyDirection: "Warm and specific — every cabin is a place with a name, a wood, and a view.",
    inspiration: { primary: "airbnb" },
  },
  concepts: [
    {
      name: "Forest Editorial",
      thesis: "A slow magazine about places: oversized serif headlines, generous margins, photography first, and a deep moss palette.",
      palette: {
        background: "#F7F6F1", foreground: "#23271F", card: "#FFFFFF", primary: "#3D6B35", primaryForeground: "#FFFFFF",
        accent: "#8C5A2B", accentForeground: "#FFFFFF", muted: "#EBE8DF", mutedForeground: "#5B5F53", border: "#D8D4C8", ring: "#3D6B35",
      },
      fonts: { display: "Playfair Display", body: "Source Sans 3" },
      density: "airy", cornerLanguage: "sharp", motion: "still",
      signatureMoves: ["oversized serif cabin names", "full-bleed photography bands"],
    },
    {
      name: "Trail Tech",
      thesis: "A precise outdoor instrument: signal orange on graphite, mono-spaced coordinates, and the confidence of a good GPS.",
      palette: {
        background: "#111315", foreground: "#E8EBED", card: "#191C1F", primary: "#F97316", primaryForeground: "#1F1005",
        accent: "#38BDF8", accentForeground: "#05131C", muted: "#23272B", mutedForeground: "#9AA3AB", border: "#2E343A", ring: "#F97316",
      },
      fonts: { display: "Archivo", body: "IBM Plex Sans" },
      density: "compact", cornerLanguage: "soft", motion: "lively",
      signatureMoves: ["coordinate-pair metadata", "signal-orange availability dots"],
    },
    {
      name: "Timber Warm",
      thesis: "Wood-warm and tactile: honeyed neutrals, soft planks of content, and corner radii that feel hand-sanded.",
      palette: {
        background: "#FBF6EE", foreground: "#33261A", card: "#FFFDF8", primary: "#9A5B2D", primaryForeground: "#FFFFFF",
        accent: "#4E6E58", accentForeground: "#FFFFFF", muted: "#F1E7D8", mutedForeground: "#6E5B48", border: "#E3D5C0", ring: "#9A5B2D",
      },
      fonts: { display: "Fraunces", body: "Nunito Sans" },
      density: "balanced", cornerLanguage: "pill", motion: "subtle",
      signatureMoves: ["hand-sanded pill cards", "honeyed price bands"],
    },
  ],
  chosenConcept: 0,
  screens: [
    { id: "home", intent: "The discovery surface: a hero cabin, the curated collection grid, and the weekend search.", nav: "topbar", dominantMoment: "The featured cabin's full-bleed photograph with its nightly price" },
    { id: "detail", intent: "One cabin: the gallery, the wood and view facts, the availability calendar, and the booking action.", nav: "topbar", dominantMoment: "The cabin name set in display serif over its hero photograph" },
  ],
  componentManifest: [
    { name: "Button", kind: "primitive", props: [{ name: "label", type: "string", required: true }, { name: "variant", type: "string", required: false }], intent: "A sanded-wood action control.", usedBy: ["home", "detail"] },
    { name: "CabinCard", kind: "component", props: [{ name: "title", type: "string", required: true }, { name: "subtitle", type: "string", required: true }, { name: "meta", type: "string", required: false }], intent: "One cabin as an editorial tile.", usedBy: ["home"] },
    { name: "StayCalendar", kind: "component", props: [{ name: "rows", type: "array", required: true }], intent: "Availability as warm day rows.", usedBy: ["detail"] },
    { name: "FactList", kind: "component", props: [{ name: "fields", type: "array", required: true }], intent: "The wood, the view, the sleep count.", usedBy: ["detail"] },
  ],
  dataSchema: {
    units: ["km", "nights", "%"],
    dateRange: { start: "2026-07-20", end: "2026-08-18" },
    people: [{ name: "Marta Lind", role: "Host" }],
    metrics: [
      { label: "Cabins live", value: "18", unit: "", delta: 5, positive: true },
      { label: "Avg stay", value: "3.2", unit: "nights", delta: 8, positive: true },
      { label: "Occupancy", value: "74", unit: "%", delta: 2, positive: true },
    ],
    list: {
      name: "Cabins",
      rows: [
        { title: "Mossgrove Cabin", subtitle: "Cedar and glass in the fir line", meta: "4 guests", status: "Available" },
        { title: "Larch Hollow", subtitle: "A woodstove and a black lake", meta: "2 guests", status: "Booked" },
      ],
    },
    detail: {
      title: "Mossgrove Cabin",
      fields: [
        { label: "Sleeps", value: "4 guests" },
        { label: "Wood", value: "Cedar" },
        { label: "View", value: "Fir line" },
        { label: "Nightly", value: "$210" },
      ],
    },
    activity: [
      { actor: "Marta Lind", action: "listed", target: "Mossgrove Cabin", time: "3d ago" },
      { actor: "Marta Lind", action: "confirmed", target: "Larch Hollow", time: "1d ago" },
      { actor: "Marta Lind", action: "replied to", target: "an inquiry", time: "5h ago" },
    ],
  },
  version: "25.0.0",
};
