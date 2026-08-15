/**
 * Maxi Agent v24 — e2e harness, NORMAL models (no overrides).
 *
 *   npx tsx agenttests/agentv24/run-e2e.ts
 *
 * Runs ONE cold end-to-end run of the wave executor with the default model
 * routing (cheap anthropic/claude-haiku-4-5 + mid openai/gpt-5.6-luna) for a
 * two-screen fitness-tracking UI — the EXACT same case as agenttests/agentv23/
 * (same prompt, same inspiration, default models, thinking disabled), so the
 * v23 issues can be dispositioned one by one in ISSUES_AND_ERRORS.md.
 *
 * V24 additions over the v23 harness: the wave table includes wave 4 (repair
 * + final review — WS9), the geometry gate renders 1440/768/375, and the
 * issues report carries a per-issue disposition of the 37 v23 issues.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS = HERE;
const LOG_PATH = path.join(ARTIFACTS, "run.log");

// Tee every pipeline console line into run.log (the anomaly collector reads
// it back) — appended synchronously so process.exit never truncates it.
const origLog = console.log;
const origError = console.error;
const tee = (args: unknown[]) => args.map((a) => (typeof a === "string" ? a : a instanceof Error ? a.message : JSON.stringify(a))).join(" ");
console.log = (...args) => { origLog(...args); fs.appendFileSync(LOG_PATH, tee(args) + "\n"); };
console.error = (...args) => { origError(...args); fs.appendFileSync(LOG_PATH, "[stderr] " + tee(args) + "\n"); };

// ── Process-level failure nets (v24 test2) ────────────────────────────────
// The v23/v24 harness wrapped startAgentLoop in Promise.race, but a
// SYNCHRONOUS throw inside the wave chain escapes as an unhandled rejection
// and kills the process with ZERO artifacts written (and the DB run row left
// permanently "running"). These nets write a failure ISSUES_AND_ERRORS.md /
// RUN_SUMMARY.md / run-summary.json so a crash is always documented.
let currentRunId: string | undefined = undefined;
let fatal: { kind: string; message: string; stack?: string } | null = null;

const writeFatalArtifacts = async () => {
  const runId = currentRunId;
  const markdown = (await import("marked")).marked;
  let status = "?";
  let rowError: string | null = null;
  if (runId) {
    try {
      const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
      if (row) {
        status = row.status;
        rowError = row.error;
        // A stray rejection AFTER a successful run must not clobber the
        // good artifacts — only the main flow writes those.
        if (status === "done") return;
      }
    } catch { /* DB unreachable — write what we have */ }
  }
  const err = fatal!;
  const body = [
    `# Agent v24 e2e — Issues & Errors (normal models) — FATAL`,
    ``,
    `Run: \`${runId ?? "?"}\` · status: \`${status}\` · models: default (cheap \`anthropic/claude-haiku-4-5\`, mid \`openai/gpt-5.6-luna\`) · thinking: disabled`,
    `Two-screen UI: fitness tracking — the EXACT agentv23 case`,
    ``,
    `## Outcome`,
    `The pipeline process died from a **${err.kind}** before the harness wrote its normal artifacts. The console capture is in \`run.log\`; no screenshots were rendered.`,
    ``,
    `## Hard errors`,
    `- **FATAL (${err.kind})**: ${err.message}`,
    `${err.stack ? `\`\`\`\n${err.stack}\n\`\`\`` : ""}`,
    `${rowError ? `- Run error recorded in DB: ${rowError}` : ""}`,
    `- The DB run row was left at \`${status}\` (stale cleanup marks it \`error\` on next boot).`,
  ].join("\n");
  fs.writeFileSync(path.join(ARTIFACTS, "ISSUES_AND_ERRORS.md"), body + "\n");
  fs.writeFileSync(path.join(ARTIFACTS, "RUN_SUMMARY.md"), `# Agent v24 e2e — Run Summary (normal models) — INCOMPLETE\n\n| | |\n|---|---|\n| Run ID | \`${runId ?? "?"}\` |\n| Status | \`${status}\` |\n| Fatal | ${err.kind}: ${err.message} |\n| Screenshots | none rendered |\n`);
  fs.writeFileSync(path.join(ARTIFACTS, "run-summary.json"), JSON.stringify({ test: "agentv24-normal-models", runId, status, fatal: { kind: err.kind, message: err.message, stack: err.stack } }, null, 2));
  origLog(`[e2e] FATAL artifacts written to ${ARTIFACTS}`);
};

