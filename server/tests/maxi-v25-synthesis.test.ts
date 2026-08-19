import test from "node:test";
import assert from "node:assert/strict";

import { authorComponent, authorScreen, validateAuthoredFile } from "../lib/maxi-agent/agents/author";
import { repairFile, correctThemeViolations } from "../lib/maxi-agent/agents/repair";
import { a11yScan, splitIssues, densityNotes } from "../lib/maxi-agent/checks/hard-gate";
import { deriveBlueprint } from "../lib/maxi-agent/lib/blueprint-derive";
import { loadCompany } from "../lib/maxi-agent/knowledge/index";
import { generateDataset, composeDataJs } from "../lib/maxi-agent/lib/data-gen";
import { blueprintSchema, type ManifestComponent } from "../lib/maxi-agent/lib/blueprint";
import type { ModelChat } from "../lib/maxi-agent/lib/model-chat";

import { blueprintFixture } from "./maxi-v25-blueprint.test";

/**
 * Maxi Agent v25 — Wave-1 synthesis + Wave-3 polish, driven by a STUBBED
 * model chat. No network, no keys: the injectable ModelChat is the whole
 * test seam. These tests pin the deterministic contracts around the model:
 * validation, the corrective retry, the repair path, and the a11y gate.
 */

// ── Test context ───────────────────────────────────────────────────────────

async function buildContext() {
  const manifest = await loadCompany("stripe");
  const derivation = deriveBlueprint(blueprintSchema.parse(blueprintFixture()), manifest!);
  const dataset = generateDataset(derivation.blueprint, "synth-test").dataset;
  return {
    blueprint: derivation.blueprint,
    concept: derivation.concept,
    theme: derivation.theme,
    dataJs: composeDataJs(dataset),
    dataset,
  };
}

// ── Stub chat ──────────────────────────────────────────────────────────────

/** Props the stub screen passes, keyed by prop name (real DATA everywhere). */
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

function propSource(name: string, type: string): string {
  return PROP_SOURCE[name] ?? PROP_BY_TYPE[type] ?? "";
}

/** Parse the "- Name [YOURS](screens): prop!:type, ... — intent" API lines. */
function parsePlannedComponents(user: string): Array<{ name: string; props: Array<{ name: string; type: string }> }> {
  const out: Array<{ name: string; props: Array<{ name: string; type: string }> }> = [];
  for (const m of user.matchAll(/^- (\w+) \[YOURS\]\([^)]*\): (.*?) — /gm)) {
    const props = [...m[2]!.matchAll(/(\w+)!?:([\w]+)/g)].map((p) => ({ name: p[1]!, type: p[2]! }));
    out.push({ name: m[1]!, props });
  }
  return out;
}

const GOOD_COMPONENT = (name: string) => `export default function ${name}({ label = "Item", value = "0", unit = "", rows = [] }) {
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

const GOOD_SCREEN = (id: string, nav: string, comps: Array<{ name: string; props: Array<{ name: string; type: string }> }> = []) => `import { useState } from "react";
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
        const src = propSource(p.name, p.type);
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

/** A chat that answers components/screens correctly and can be made to fail once. */
function stubChat(opts: { failFirst?: "component" | "screen" } = {}): ModelChat & { calls: number } {
  let calls = 0;
  const chat: ModelChat = async (messages, chatOpts) => {
    calls++;
    const user = messages.filter((m) => m.role === "user").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n");
    const corrective = user.includes("failed deterministic verification");

    const compMatch = user.match(/YOUR COMPONENT — (\w+)/);
    if (compMatch) {
      if (opts.failFirst === "component" && !corrective) {
        return `export default function ${compMatch[1]}() {
  return <div style={{ color: "#FFD700" }} className="bg-blue-500 p-4">broken</div>;
}`;
      }
      return GOOD_COMPONENT(compMatch[1]!);
    }

    const screenMatch = user.match(/YOUR SCREEN — "([a-z-]+)"/);
    if (screenMatch) {
      const id = screenMatch[1]!;
      const nav = user.match(/<NavAdapter nav="([a-z+]+)"/)?.[1] ?? "sidebar";
      if (opts.failFirst === "screen" && !corrective) {
        return `export default function Broken() {
  return <div>no adapter, no data — a first draft that violates every screen contract</div>;
}`;
      }
      return GOOD_SCREEN(id, nav, parsePlannedComponents(user));
    }

    if (chatOpts.model === "direction") return "{}";
    if (chatOpts.model === "review") {
      return JSON.stringify({ score: 88, verdict: "polish", strengths: ["Strong concept."], improvements: ["Tighter rhythm."], summary: "A real point of view with polish left." });
    }
    if (chatOpts.model === "repair") return GOOD_COMPONENT("Button");
    throw new Error(`stub chat: unexpected call (${chatOpts.model})`);
  };
  return Object.defineProperty(chat, "calls", { get: () => calls }) as ModelChat & { calls: number };
}

