import test from "node:test";
import assert from "node:assert/strict";

import { geometryIssuesFor, geometryPasses } from "../lib/maxi-agent/checks/geometry";
import { CAPTURE_VIEWPORTS } from "../lib/maxi-agent/screenshots";
import { verifyScreens } from "../lib/maxi-agent/sandbox";
import { buildPreviewHtml } from "../lib/maxi-agent/screenshots";
import { renderScreenInSandbox } from "../lib/maxi-agent/lib/sandbox-render";

/**
 * Maxi Agent v25 — geometry as a HARD gate (carried from v24 WS6).
 *
 * v23 measured geometry only at 1440px, so the mobile clipping visible in
 * agenttests/agentv23/screenshots/home-mobile.png sailed through the gate.
 * v24/v25 render every screen at 1440/768/375 and overflow at ANY width is
 * blocking. The overflow fixture recreates the v23 defect (fixed min-width
 * scoreboard columns); the clean fixture proves a v25-shaped screen (shell
 * + DATA + responsive grids) renders clip-free at 375px.
 */

/** The v23 defect, faithfully recreated: a 4-column scoreboard with fixed
 *  min-widths inside a flex row — clips at 375px, fine at 1440px. */
const V23_OVERFLOW_FIXTURE = `// V23 home-mobile overflow fixture (recreated from agenttests/agentv23)
import { useState } from "react";
import { NavAdapter } from "../lib/shell.jsx";

export default function FixtureScreen() {
  const [active, setActive] = useState("home");
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-body)" }}>
      <NavAdapter nav="sidebar" activeId={active} onNavigate={setActive}>
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
          <section className="min-w-0 py-8">
            <div className="flex gap-4 overflow-visible">
              {[
                ["Weekly volume", "18", "sets"],
                ["Next PR", "185", "lb"],
                ["Readiness", "82", "%"],
                ["Streak", "14", "days"],
              ].map(([label, value, unit]) => (
                <div key={label} className="min-w-[180px] shrink-0 rounded-[var(--radius-lg)] bg-muted px-4 py-5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{value} {unit}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </NavAdapter>
    </div>
  );
}
`;

/** A v25-shaped screen: the deterministic shell + real DATA + responsive
 *  grids that wrap at mobile. This is the contract the author prompts carry
 *  ("it must render beautifully at 375px") — proven in the sandbox. */
const V25_CLEAN_FIXTURE = `import { useState } from "react";
import { NavAdapter } from "../lib/shell.jsx";
import { DATA } from "../data.js";

export default function CleanScreen() {
  const [active, setActive] = useState("home");
  return (
    <NavAdapter nav="topbar" activeId="home" onNavigate={setActive}>
      <div className="mx-auto w-full max-w-[1280px] min-w-0 px-4 py-8 md:px-6">
        <h1 className="text-4xl font-semibold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
          {DATA.metrics[0].value}<span className="ml-2 text-base text-muted-foreground">{DATA.metrics[0].unit}</span>
        </h1>
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DATA.metrics.map((m) => (
            <div key={m.label} className="min-w-0 rounded-[var(--radius-lg)] bg-muted px-4 py-5">
              <p className="truncate text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{m.value} {m.unit}</p>
            </div>
          ))}
        </div>
        <ul className="mt-8 min-w-0 divide-y divide-border">
          {DATA.list.rows.map((row) => (
            <li key={row.id} className="flex min-w-0 items-center justify-between gap-4 py-3">
              <span className="truncate text-sm font-medium">{row.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{row.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </NavAdapter>
  );
}
`;

const FIXTURE_TOKENS = {
  version: "1.0.0" as const,
  mode: "light" as const,
  colors: {
    background: "#ffffff", foreground: "#18181b", card: "#ffffff", cardForeground: "#18181b",
    popover: "#ffffff", popoverForeground: "#18181b", primary: "#18181b", primaryForeground: "#fafafa",
    secondary: "#f4f4f5", secondaryForeground: "#18181b", muted: "#f4f4f5", mutedForeground: "#71717a",
    accent: "#18181b", accentForeground: "#fafafa", destructive: "#dc2626", destructiveForeground: "#ffffff",
    success: "#16a34a", successSubtle: "#dcfce7", warning: "#d97706", warningSubtle: "#fef3c7",
    border: "#e4e4e7", input: "#e4e4e7", ring: "#18181b",
    chart: ["#18181b", "#16a34a", "#d97706", "#3b82f6", "#a855f7"],
  },
  radius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
  typeScale: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36 },
  control: { sm: 32, md: 40, lg: 48 },
  sectionPaddingY: 48,
  sectionGap: 32,
  fonts: { display: "Inter", body: "Inter" },
};

const FIXTURE_DATASET = {
  brand: { name: "RunPulse", tagline: "Coach-grade run tracking" },
  user: { name: "Avery Quinn", role: "Head coach", initials: "AQ", hue: 210 },
  nav: [
    { id: "home", label: "Home", icon: "home" },
    { id: "detail", label: "Detail", icon: "list" },
  ],
  metrics: [
    { label: "Weekly volume", value: "42.8", unit: "km", delta: 12, positive: true },
    { label: "Avg pace", value: "5:04", unit: "min", delta: -3, positive: false },
    { label: "Readiness", value: "86", unit: "%", delta: 4, positive: true },
    { label: "Streak", value: "14", unit: "days", delta: 2, positive: true },
  ],
  list: {
    name: "Sessions",
    rows: [
      { id: "row-1", title: "Riverside Tempo", subtitle: "6 x 1km at threshold", meta: "8.2 km", status: "Completed", date: "Aug 12" },
      { id: "row-2", title: "Dawn Long Run", subtitle: "Zone 2 endurance", meta: "16.1 km", status: "Planned", date: "Aug 14" },
    ],
  },
  detail: { title: "Riverside Tempo", fields: [{ label: "Distance", value: "8.2 km" }, { label: "Pace", value: "5:04" }, { label: "Status", value: "Completed" }, { label: "Coach", value: "Avery Quinn" }] },
  activity: [{ actor: "Avery Quinn", action: "logged", target: "Riverside Tempo", time: "2h ago" }],
  spark: [40, 45, 42, 50, 48, 55, 52, 60],
  primaryCta: "Log entry",
};