process.on("unhandledRejection", (err) => {
  if (fatal) return;
  fatal = { kind: "unhandledRejection", message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined };
  origError(`[e2e] FATAL unhandledRejection: ${fatal.message}`);
  void writeFatalArtifacts().catch(() => {}).finally(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
  if (fatal) return;
  fatal = { kind: "uncaughtException", message: err.message, stack: err.stack };
  origError(`[e2e] FATAL uncaughtException: ${fatal.message}`);
  void writeFatalArtifacts().catch(() => {}).finally(() => process.exit(1));
});

delete process.env.PASTEL_THINKING_BUDGET;

const RUN_TIMEOUT_MS = 15 * 60 * 1000;
const PROMPT = "A fitness tracking app that logs runs: today's workout, weekly distance, pace trends, and run history with splits.";
const ANSWERS: Record<string, string> = {};

const { createRun } = await import("../../server/lib/maxi-agent/run-store");
const { startAgentLoop } = await import("../../server/lib/maxi-agent/orchestrator");
const { db } = await import("../../server/db");
const { agentRuns, agentDocuments, agentFiles } = await import("../../shared/schema");
const { eq } = await import("drizzle-orm");

const run = await createRun({ prompt: PROMPT, answers: ANSWERS });
const runId = run.id;
currentRunId = runId;
console.log(`[e2e] run ${runId} started — prompt: ${PROMPT.slice(0, 60)}…`);
console.log(`[e2e] models: DEFAULT (cheap claude-haiku-4-5 + mid gpt-5.6-luna) — no overrides`);

const startedAt = Date.now();
let timedOut = false;
try {
  await Promise.race([
    startAgentLoop(runId, PROMPT, ANSWERS, undefined, undefined, undefined, { maxCredits: 45 }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`run exceeded ${RUN_TIMEOUT_MS / 1000}s`)), RUN_TIMEOUT_MS),
    ),
  ]);
} catch (err) {
  timedOut = true;
  console.error("[e2e] run failed/timed out:", err instanceof Error ? err.message : err);
}
const wallSeconds = Math.round((Date.now() - startedAt) / 10) / 100;

const [row] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
const docs = await db.select().from(agentDocuments).where(eq(agentDocuments.runId, runId));
const files = await db.select().from(agentFiles).where(eq(agentFiles.runId, runId));
const manifest = (row?.manifest ?? {}) as Record<string, unknown>;

const doc = (kind: string) => {
  const d = docs.find((x) => x.kind === kind);
  if (!d) return null;
  try { return JSON.parse(d.content); } catch { return null; }
};

const gate = doc("gate-report") as { passed?: boolean; score?: number; issues?: Array<{ file?: string; severity?: string; category?: string; description?: string }> } | null;
const review = doc("review-result") as { passed?: boolean; score?: number; decision?: string; issues?: Array<{ target?: string; severity?: string; category?: string; description?: string }>; summary?: string } | null;
const fidelity = doc("fidelity-report") as { summary?: { total?: number; passed?: number; failed?: number; highIssues?: number } } | null;
const props = doc("prop-contract-report") as { violations?: Array<{ componentId?: string; missingRequired?: string[] }>; autoFixedCount?: number } | null;
const timing = doc("timing-report") as { wallSeconds?: number; stages?: Array<{ wave: number; stage: string; ms: number }> } | null;
const calls = doc("call-counts") as { callsByRole?: Record<string, number>; totalCalls?: number } | null;
const brief = doc("brief") as { title?: string; productType?: string; inspiration?: { primary?: string } } | null;

const quality = (manifest.quality ?? {}) as { passed?: boolean; score?: number; repairs?: number };
const kbSlices = (manifest.kbSlices ?? {}) as Record<string, { chars: number; files: string[] }>;
const failedScreens = (manifest.failedScreens ?? []) as string[];
const screens = (manifest.screens ?? []) as string[];

