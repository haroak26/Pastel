/**
 * Maxi Agent v26 — e2e test with Gemini.
 *
 * Usage:
 *   npx tsx agenttests/agentv26/run-e2e.ts
 *
 * Runs one full agent pipeline with google/gemini-3.7-flash for all roles
 * and saves outputs to agenttests/agentv26/ (same artifact protocol as v25).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRIEF = `Build a premium Airbnb-style cabin rental marketplace. The app should have:

HOME SCREEN:
- A hero section with a large search input and location/date/guests filters
- A grid of cabin listings with photo thumbnails, location, price per night, rating, and host name
- A "Featured Cabins" section with 3 highlighted premium properties
- Quick filter chips for cabin types: "Lakefront", "Mountain", "Forest", "Beach"

DETAIL SCREEN:
- A large hero photo gallery of one specific cabin (the Tahoe Lakefront Retreat)
- Cabin name, location, host info with avatar, and price per night prominently displayed
- An amenities grid showing: WiFi, Kitchen, Hot Tub, Parking, Fireplace, Pet Friendly
- A reviews section with 4-5 guest reviews showing name, date, rating, and comment
- A booking summary card with check-in/out dates, guest count, and total price
- A "Reserve" primary CTA button

Design direction: Think Airbnb's actual design language — clean, warm, photography-first, with soft neutrals and one warm accent. The UI should feel like a real product, not a template. Use real cabin names, real locations (Lake Tahoe, Big Sur, Aspen, etc.), real prices ($180-$450/night), and real guest names.`;

// Override models to Gemini for all design roles
process.env.PASTEL_MODEL_DIRECTION = "google/gemini-3.7-flash";
process.env.PASTEL_MODEL_AUTHOR = "google/gemini-3.7-flash";
process.env.PASTEL_MODEL_REPAIR = "google/gemini-3.7-flash";
process.env.PASTEL_MODEL_REVIEW = "google/gemini-3.7-flash";

const OUTPUT_DIR = path.resolve(__dirname);

async function main() {
  console.log("[v26-e2e] Starting Gemini e2e test...");
  console.log(`[v26-e2e] Brief: ${BRIEF.slice(0, 80)}...`);
  console.log(`[v26-e2e] Output dir: ${OUTPUT_DIR}`);

  // Ensure output directories exist
  const screenshotsDir = path.join(OUTPUT_DIR, "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  // Dynamic import after env vars are set
  const { startAgentLoop } = await import("../../server/lib/maxi-agent/engine");
  const { subscribeToRun } = await import("../../server/lib/maxi-agent/run-store");

  const runId = `v26-gemini-${Date.now()}`;
  const events: Array<Record<string, unknown>> = [];
  const stop = subscribeToRun(runId, (e) => events.push(e as unknown as Record<string, unknown>));

  const started = Date.now();
  try {
    await startAgentLoop(runId, BRIEF, {});
  } catch (err) {
    console.error("[v26-e2e] Agent loop error:", err);
  }
  const wallSeconds = (Date.now() - started) / 1000;
  stop();

  // Extract event data
  const doneEvent = events.find((e) => e.type === "done");
  const errorEvent = events.find((e) => e.type === "error");
  const screensEvent = events.find((e) => e.type === "screens") as { screens?: string[] } | undefined;
  const messages = events.filter((e) => e.type === "activity").map((e) => String(e.message ?? ""));

  // Collect generated files from file events
  const fileEvents = events.filter((e) => e.type === "file");
  const generatedFiles: Record<string, string> = {};
  for (const fe of fileEvents) {
    const f = fe as { file?: { path?: string; content?: string } };
    if (f.file?.path && f.file?.content) {
      generatedFiles[f.file.path] = f.file.content;
    }
  }

  // Collect doc events
  const docEvents = events.filter((e) => e.type === "doc");
  const docs: Record<string, string> = {};
  for (const de of docEvents) {
    const d = de as { doc?: { path?: string; content?: string } };
    if (d.doc?.path && d.doc?.content) {
      docs[d.doc.path] = d.doc.content;
    }
  }

  // Parse gate report
  const gateContent = docs["docs/review/GateReport.json"];
  const gate = gateContent ? JSON.parse(gateContent) : null;

  // Parse advisory review
  const reviewContent = docs["docs/review/AdvisoryReview.json"];
  const advisory = reviewContent ? JSON.parse(reviewContent) : null;

  // Parse timing
  const timingContent = docs["docs/timing/TimingReport.json"];
  const timing = timingContent ? JSON.parse(timingContent) : null;

  // Parse call counts
  const callsContent = docs["docs/timing/CallCounts.json"];
  const calls = callsContent ? JSON.parse(callsContent) : null;

  // Extract screenshots from events
  const screenshotEvents = events.filter((e) => e.type === "screenshot");
  const screenshotFiles: string[] = [];
  for (const se of screenshotEvents) {
    const s = se as { screenshot?: { name?: string; data?: string } };
    if (s.screenshot?.name && s.screenshot?.data) {
      const filename = s.screenshot.name;
      const dataUrl = s.screenshot.data;
      const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (match) {
        fs.writeFileSync(path.join(screenshotsDir, filename), Buffer.from(match[1]!, "base64"));
        screenshotFiles.push(filename);
        console.log(`[v26-e2e] Saved screenshot: ${filename}`);
      }
    }
  }

  // Save generated source files to output
  for (const [filePath, content] of Object.entries(generatedFiles)) {
    const fullPath = path.join(OUTPUT_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  // Build the summary
  const status = doneEvent ? "done" : errorEvent ? "error" : "unknown";
  const screens = screensEvent?.screens ?? [];
  const failedScreens: string[] = (events.find((e) => e.type === "activity" && String(e.message ?? "").includes("failed")) as unknown as { failedScreens?: string[] })?.failedScreens ?? [];

  const summary = {
    runId,
    brief: BRIEF,
    title: BRIEF.split(" ").slice(0, 4).join(" "),
    status,
    wallSeconds: Math.round(wallSeconds * 10) / 10,
    models: {
      clarify: process.env.PASTEL_MODEL_CLARIFY || "anthropic/claude-haiku-4-5",
      direction: process.env.PASTEL_MODEL_DIRECTION,
      author: process.env.PASTEL_MODEL_AUTHOR,
      review: process.env.PASTEL_MODEL_REVIEW,
      repair: process.env.PASTEL_MODEL_REPAIR,
    },
    screens,
    failedScreens,
    gate: gate ? { passed: gate.passed, issues: gate.issues?.length ?? 0 } : null,
    advisory: advisory ? {
      score: advisory.score,
      verdict: advisory.verdict,
      strengths: advisory.strengths,
      improvements: advisory.improvements,
      summary: advisory.summary,
      estimated: advisory.estimated,
    } : null,
    calls: calls ? { callsByRole: calls.callsByRole, totalCalls: calls.totalCalls } : null,
    waves: timing?.stages?.reduce((acc: Record<string, number>, s: { wave: number; stage: string; ms: number }) => {
      acc[`w${s.wave}`] = (acc[`w${s.wave}`] ?? 0) + s.ms / 1000;
      return acc;
    }, {}) ?? null,
    fileCount: Object.keys(generatedFiles).length,
    docCount: Object.keys(docs).length,
    screenshotFiles,
    error: errorEvent ? String(errorEvent.message ?? "unknown") : null,
  };

  // Save artifacts
  fs.writeFileSync(path.join(OUTPUT_DIR, "run-summary.json"), JSON.stringify(summary, null, 2));

  // Save RUN_SUMMARY.md
  const mdLines = [
    `# Agent v26 e2e — Gemini Test`,
    "",
    "| | |",
    "|---|---|",
    `| Run ID | \`${runId}\` |`,
    `| Status | **${status}** |`,
    `| Brief | ${BRIEF.split("\n")[0]} |`,
    `| Wall time | ${summary.wallSeconds}s |`,
    `| Screens (verified) | ${screens.join(", ") || "none"} |`,
    `| Failed screens | ${failedScreens.length > 0 ? failedScreens.join(", ") : "none"} |`,
    `| Gate | ${gate?.passed ? "PASS" : gate ? "FAIL" : "n/a"} |`,
    `| Advisory | ${advisory ? `${advisory.score}/100 (${advisory.verdict})` : "n/a"} |`,
    `| Model calls | ${calls?.totalCalls ?? "?"} |`,
    "",
    "## Models",
    `- direction: \`${summary.models.direction}\``,
    `- author: \`${summary.models.author}\``,
    `- review: \`${summary.models.review}\``,
    `- repair: \`${summary.models.repair}\``,
    "",
    "## Wave timing (s)",
    "| Wave | Seconds |",
    "|---|---|",
    ...(summary.waves ? Object.entries(summary.waves).map(([k, v]) => `| ${k} | ${typeof v === 'number' ? v.toFixed(1) : v} |`) : []),
    "",
    "## Screenshots",
    ...screenshotFiles.map((f) => `- \`screenshots/${f}\``),
    "",
  ];

  if (gate?.issues?.length > 0) {
    mdLines.push("## Gate Issues");
    for (const issue of gate.issues.slice(0, 20)) {
      mdLines.push(`- [${issue.severity}] ${issue.file}: ${issue.description}`);
    }
    mdLines.push("");
  }

  if (advisory) {
    mdLines.push("## Advisory Review");
    mdLines.push(`**Score:** ${advisory.score}/100 (${advisory.verdict})`);
    mdLines.push("");
    mdLines.push("**Strengths:**");
    for (const s of advisory.strengths ?? []) mdLines.push(`- ${s}`);
    mdLines.push("");
    mdLines.push("**Improvements:**");
    for (const i of advisory.improvements ?? []) mdLines.push(`- ${i}`);
    mdLines.push("");
    mdLines.push(`**Summary:** ${advisory.summary}`);
    mdLines.push("");
  }

  if (summary.error) {
    mdLines.push("## Error");
    mdLines.push(summary.error);
    mdLines.push("");
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "RUN_SUMMARY.md"), mdLines.join("\n"));

  // Save ISSUES_AND_ERRORS.md
  const issuesLines = [
    "# Agent v26 e2e — Issues & Errors",
    "",
    `Status: ${status}`,
    `Wall time: ${summary.wallSeconds}s`,
    "",
  ];

  if (gate?.issues?.length > 0) {
    issuesLines.push("## Gate Issues");
    for (const issue of gate.issues) {
      issuesLines.push(`- [${issue.severity}] ${issue.category}: ${issue.file} — ${issue.description}`);
    }
    issuesLines.push("");
  }

  if (summary.error) {
    issuesLines.push("## Error");
    issuesLines.push(summary.error);
    issuesLines.push("");
  }

  if (!gate?.issues?.length && !summary.error) {
    issuesLines.push("No issues detected.");
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "ISSUES_AND_ERRORS.md"), issuesLines.join("\n"));

  // Save raw events for debugging
  fs.writeFileSync(path.join(OUTPUT_DIR, "events.json"), JSON.stringify(events, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("[v26-e2e] RESULTS");
  console.log("=".repeat(60));
  console.log(`Status:     ${status}`);
  console.log(`Wall time:  ${summary.wallSeconds}s`);
  console.log(`Screens:    ${screens.join(", ") || "none"}`);
  console.log(`Gate:       ${gate?.passed ? "PASS" : gate ? "FAIL" : "n/a"}`);
  console.log(`Advisory:   ${advisory ? `${advisory.score}/100 (${advisory.verdict})` : "n/a"}`);
  console.log(`Calls:      ${calls?.totalCalls ?? "?"}`);
  console.log(`Files:      ${Object.keys(generatedFiles).length}`);
  console.log(`Screenshots: ${screenshotFiles.length}`);
  if (summary.error) {
    console.log(`Error:      ${summary.error}`);
  }
  console.log("=".repeat(60));
  console.log(`Outputs saved to: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("[v26-e2e] Fatal error:", err);
  process.exit(1);
});
