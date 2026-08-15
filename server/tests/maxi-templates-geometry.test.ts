import test from "node:test";
import assert from "node:assert/strict";

import { LAYOUT_TEMPLATES } from "../lib/maxi-agent/lib/layout-templates/templates";
import { selectTemplate, classifySectionBucket } from "../lib/maxi-agent/lib/layout-templates/index";
import { fixtureFilesFor, staticSpacingAudit } from "../lib/maxi-agent/lib/layout-templates/fixture";
import { verifyScreens } from "../lib/maxi-agent/sandbox";
import { buildPreviewHtml } from "../lib/maxi-agent/screenshots";
import { renderScreenInSandbox } from "../lib/maxi-agent/lib/sandbox-render";

/**
 * Maxi Agent v24 — template geometry proof.
 *
 * Every hand-authored template (3 families × 3 navs × 3 buckets × 2 roles)
 * must render with ZERO horizontal overflow and 8px-grid-aligned spacing at
 * 1440px, 768px, and 375px. The fixtures render through the PRODUCTION
 * sandbox path (lib/sandbox-render.ts) against the production shell and
 * stylesheet — this is what fixes the v23 mobile clipping seen in
 * agenttests/agentv23/screenshots/*-mobile.png at the source (the template),
 * not by patching the freeform solver.
 *
 * The static 8px-grid audit of the template's spacing scale always runs;
 * the sandboxed render half is skipped without E2B_API_KEY (same convention
 * as sandbox-e2b.test.ts).
 */

const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 375, 844],
] as const;

test("templates: the closed set covers every family × nav × bucket × role", () => {
  assert.equal(LAYOUT_TEMPLATES.length, 3 * 3 * 3 * 2);
  for (const t of LAYOUT_TEMPLATES) {
    assert.ok(t.slots.length >= 3 && t.slots.length <= 6, `${t.family}:${t.nav}:${t.bucket} has ${t.slots.length} slots`);
    assert.equal(t.slots.filter((s) => s.placement === "split-left").length, t.slots.filter((s) => s.placement === "split-right").length, "pair slots come in matched pairs");
    assert.equal(t.slots.filter((s) => s.height === "dominant").length, 1, "exactly one dominant slot per template");
    const optional = t.slots.filter((s) => s.optional);
    assert.ok(optional.every((s, i) => s === t.slots[t.slots.length - optional.length + i]), "only trailing slots may be optional");
    // The placement solver maps regions onto slots in order — a template
    // whose fits max exceeds its authored slot count crashes the pipeline
    // (v24 test2: TypeError on slot.placement at layout-plan.ts). fits must
    // always be mappable.
    assert.ok(Math.max(...t.fits) <= t.slots.length, `${t.family}:${t.nav}:${t.bucket}:${t.role} fits ${JSON.stringify(t.fits)} exceeds its ${t.slots.length} authored slots`);
    for (const count of t.fits) {
      const droppable = t.slots.filter((s) => s.optional).length;
      assert.ok(count >= t.slots.length - droppable || count <= t.slots.length, `${t.family}:${t.nav}:${t.bucket}:${t.role} cannot map ${count} regions (${t.slots.length} slots, ${droppable} optional)`);
    }
  }
});

test("templates: selection covers every schema-legal region count (3-6) for every mode and nav", () => {
  for (const mode of ["browse", "transact", "track", "create", "operate", "learn", "social"] as const) {
    for (const nav of ["sidebar", "topbar", "sidebar+topbar"] as const) {
      for (const count of [3, 4, 5, 6]) {
        for (const role of ["home", "detail"] as const) {
          const t = selectTemplate({ mode, nav, regionCount: count, role });
          assert.ok(t.fits.includes(count), `${mode} × ${nav} × ${count} × ${role} → template that fits`);
        }
      }
    }
  }
});

test("templates: an unfitted region count fails loudly (never improvised)", () => {
  assert.throws(
    () => selectTemplate({ mode: "track", nav: "topbar", regionCount: 9, role: "home" }),
    /extend lib\/layout-templates/,
  );
  assert.throws(
    () => selectTemplate({ mode: "track", nav: "topbar", regionCount: 1, role: "home" }),
    /extend lib\/layout-templates/,
  );
});

test("templates: every template's spacing scale is on the 8px grid (static)", () => {
  for (const t of LAYOUT_TEMPLATES) {
    const reasons = staticSpacingAudit(t);
    assert.deepEqual(reasons, [], `${t.family} × ${t.nav} × ${t.bucket} (${t.role}): ${reasons.join("; ")}`);
  }
});

test("templates: bucket classifier buckets 2-3, 4-5, 6+", () => {
  assert.equal(classifySectionBucket(2), "2-3");
  assert.equal(classifySectionBucket(3), "2-3");
  assert.equal(classifySectionBucket(4), "4-5");
  assert.equal(classifySectionBucket(5), "4-5");
  assert.equal(classifySectionBucket(6), "6+");
  assert.equal(classifySectionBucket(7), "6+");
});

test(
  "templates: sandboxed render of every template at 1440/768/375 — zero overflow, 8px-aligned (requires E2B)",
  { skip: !process.env.E2B_API_KEY && "E2B_API_KEY not set — sandboxed template geometry proof skipped" },
  async () => {
    for (const t of LAYOUT_TEMPLATES) {
      const files = await fixtureFilesFor(t);
      const result = await verifyScreens(files, ["src/screens/fixture.jsx"], { smoke: "skip" });
      assert.ok(result.ok, `${t.family}:${t.nav}:${t.bucket}:${t.role} bundled cleanly: ${result.errors.map((e) => e.message).join("; ")}`);
      const bundle = result.bundles.fixture!;
      const styles = files["src/styles.css"]!;
      const html = buildPreviewHtml("fixture", bundle, styles, ["Inter"]);
      for (const [label, width, height] of VIEWPORTS) {
        const rendered = await renderScreenInSandbox({ html, screenName: "fixture", width, height, heroScalePx: 36, fontFamilies: ["Inter"] });
        assert.ok(rendered.screenshot, `${t.family}:${t.nav}:${t.bucket}:${t.role} rendered at ${label}: ${rendered.errors.join("; ")}`);
        const geo = rendered.geometry;
        assert.ok(geo, `${label}: geometry measured`);
        assert.equal(geo.overflow, false, `${t.family} × ${t.nav} × ${t.bucket} (${t.role}) overflows at ${label}px`);
        // 8px-grid alignment: the spacing scale is grid-exact by
        // construction (static audit). The one tolerated exception is the
        // fractional 2/3 column edge of a pair row inside a narrowed frame
        // (a sidebar consumes 240px) — CSS 2fr/1fr cannot be 8-exact for
        // arbitrary container widths, and the production gate treats this
        // metric as advisory. The fractional edge propagates to the section
        // and its direct content containers, so pair templates may show up
        // to 3 off-grid elements — all at the same column edge. Everything
        // else must sit on the grid.
        const hasPair = t.slots.some((s) => s.placement === "split-left");
        const offGridTolerance = hasPair ? 3 : 0;
        assert.ok(geo.offGrid <= offGridTolerance, `${t.family} × ${t.nav} × ${t.bucket} (${t.role}) has ${geo.offGrid}/${geo.sampled} off-grid elements at ${label}px (tolerance ${offGridTolerance})`);
        assert.equal(geo.blanks.length, 0, `${label}: no blank sections`);
      }
    }
  },
);