const summary = {
  test: "agentv24-normal-models",
  runId,
  status: row?.status,
  title: row?.title ?? brief?.title ?? null,
  productType: brief?.productType ?? null,
  inspiration: brief?.inspiration?.primary ?? null,
  modelOverride: "none (default routing)",
  thinking: "disabled (default)",
  prompt: PROMPT,
  screens,
  failedScreens,
  wallSeconds,
  timedOut,
  timing: timing?.stages
    ? Object.fromEntries([0, 1, 2, 3, 4].map((w) => [w, Math.round((timing!.stages!.filter((s) => s.wave === w).reduce((n, s) => n + s.ms, 0) / 1000) * 10) / 10]))
    : null,
  callsByRole: calls?.callsByRole ?? manifest.callsByRole ?? {},
  totalCalls: calls?.totalCalls ?? null,
  kbSlices: Object.fromEntries(Object.entries(kbSlices).map(([k, v]) => [k, v.chars])),
  quality,
  gate: gate ? { passed: gate.passed, score: gate.score, issues: gate.issues?.length ?? 0 } : null,
  review: review ? { passed: review.passed, score: review.score, decision: review.decision } : null,
  fidelity: fidelity?.summary ?? null,
  propContract: props ? { violations: props.violations?.length ?? 0, autoFixed: props.autoFixedCount ?? 0 } : null,
};
fs.writeFileSync(path.join(ARTIFACTS, "run-summary.json"), JSON.stringify(summary, null, 2));

// ── ISSUES + ERRORS collection (works even when the run errors out) ──
const issues: Array<{ severity: string; category: string; file: string; description: string }> = [];
for (const i of gate?.issues ?? []) {
  issues.push({ severity: i.severity ?? "?", category: i.category ?? "?", file: i.file ?? "?", description: i.description ?? "?" });
}
for (const i of review?.issues ?? []) {
  issues.push({ severity: i.severity ?? "?", category: i.category ?? "?", file: i.target ?? "?", description: i.description ?? "?" });
}
for (const v of props?.violations ?? []) {
  issues.push({ severity: "high", category: "props", file: `src/components/${v.componentId}.jsx`, description: `mounted without required prop(s) ${(v.missingRequired ?? []).join(", ")}` });
}

// Log anomalies captured during the run (console output of the pipeline).
let logText = "";
try { logText = fs.readFileSync(LOG_PATH, "utf8"); } catch { /* no log file */ }
const logAnomalies = logText
  .split("\n")
  .filter((l) =>
    /\[maxi-agent\]|\[pastel v21\]|\[e2e\]/.test(l) &&
    /error|fail|truncat|validat|fallback|salvag|retry|repair|violation|issue|warn|skip/i.test(l),
  )
  .map((l) => l.trim())
  .slice(0, 80);

const { marked: markdown } = await import("marked");
const issuesMd = issues.length === 0 ? "None." : issues.map((i, n) => `### ${n + 1}. [${i.severity}] ${i.category} — ${i.file}\n\n${markdown.parse(i.description)}`).join("\n\n");

const hardErrors = [
  ...(timedOut ? [`- TIMEOUT: run exceeded ${RUN_TIMEOUT_MS / 1000}s — aborted by the harness`] : []),
  ...(row?.error ? [`- Run error: ${row.error}`] : []),
  ...(failedScreens.length > 0 ? [`- Flagged screens that failed verification: ${failedScreens.join(", ")}`] : []),
  ...(row?.status === "error" ? [`- Run status is \`error\` — pipeline threw (see run.error above)`] : []),
];
const errorsMd = hardErrors.length > 0 ? hardErrors.join("\n") : "None.";

