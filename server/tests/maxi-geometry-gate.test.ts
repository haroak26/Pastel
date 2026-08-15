import test from "node:test";
import assert from "node:assert/strict";

import { geometryIssuesFor, geometryPasses } from "../lib/maxi-agent/checks/geometry";
import { CAPTURE_VIEWPORTS } from "../lib/maxi-agent/screenshots";
import { verifyScreens } from "../lib/maxi-agent/sandbox";
import { buildPreviewHtml } from "../lib/maxi-agent/screenshots";
import { renderScreenInSandbox } from "../lib/maxi-agent/lib/sandbox-render";

/**
 * Maxi Agent v24 — geometry as a HARD gate (WS6).
 *
 * v23 measured geometry only at 1440px, so the mobile clipping visible in
 * agenttests/agentv23/screenshots/home-mobile.png sailed through the gate
 * (0/100 gate, but not for overflow). V24 renders every screen at 1440/768/
 * 375 and overflow at ANY width is blocking. The fixture below recreates
 * the v23 home-mobile overflow condition: a stat scoreboard row of fixed
 * min-width columns that cannot shrink to 375px.
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
      <NavAdapter nav="sidebar" activeId={active} onNavigate={setActive} brand="RunPulse" title="Home" subtitle="Today" user={null}>
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

const FIXTURE_STYLES = `:root {
  --background: #ffffff; --foreground: #18181b; --card: #ffffff; --card-foreground: #18181b;
  --muted: #f4f4f5; --muted-foreground: #71717a; --primary: #18181b; --primary-foreground: #fafafa;
  --border: #e4e4e7; --input: #e4e4e7; --ring: #18181b; --success: #16a34a; --warning: #d97706; --destructive: #dc2626;
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;
  --font-display: "Inter", sans-serif; --font-body: "Inter", sans-serif;
  --control-md: 40px; --text-4xl: 36px;
}
html, body { margin: 0; }
`;

/** The production composed shell (NavAdapter + IconOf + NAV) — the v23
 *  fixture renders through the same shell the real runs use. */
async function fixtureFiles(): Promise<Record<string, string>> {
  const { composeShell } = await import("../lib/maxi-agent/compose");
  const { mockDataset } = await import("../lib/maxi-agent/lib/content");
  const { themeFromDesignTokens, loadCompany } = await import("../lib/maxi-agent/knowledge/index");
  const { compileStyles } = await import("../lib/maxi-agent/compile");

  const brief = {
    version: "1.0.0" as const,
    title: "RunPulse",
    productType: "fitness tracking app",
    mode: "track" as const,
    description: "A fitness tracking app that logs runs.",
    audience: { primary: "runners", needs: ["logs"] },
    goals: ["log runs"],
    features: [{ name: "log", description: "log runs", priority: "critical" as const }],
    platform: "all" as const,
    screenPurposes: [{ id: "home", purpose: "today's workout" }, { id: "detail", purpose: "one run's splits" }],
    designLanguage: "minimal",
    inspiration: { primary: "linear", secondary: [] },
  };
  const tokens = {
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
  const company = await loadCompany("linear");
  const theme = themeFromDesignTokens(tokens as never, company);
  const { css } = compileStyles(theme);
  const data = mockDataset(brief, "ws6-fixture");
  const shell = composeShell({
    brief,
    wireframe: {
      version: "1.0.0",
      screens: [
        { id: "home", archetype: "app-dashboard", title: "Home", purpose: "today's workout", nav: "sidebar", blocks: [] },
        { id: "detail", archetype: "list-detail", title: "Detail", purpose: "one run's splits", nav: "sidebar", blocks: [] },
      ],
    },
    inventory: { version: "1.0.0", components: [] },
    copy: { productTitle: "RunPulse", screens: [{ screenId: "home", headline: "Home" }, { screenId: "detail", headline: "Detail" }] },
    theme,
    data,
  });
  return {
    "src/screens/fixture.jsx": V23_OVERFLOW_FIXTURE,
    "src/lib/shell.jsx": shell,
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
    const files = await fixtureFiles();
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
  "geometry gate: the WS2 template fixture (grid-exact) PASSES at 375px (sandboxed)",
  { skip: !process.env.E2B_API_KEY && "E2B_API_KEY not set — sandboxed clean proof skipped" },
  async () => {
    const { fixtureFilesFor } = await import("../lib/maxi-agent/lib/layout-templates/fixture");
    const { selectTemplate } = await import("../lib/maxi-agent/lib/layout-templates/index");
    const t = selectTemplate({ mode: "track", nav: "topbar", regionCount: 4, role: "home" });
    const files = await fixtureFilesFor(t);
    const result = await verifyScreens(files, ["src/screens/fixture.jsx"], { smoke: "skip" });
    assert.ok(result.ok, `template fixture bundles: ${result.errors.map((e) => e.message).join("; ")}`);
    const html = buildPreviewHtml("fixture", result.bundles.fixture!, files["src/styles.css"]!, ["Inter"]);
    const mobile = await renderScreenInSandbox({ html, screenName: "fixture", width: 375, height: 844, heroScalePx: 36, fontFamilies: ["Inter"] });
    assert.ok(mobile.geometry, "mobile geometry measured");
    assert.equal(mobile.geometry!.overflow, false, "a template-built screen never clips at 375px");
  },
);