// ── Component authoring ────────────────────────────────────────────────────

test("author: a component authored against the stub passes validation", async () => {
  const ctx = await buildContext();
  const spec = ctx.blueprint.componentManifest.find((c) => c.name === "MetricCard")!;
  const out = await authorComponent({ ...ctx, chat: stubChat() }, spec);
  assert.equal(validateAuthoredFile(out.code, "component").length, 0);
  assert.match(out.code, /export default function MetricCard/);
});

test("author: a contract-violating first draft triggers the corrective retry", async () => {
  const ctx = await buildContext();
  const chat = stubChat({ failFirst: "component" });
  const spec = ctx.blueprint.componentManifest.find((c) => c.name === "MetricCard")!;
  const out = await authorComponent({ ...ctx, chat }, spec);
  assert.ok(chat.calls >= 2, "the corrective retry ran");
  assert.equal(validateAuthoredFile(out.code, "component").length, 0, "the retry output is clean");
});

test("author: persistent violations surface as an error (never silent)", async () => {
  const ctx = await buildContext();
  const alwaysBad: ModelChat = async () => 'export default function X() { return <div style={{ color: "#FFD700" }}>bad</div>; }';
  const spec = ctx.blueprint.componentManifest.find((c) => c.name === "MetricCard")!;
  await assert.rejects(() => authorComponent({ ...ctx, chat: alwaysBad }, spec), /hex color literal/);
});

test("author: illegal imports are caught by validation", () => {
  const errors = validateAuthoredFile(
    'import dayjs from "dayjs";\nexport default function X() { return <div className="bg-card p-2">x</div>; }',
    "component",
  );
  assert.ok(errors.some((e) => e.includes("illegal import")));
});

// ── Screen authoring ───────────────────────────────────────────────────────

test("author: a screen mounts NavAdapter, imports DATA, and mounts planned components", async () => {
  const ctx = await buildContext();
  const screen = ctx.blueprint.screens[0]!;
  const chat = stubChat();
  const out = await authorScreen({ ...ctx, chat }, screen);
  assert.match(out.code, /<NavAdapter nav="sidebar"/);
  assert.match(out.code, /from "..\/data.js"/);
  assert.match(out.code, /<MetricCard /, "the planned component is mounted");
  assert.match(out.code, /<ActivityList rows=\{DATA\.list\.rows\} \/>/, "required array prop passes real DATA");
  assert.equal(validateAuthoredFile(out.code, "screen").length, 0);
});

test("author: a screen missing its planned components is retried into correctness", async () => {
  const ctx = await buildContext();
  const chat = stubChat({ failFirst: "screen" });
  const screen = ctx.blueprint.screens[0]!;
  const out = await authorScreen({ ...ctx, chat }, screen);
  assert.ok(chat.calls >= 2);
  assert.match(out.code, /<NavAdapter/);
});

test("author: a screen that never mounts planned components fails loudly", async () => {
  const ctx = await buildContext();
  // This chat returns a valid-looking screen that mounts NO components —
  // the manifest plans MetricCard + ActivityList on home.
  const lying: ModelChat = async (_messages, opts) => {
    assert.equal(opts.model, "author");
    return GOOD_SCREEN("home", "sidebar");
  };
  await assert.rejects(() => authorScreen({ ...ctx, chat: lying }, ctx.blueprint.screens[0]!), /never mounted/);
});

// ── Repair ─────────────────────────────────────────────────────────────────