/** The v25 production shared files (shell + data + tokens) — the fixtures
 *  render through the same deterministic shell the real runs use. */
async function fixtureFiles(screenBody: string): Promise<Record<string, string>> {
  const { composeShellJsx } = await import("../lib/maxi-agent/lib/shell-gen");
  const { composeDataJs } = await import("../lib/maxi-agent/lib/data-gen");
  const { themeFromDesignTokens, loadCompany } = await import("../lib/maxi-agent/knowledge/index");
  const { compileStyles } = await import("../lib/maxi-agent/compile");

  const company = await loadCompany("linear");
  const theme = themeFromDesignTokens(FIXTURE_TOKENS as never, company);
  const { css } = compileStyles(theme);
  return {
    "src/screens/fixture.jsx": screenBody,
    "src/lib/shell.jsx": composeShellJsx(),
    "src/data.js": composeDataJs(FIXTURE_DATASET),
    "src/styles.css": css,
  };
}

test("geometry gate: overflow is blocking at every viewport (high severity)", () => {
  const geo = {
    overflow: true, fonts: [], overlaps: [], blanks: [], offGrid: 0, sampled: 1,
    minHeightOk: true, rhythm: [], flush: [], heroScale: true,
  };
  const issues = geometryIssuesFor("home", geo, 375);
  const overflow = issues.filter((i) => i.description.includes("Horizontal overflow"));
  assert.equal(overflow.length, 1);
  assert.equal(overflow[0]!.severity, "high", "overflow is a blocking high");
  assert.equal(overflow[0]!.category, "geometry");
  assert.ok(overflow[0]!.description.includes("(375px)"), "viewport named in the issue");
  assert.ok(!geometryPasses(geo).ok, "geometryPasses fails on overflow");
});

test("geometry gate: a clean render passes with no issues", () => {
  const geo = {
    overflow: false, fonts: [], overlaps: [], blanks: [], offGrid: 0, sampled: 0,
    minHeightOk: true, rhythm: [], flush: [], heroScale: true,
  };
  assert.deepEqual(geometryIssuesFor("home", geo, 375), []);
  assert.ok(geometryPasses(geo).ok);
});

test("geometry gate: the capture matrix renders 1440/768/375 (the v16 standard)", () => {
  assert.deepEqual(CAPTURE_VIEWPORTS.map((v) => v.width), [1440, 768, 375]);
});

test(
  "geometry gate: the v23 home-mobile overflow fixture FAILS the gate at 375px (sandboxed)",
  { skip: !process.env.E2B_API_KEY && "E2B_API_KEY not set — sandboxed overflow proof skipped" },
  async () => {
    const files = await fixtureFiles(V23_OVERFLOW_FIXTURE);
    const result = await verifyScreens(files, ["src/screens/fixture.jsx"], { smoke: "skip" });
    assert.ok(result.ok, `fixture bundles: ${result.errors.map((e) => e.message).join("; ")}`);
    const html = buildPreviewHtml("fixture", result.bundles.fixture!, files["src/styles.css"]!, ["Inter"]);

    const desktop = await renderScreenInSandbox({ html, screenName: "fixture", width: 1440, height: 900, heroScalePx: 36, fontFamilies: ["Inter"] });
    assert.ok(desktop.geometry, "desktop geometry measured");
    assert.equal(desktop.geometry!.overflow, false, "desktop does not overflow (the v23 defect is mobile-only)");

    const mobile = await renderScreenInSandbox({ html, screenName: "fixture", width: 375, height: 844, heroScalePx: 36, fontFamilies: ["Inter"] });
    assert.ok(mobile.geometry, "mobile geometry measured");
    assert.equal(mobile.geometry!.overflow, true, "the v23 home-mobile overflow condition reproduces at 375px");
    const issues = geometryIssuesFor("fixture", mobile.geometry!, 375);
    assert.ok(issues.some((i) => i.severity === "high" && i.description.includes("Horizontal overflow")), "the gate fails the fixture");
  },
);

test(
  "geometry gate: a v25-shaped responsive screen PASSES at 375px (sandboxed)",
  { skip: !process.env.E2B_API_KEY && "E2B_API_KEY not set — sandboxed clean proof skipped" },
  async () => {
    const files = await fixtureFiles(V25_CLEAN_FIXTURE);
    const result = await verifyScreens(files, ["src/screens/fixture.jsx"], { smoke: "skip" });
    assert.ok(result.ok, `clean fixture bundles: ${result.errors.map((e) => e.message).join("; ")}`);
    const html = buildPreviewHtml("fixture", result.bundles.fixture!, files["src/styles.css"]!, ["Inter"]);
    const mobile = await renderScreenInSandbox({ html, screenName: "fixture", width: 375, height: 844, heroScalePx: 36, fontFamilies: ["Inter"] });
    assert.ok(mobile.geometry, "mobile geometry measured");
    assert.equal(mobile.geometry!.overflow, false, "a v25 shell + DATA + responsive-grid screen never clips at 375px");
  },
);