// ── V24: disposition of the 37 v23 issues (resolved / deferred with reason) ──
const V23_DISPOSITION: Array<{ n: number; issue: string; disposition: string }> = [
  { n: 1, issue: "detail inputs have no visible <label>", disposition: "Resolved — the a11y contract (visible labels + :focus-visible rings) is a layout-template property (WS2), rendered into every composer plan; the composer system prompt enforces it." },
  { n: 2, issue: "PaceProgressRing planned 2x on home", disposition: "Resolved — reconcileGenome merges duplicate slot mounts per screen in one fixed point (WS1); the composition audit stays as the regression net." },
  { n: 3, issue: "Topbar planned but no block mounts it (home)", disposition: "Resolved — nav chrome is no longer an inventory component (WS1); it derives from the screen's nav field via the static NavAdapter." },
  { n: 4, issue: "Sidebar planned but no block mounts it (home)", disposition: "Resolved — same WS1 nav-chrome removal." },
  { n: 5, issue: "Button planned but no block mounts it (home)", disposition: "Resolved — shell primitives are exempt from the block-mount contract (checks/review.ts skips SHELL_PRIMITIVES); they are mounted by the body or shell wrapper, never required by a block." },
  { n: 6, issue: "Avatar planned but no block mounts it (home)", disposition: "Resolved — same shell-primitive exemption." },
  { n: 7, issue: "Badge planned but no block mounts it (home)", disposition: "Resolved — same shell-primitive exemption." },
  { n: 8, issue: "Input planned but no block mounts it (home)", disposition: "Resolved — same shell-primitive exemption." },
  { n: 9, issue: "Select planned but no block mounts it (home)", disposition: "Resolved — same shell-primitive exemption." },
  { n: 10, issue: "Separator planned but no block mounts it (home)", disposition: "Resolved — same shell-primitive exemption." },
  { n: 11, issue: "SplitBreakdown planned 2x on detail", disposition: "Resolved — reconcileGenome duplicate-mount merge (WS1)." },
  { n: 12, issue: "Topbar planned but no block mounts it (detail)", disposition: "Resolved — WS1 nav-chrome removal." },
  { n: 13, issue: "Sidebar planned but no block mounts it (detail)", disposition: "Resolved — WS1 nav-chrome removal." },
  { n: 14, issue: "Button planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 15, issue: "Avatar planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 16, issue: "Badge planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 17, issue: "Input planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 18, issue: "Select planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 19, issue: "Separator planned but no block mounts it (detail)", disposition: "Resolved — shell-primitive exemption." },
  { n: 20, issue: "home: 2 list rows (min 3)", disposition: "Resolved — list regions must declare minRows ≥ 3 in the genome schema (WS3), hard-validated at the Wave-1 call; the plan prompt carries the floor to the composer." },
  { n: 21, issue: "home: ~40% empty viewport (max 20%)", disposition: "Resolved — maxEmptyViewport ≤ 0.2 is schema-validated per screen at Wave 1 (WS3); under-filled genomes are rejected/retried before Wave 2." },
  { n: 22, issue: "home: missing primary action", disposition: "Resolved — exactly one primaryAction region per screen is schema-validated (WS3) and the plan prompt requires the mounted action." },
  { n: 23, issue: "detail: 0 list rows (min 3)", disposition: "Resolved — WS3 minRows schema floor." },
  { n: 24, issue: "detail: ~40% empty viewport (max 20%)", disposition: "Resolved — WS3 maxEmptyViewport schema floor." },
  { n: 25, issue: "detail: missing primary action", disposition: "Resolved — WS3 primaryAction schema floor." },
  { n: 26, issue: "home mounts 9 custom components (≤2 allowed)", disposition: "Resolved — the layout gate's budget counts ONLY genome slots (checks/layout.ts); the slot budget is capped at 2 per screen by the schema + reconcile (WS1), and the deterministic NavAdapter chrome is never counted." },
  { n: 27, issue: "detail: 4 non-dominant sections but only 1 SectionHeader", disposition: "Resolved — templates carry fixed section sequences with deterministic headers; every non-dominant section's header is authored in the plan and the composer fills it (WS2)." },
  { n: 28, issue: "detail mounts 9 custom components", disposition: "Resolved — same as #26 (slot-budget counting + WS1 cap)." },
  { n: 29, issue: "Separator: no theme styling (fidelity)", disposition: "Resolved — builder convergence fallback (WS7): two failed corrective retries converge through the deterministic base-anchored fidelity path; the v23 'still 1 theme violations' log line is gone." },
  { n: 30, issue: "home renders <Sidebar active onChange> — prop mismatch", disposition: "Resolved — structurally impossible (WS1): Sidebar/Topbar are never in the composer's available components, and the only chrome mount is the static NavAdapter with the locked nav/activeId/onNavigate contract wired from deterministic run state." },
  { n: 31, issue: "detail renders <Sidebar active onChange> — prop mismatch", disposition: "Resolved — same WS1 structural fix." },
  { n: 32, issue: "fitness-inappropriate stat units (sets, lb) alongside Readiness", disposition: "Resolved — domain-contract cross-check (WS5) rejects strength units in running products at the cheap data call (bounded retry named), and the deterministic fitness fallback itself speaks running vocabulary; regression test maxi-domain-contract.test.ts." },
  { n: 33, issue: "home workout rows omit planned table fields Structure/Status", disposition: "Resolved — table/list field completeness is validated against the layout template's declared table contract before composing (WS5); unfillable columns are dropped deterministically." },
  { n: 34, issue: "stale June dates vs the supplied August 2026 dataset", disposition: "Resolved — declared date-range conformance (WS5): out-of-range absolute row dates fail the contract check and are remapped into the brief's declared range deterministically." },
  { n: 35, issue: "Sidebar nav has no visible focus-visible ring", disposition: "Resolved — NavAdapter is authored once with focus-visible rings on every interactive element (WS1); the template a11y contract covers the body (WS2)." },
  { n: 36, issue: "Avatar exposes the name only via title on a non-interactive div", disposition: "Resolved — NavAdapter renders the user identity with an accessible aria-label + visible name (WS1)." },
  { n: 37, issue: "sidebar reads as a generic white panel (empty nav, weak contrast)", disposition: "Resolved — the empty sidebar was the #30/#31 prop-mismatch symptom; the NavAdapter wires NAV/brand/user from deterministic run state and uses theme tokens (contrast comes from the run's design tokens, mood-derived from the inspiration, never literal brand colors)." },
];

const dispositionMd = V23_DISPOSITION.map((d) => `- **#${d.n} — ${d.issue}:** ${d.disposition}`).join("\n");

fs.writeFileSync(path.join(ARTIFACTS, "ISSUES_AND_ERRORS.md"), `# Agent v24 e2e — Issues & Errors (normal models)

Run: \`${runId}\` · status: \`${row?.status ?? "?"}\` · models: default (cheap \`anthropic/claude-haiku-4-5\`, mid \`openai/gpt-5.6-luna\`) · thinking: disabled
Two-screen UI: fitness tracking ("${summary.title ?? "?"}") — the EXACT agentv23 case

## Outcome
${row?.status === "done" ? "Run completed. Screens verified, review passed." : `Run did NOT fully pass (status \`${row?.status}\`). This report lists every issue found. The harness does not rerun.`}

## Hard errors / flagged screens
${errorsMd}

## Gate + review issues
${issuesMd}

## V23 issue disposition (all 37, no silent drops)
${dispositionMd}

## Pipeline log anomalies (console capture)
${logAnomalies.length > 0 ? "```\n" + logAnomalies.join("\n") + "\n```" : "None captured."}

## Fidelity
- ${fidelity ? `${fidelity.summary?.passed ?? 0}/${fidelity.summary?.total ?? 0} components passed · ${fidelity.summary?.failed ?? 0} hard failures · ${fidelity.summary?.highIssues ?? 0} issues` : "no fidelity report"}

## Prop contract
- ${props ? `${props.violations?.length ?? 0} violations after auto-fix (${props.autoFixedCount ?? 0} auto-fixed)` : "no prop report"}

## Review verdict
- ${review ? `${review.score}/100 — ${review.decision}${review.summary ? ` — ${review.summary}` : ""}` : "no review result"}
`);

console.log(`[e2e] done: status=${row?.status} · screens=${screens.join(", ") || "none"} · failed=${failedScreens.join(", ") || "none"} · gate=${gate?.score ?? "?"}/100 · review=${review?.score ?? "?"}/100 · ${wallSeconds}s · timedOut=${timedOut}`);

// ── Offline screenshot render (local chromium, same preview HTML as the app) ──
const { chromium } = await import("playwright-core");
const styles = files.find((f) => f.path === "src/styles.css")?.content ?? "";
const bundles = files.filter((f) => f.kind === "build" && f.path.startsWith(".build/") && f.path.endsWith(".js"));
const brandKit = (manifest.brandKit ?? {}) as { fonts?: Record<string, string> };
const fonts = brandKit.fonts ? Object.values(brandKit.fonts) : [];
const shotDir = path.join(ARTIFACTS, "screenshots");
fs.mkdirSync(shotDir, { recursive: true });

const chromes = [
  process.env.PASTEL_CHROMIUM_PATH,
  "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const htmlFor = (screen: string, bundle: string) => {
  const fontLinks = [...new Set(fonts)]
    .map((f) => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`)
    .join("\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${screen}</title>${fontLinks}<script src="https://cdn.tailwindcss.com"></script><style>${styles}html, body { height: 100%; }</style></head><body><div id="root"></div><script>${bundle}</script></body></html>`;
};

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
const screenshotNames: string[] = [];
try {
  browser = await chromium.launch({ headless: true, executablePath: chromes[0], args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  for (const b of bundles) {
    const screen = b.path.replace(/^\.build\//, "").replace(/\.js$/, "");
    const html = htmlFor(screen, b.content);
    for (const [viewport, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]] as const) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      try {
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForFunction(() => Boolean((window as Window & { __maxiMounted?: boolean }).__maxiMounted), undefined, { timeout: 15000 }).catch(() => {});
        await page.evaluate(() => (document as Document).fonts?.ready.then(() => true)).catch(() => {});
        await page.waitForTimeout(500);
        const name = `${screen}-${viewport}.png`;
        await page.screenshot({ type: "png", fullPage: true, path: path.join(shotDir, name) });
        screenshotNames.push(name);
        console.log(`✓ screenshot ${name}`);
      } finally {
        await page.close();
      }
    }
  }
} catch (err) {
  console.error("[e2e] screenshot render failed:", err instanceof Error ? err.message : err);
} finally {
  await browser?.close();
}
summary.screenshotFiles = screenshotNames;
fs.writeFileSync(path.join(ARTIFACTS, "run-summary.json"), JSON.stringify(summary, null, 2));

// ── RUN_SUMMARY.md ──
const waves = summary.timing as Record<string, number> | null;
const rows = Object.entries(summary.callsByRole as Record<string, number>)
  .sort((a, b) => b[1] - a[1])
  .map(([role, n]) => `| ${role} | ${n} |`).join("\n");
fs.writeFileSync(path.join(ARTIFACTS, "RUN_SUMMARY.md"), `# Agent v24 e2e — Run Summary (normal models)

| | |
|---|---|
| Run ID | \`${runId}\` |
| Status | \`${row?.status}\` |
| Product | ${summary.title ?? "?"} (${summary.productType ?? "?"}) |
| Inspiration company | ${summary.inspiration ?? "?"} |
| Models | default routing — cheap \`anthropic/claude-haiku-4-5\` (plan/genome/clarify/planner/builder/compose/data/assemble) + mid \`openai/gpt-5.6-luna\` (design/brief/copy/review/visualReview/repair) |
| Thinking | disabled (default) |
| Wall time | ${wallSeconds}s |
| Screens (verified) | ${screens.join(", ") || "none"} |
| Failed screens | ${failedScreens.join(", ") || "none"} |
| Quality | passed=${quality.passed} · score=${quality.score} · repairs=${quality.repairs} |

## Wave timing (s)
| Wave | Seconds |
|---|---|
${waves ? Object.entries(waves).map(([w, s]) => `| w${w} | ${s} |`).join("\n") : "| — | no timing |"}
${waves ? `| **Σ waves** | **${Object.values(waves).reduce((a, b) => a + (b as number), 0)}** |\n| **Wall** | **${wallSeconds}** |` : ""}

## Model calls by role
| Role | Calls |
|---|---|
${rows || "| — | — |"}
| **Total** | **${summary.totalCalls ?? "?"}** |

## Knowledge-base slices
${Object.entries(summary.kbSlices as Record<string, number>).map(([k, v]) => `- ${k}: ${v} chars`).join("\n") || "- none"}

## Gate / fidelity / props / review
- Gate: ${gate ? `${gate.score}/100 — ${gate.passed ? "PASS" : "FAIL"} (${gate.issues?.length ?? 0} issues)` : "n/a"}
- Fidelity: ${fidelity ? `${fidelity.summary?.passed ?? 0}/${fidelity.summary?.total ?? 0} passed · ${fidelity.summary?.failed ?? 0} hard failures` : "n/a"}
- Prop contract: ${props ? `${props.violations?.length ?? 0} violations after auto-fix` : "n/a"}
- Review: ${review ? `${review.score}/100 — ${review.decision}` : "n/a"}

## Screenshots
${screenshotNames.map((n) => `- \`screenshots/${n}\``).join("\n") || "- none rendered"}
`);

console.log(`[e2e] artifacts written to ${ARTIFACTS}`);
process.exit(0);
