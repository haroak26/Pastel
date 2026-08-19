/**
 * Maxi Agent v25 e2e harness — the agenttests protocol.
 *
 *   MERGE_GATEWAY_API_KEY=... E2B_API_KEY=... DATABASE_URL=... \
 *     npx tsx agenttests/agentv25/run-e2e.ts "<brief>"
 *
 * Drives ONE real run through the production engine and writes the same
 * artifact set the v24 protocol produced (RUN_SUMMARY.md, ISSUES_AND_ERRORS.md,
 * run-summary.json, screenshots/) so quality trends stay comparable across
 * versions. The release gate itself is server/tests/maxi-e2e-v25.test.ts.
 */

import fs from "node:fs";
import path from "node:path";

const BRIEF = process.argv[2] ?? "A running tracker for competitive runners that logs sessions and shows coach-grade pace metrics";
const OUT_DIR = path.resolve(import.meta.dirname, process.argv[3] ?? ".");

interface CapturedEvent {
  type: string;
  message?: string;
  phase?: string;
  status?: string;
  title?: string;
  screens?: string[];
  file?: { path: string; content: string };
  doc?: { path: string; content: string };
}

async function main() {
  fs.mkdirSync(path.join(OUT_DIR, "screenshots"), { recursive: true });

  const { startAgentLoop } = await import("../../server/lib/maxi-agent/engine");
  const { subscribeToRun } = await import("../../server/lib/maxi-agent/run-store");
  const { createRun } = await import("../../server/lib/maxi-agent/run-store");

  const run = await createRun({ prompt: BRIEF, answers: {} });
  const events: CapturedEvent[] = [];
  const stop = subscribeToRun(run.id, (e) => events.push(e as unknown as CapturedEvent));
  const consoleLines: string[] = [];
  const tee = (chunk: string) => consoleLines.push(chunk);
  process.stdout.write = ((orig) => (chunk: unknown, ...rest: unknown[]) => {
    tee(String(chunk));
    return orig.call(process.stdout, chunk, ...(rest as []));
  })(process.stdout.write.bind(process.stdout));
  process.stderr.write = ((orig) => (chunk: unknown, ...rest: unknown[]) => {
    tee(String(chunk));
    return orig.call(process.stderr, chunk, ...(rest as []));
  })(process.stderr.write.bind(process.stderr));

  const started = Date.now();
  try {
    await startAgentLoop(run.id, BRIEF, {});
  } finally {
    stop();
  }
  const wallSeconds = (Date.now() - started) / 1000;

  fs.writeFileSync(path.join(OUT_DIR, "run.log"), consoleLines.join(""));

  const messages = events.filter((e) => e.type === "activity").map((e) => e.message ?? "");
  const files = events.filter((e) => e.type === "file").map((e) => e.file!);
  const docs = events.filter((e) => e.type === "doc").map((e) => e.doc!);
  const gate = docs.find((d) => d.path === "docs/review/GateReport.json");
  const advisory = docs.find((d) => d.path === "docs/review/AdvisoryReview.json");
  const timing = docs.find((d) => d.path === "docs/timing/TimingReport.json");
  const callCounts = docs.find((d) => d.path === "docs/timing/CallCounts.json");
  const done = events.find((e) => e.type === "done") as { result?: { screens?: string[]; failedScreens?: string[] } } | undefined;
  const error = events.find((e) => e.type === "error") as { message?: string } | undefined;
  const fingerprint = messages.find((m) => m.startsWith("Fingerprint:"))?.split(":")[1]?.trim() ?? null;
  const title = (events.find((e) => e.type === "title") as { title?: string } | undefined)?.title ?? BRIEF;

  // Screenshots from the run's final renders are stored as .build bundles;
  // the sandbox PNGs stream through the SSE preview route at runtime — the
  // harness records the bundle list + gate verdicts instead.
  const waveSeconds = (wave: number): number => {
    if (!timing) return 0;
    const report = JSON.parse(timing.content) as { stages: Array<{ wave: number; ms: number }> };
    return report.stages.filter((s) => s.wave === wave).reduce((n, s) => n + s.ms, 0) / 1000;
  };

  const models = {
    clarify: process.env.PASTEL_MODEL_CLARIFY ?? null,
    direction: process.env.PASTEL_MODEL_DIRECTION ?? null,
    author: process.env.PASTEL_MODEL_AUTHOR ?? null,
    review: process.env.PASTEL_MODEL_REVIEW ?? null,
    repair: process.env.PASTEL_MODEL_REPAIR ?? null,
  };
  const costLine = messages.find((m) => m.startsWith("Run cost:"));
  const costMatch = costLine?.match(/Run cost: \$([\d.]+) \(([\d.]+) credits\) across (\d+) model call/);
  const cost = costMatch
    ? { dollars: Number(costMatch[1]), credits: Number(costMatch[2]), calls: Number(costMatch[3]) }
    : null;

  const summary = {
    runId: run.id,
    brief: BRIEF,
    title,
    status: error ? "error" : done ? (done.result?.failedScreens?.length ? "done_needs_review" : "done") : "unknown",
    wallSeconds: Math.round(wallSeconds * 10) / 10,
    models,
    cost,
    screens: done?.result?.screens ?? [],
    failedScreens: done?.result?.failedScreens ?? [],
    gate: gate ? { passed: (JSON.parse(gate.content) as { passed: boolean }).passed } : null,
    advisory: advisory ? (JSON.parse(advisory.content) as { score: number; verdict: string }) : null,
    calls: callCounts ? (JSON.parse(callCounts.content) as { totalCalls: number; callsByRole: Record<string, number> }) : null,
    fingerprint,
    waves: { w0: waveSeconds(0), w1: waveSeconds(1), w2: waveSeconds(2), w3: waveSeconds(3), w4: waveSeconds(4) },
    fileCount: files.length,
    docCount: docs.length,
    screenshotFiles: [] as string[],
  };

  // ── Offline screenshot render (local chromium, same preview HTML as the app) ──
  const { chromium } = await import("playwright-core");
  const styles = files.find((f) => f.path === "src/styles.css")?.content ?? "";
  const bundles = files.filter((f) => f.path.startsWith(".build/") && f.path.endsWith(".js"));
  const manifest = docs.find((d) => d.path === "manifest.json");
  const fonts: string[] = (() => {
    if (!manifest) return [];
    try {
      const m = JSON.parse(manifest.content) as { brandKit?: { fonts?: Record<string, string> } };
      return m.brandKit?.fonts ? Object.values(m.brandKit.fonts) : [];
    } catch {
      return [];
    }
  })();

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

  const shotDir = path.join(OUT_DIR, "screenshots");
  fs.mkdirSync(shotDir, { recursive: true });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
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
          summary.screenshotFiles.push(name);
          console.log(`✓ screenshot ${name}`);
        } finally {
          await page.close();
        }
      }
    }
  } catch (err) {
    console.error("[v25-e2e] screenshot render failed:", err instanceof Error ? err.message : err);
  } finally {
    await browser?.close();
  }

  fs.writeFileSync(path.join(OUT_DIR, "run-summary.json"), JSON.stringify(summary, null, 2));

  const issues = gate ? (JSON.parse(gate.content) as { issues: Array<{ severity: string; category: string; file?: string; description: string }> }).issues : [];
  const issueLines = issues.map((i, n) => `${n + 1}. [${i.severity}] ${i.category}${i.file ? ` — ${i.file}` : ""}: ${i.description}`).join("\n\n");

  fs.writeFileSync(
    path.join(OUT_DIR, "ISSUES_AND_ERRORS.md"),
    [
      `# Agent v25 e2e — Issues & Errors`,
      "",
      `Run: \`${run.id}\` · brief: ${BRIEF} · wall: ${summary.wallSeconds}s · models: ${Object.entries(summary.models).filter(([, m]) => m).map(([r, m]) => `${r}=${m}`).join(", ") || "default"}`,
      error ? `\n## Fatal error\n\n${error.message}` : "",
      issues.length > 0 ? `## Gate issues (${issues.length})\n\n${issueLines}` : "## Gate issues\n\nNone — the hard gate passed clean.",
      advisory ? `\n## Advisory review\n\n${advisory ? JSON.stringify(JSON.parse(advisory.content), null, 2) : ""}` : "",
      "",
      "## Anomalies (console)",
      "```",
      consoleLines.filter((l) => /\[maxi-agent\]/.test(l)).slice(0, 40).join("\n"),
      "```",
    ].join("\n"),
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "RUN_SUMMARY.md"),
    [
      `# Agent v25 e2e — Run Summary`,
      "",
      `| | |`,
      `|---|---|`,
      `| Run ID | \`${run.id}\` |`,
      `| Status | \`${summary.status}\` |`,
      `| Brief | ${BRIEF} |`,
      `| Wall time | ${summary.wallSeconds}s |`,
      `| Screens (verified) | ${summary.screens.join(", ") || "none"} |`,
      `| Failed screens | ${summary.failedScreens.join(", ") || "none"} |`,
      `| Gate | ${summary.gate?.passed ? "PASS" : "FAIL"} |`,
      `| Advisory | ${summary.advisory ? `${summary.advisory.score}/100 (${summary.advisory.verdict})` : "n/a"} |`,
      `| Model calls | ${summary.calls?.totalCalls ?? "?"} |`,
      `| Cost | ${summary.cost ? `$${summary.cost.dollars.toFixed(4)} (${summary.cost.credits.toFixed(2)} credits, ${summary.cost.calls} calls)` : "n/a"} |`,
      `| Fingerprint | ${summary.fingerprint ?? "n/a"} |`,
      "",
      "## Models",
      ...Object.entries(summary.models)
        .filter(([, m]) => m)
        .map(([role, m]) => `- ${role}: \`${m}\``),
      "",
      "## Wave timing (s)",
      "| Wave | Seconds |",
      "|---|---|",
      ...[0, 1, 2, 3, 4].map((w) => `| w${w} | ${summary.waves[`w${w}` as keyof typeof summary.waves].toFixed(1)} |`),
      "",
      `## Screenshots`,
      summary.screenshotFiles.map((n) => `- \`screenshots/${n}\``).join("\n") || "- none rendered",
      "",
      `## Files (${summary.fileCount})`,
      ...files.map((f) => `- \`${f.path}\``),
    ].join("\n"),
  );

  console.log(`\n[v25-e2e] ${summary.status} · ${summary.wallSeconds}s · gate ${summary.gate?.passed ? "PASS" : "FAIL"} · advisory ${summary.advisory?.score ?? "?"}/100 · ${summary.calls?.totalCalls ?? "?"} calls${summary.cost ? ` · $${summary.cost.dollars.toFixed(4)}` : ""}`);
  console.log(`[v25-e2e] artifacts in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[v25-e2e] harness failed:", err);
  process.exit(1);
});