test("repair: a failing file is repaired against the exact issues", async () => {
  const ctx = await buildContext();
  const chat = stubChat();
  const code = await repairFile({
    path: "src/screens/home.jsx",
    code: GOOD_SCREEN("home", "sidebar"),
    issues: ["horizontal overflow at 375px: the metric row cannot shrink"],
    theme: ctx.theme,
    conceptLine: "PaceLedger — Ledger Brutalist",
    screenshotDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
    chat,
  });
  assert.ok(code.includes("export default"));
  assert.ok(chat.calls >= 1);
});

test("repair: output that introduces violations throws instead of shipping", async () => {
  const ctx = await buildContext();
  const alwaysBad: ModelChat = async () => 'export default function X() { return <div style={{ color: "#FFD700" }}>still bad</div>; }';
  await assert.rejects(
    () =>
      repairFile({
        path: "src/components/Button.jsx",
        code: GOOD_COMPONENT("Button"),
        issues: ["something failed"],
        theme: ctx.theme,
        conceptLine: "PaceLedger",
        chat: alwaysBad,
      }),
    /introduced violations/,
  );
});

test("convergence: two same-class failures fall back to the deterministic path (v24 WS7, ported)", async () => {
  let attempts = 0;
  let fallbacks = 0;
  const DIRTY = 'export default function B() { return <button className="bg-primary" style={{ color: "#FFD700" }}>Go</button>; }';
  const CLEAN = 'export default function B() { return <button className="bg-primary text-primary-foreground">Go</button>; }';
  const HEX_VIOLATIONS = (code: string): string[] => {
    const hits = new Set<string>();
    for (const m of code.match(/[^'"\s]*#[0-9a-fA-F]{3,8}\b[^'"\s]*/g) ?? []) hits.add(m.trim());
    return [...hits];
  };
  const result = await correctThemeViolations({
    initialCode: DIRTY,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => {
      attempts++;
      return DIRTY;
    },
    fallback: async () => {
      fallbacks++;
      return CLEAN;
    },
  });
  assert.equal(attempts, 2);
  assert.equal(fallbacks, 1);
  assert.equal(result.usedFallback, true);
  assert.equal(HEX_VIOLATIONS(result.code).length, 0);
});

// ── Hard-gate checks ───────────────────────────────────────────────────────

test("a11y scan: an unidentified input is HARD; aria-label and labelled inputs pass", () => {
  const files = {
    "src/components/Input.jsx": 'export default function Input(props) { return <input className="border-input" {...props} />; }',
    "src/screens/home.jsx": `export default function Home() {
  return (
    <div>
      <input id="q" className="border-input" />
      <label htmlFor="q">Search</label>
      <input aria-label="Filter by status" className="border-input" />
      <img src="x.png" />
    </div>
  );
}`,
  };
  const issues = a11yScan(files);
  assert.equal(issues.filter((i) => i.severity === "high").length, 1, "exactly the unidentified input is high");
  assert.equal(issues[0]!.category, "a11y");
  assert.ok(issues.some((i) => i.severity === "medium" && i.description.includes("alt")));
});

test("gate split: high severity is hard, everything else is advisory", () => {
  const { hard, advisory } = splitIssues([
    { file: "a", severity: "high", category: "state", description: "crash" },
    { file: "b", severity: "medium", category: "density", description: "sparse" },
    { file: "c", severity: "low", category: "a11y", description: "polish" },
  ]);
  assert.equal(hard.length, 1);
  assert.equal(advisory.length, 2);
});

test("density notes: a screen that renders no list rows is flagged advisory", async () => {
  const ctx = await buildContext();
  const files: Record<string, string> = {
    "src/screens/home.jsx": 'import { DATA } from "../data.js";\nexport default function Home() { return <div className="p-4">{DATA.brand.name}</div>; }',
  };
  // No component with an array prop is mounted → advisory note expected.
  const notes = densityNotes(ctx.blueprint, files, undefined);
  assert.ok(notes.some((n) => n.category === "density" && n.description.includes("never renders DATA.list")));
  assert.ok(notes.every((n) => n.severity !== "high"), "density is advisory, never a blocker");
});
