import test from "node:test";
import assert from "node:assert/strict";

import { correctThemeViolations } from "../lib/maxi-agent/agents/builder";

/**
 * Maxi Agent v24 — builder convergence fallback (WS7).
 *
 * v23 shipped theme violations after ONE failed corrective retry ("builder
 * color self-check: still 1 theme violations in Button after corrective
 * retry" in the agentv23 run log — issue #29's Separator and the flagged
 * Button/Topbar). V24: two consecutive failures on the same violation class
 * converge through the deterministic base-anchored fidelity path
 * (lib/fidelity.ts::generateComponentWithFidelity) — the violation never
 * ships.
 */

const HEX_VIOLATIONS = (code: string): string[] => {
  const hits = new Set<string>();
  for (const m of code.match(/[^'"\s]*#[0-9a-fA-F]{3,8}\b[^'"\s]*/g) ?? []) hits.add(m.trim());
  return [...hits];
};

const CLEAN = 'export default function B() { return <button className="bg-primary text-primary-foreground">Go</button>; }';
const DIRTY = 'export default function B() { return <button className="bg-primary" style={{ color: "#FFD700" }}>Go</button>; }';

test("convergence: two same-class failures fall back to the deterministic path with zero violations", async () => {
  let attempts = 0;
  let fallbacks = 0;
  const result = await correctThemeViolations({
    initialCode: DIRTY,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => {
      attempts++;
      return DIRTY; // corrective retry keeps failing on the SAME class
    },
    fallback: async () => {
      fallbacks++;
      return CLEAN; // the base-anchored path produces a clean component
    },
  });
  assert.equal(attempts, 2, "two corrective retries were attempted");
  assert.equal(fallbacks, 1, "the deterministic fallback path was taken");
  assert.equal(result.usedFallback, true);
  assert.equal(HEX_VIOLATIONS(result.code).length, 0, "output has zero violations of the class");
  assert.equal(result.code, CLEAN);
});

test("convergence: a corrective retry that fixes the class ships without the fallback", async () => {
  let attempts = 0;
  let fallbacks = 0;
  const result = await correctThemeViolations({
    initialCode: DIRTY,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => {
      attempts++;
      return CLEAN;
    },
    fallback: async () => {
      fallbacks++;
      return CLEAN;
    },
  });
  assert.equal(attempts, 1, "one corrective retry suffices");
  assert.equal(fallbacks, 0, "no fallback needed");
  assert.equal(result.usedFallback, false);
  assert.equal(HEX_VIOLATIONS(result.code).length, 0);
});

test("convergence: clean output never triggers a corrective retry", async () => {
  let attempts = 0;
  const result = await correctThemeViolations({
    initialCode: CLEAN,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => {
      attempts++;
      return CLEAN;
    },
    fallback: async () => CLEAN,
  });
  assert.equal(attempts, 0);
  assert.equal(result.usedFallback, false);
  assert.equal(result.code, CLEAN);
});

test("convergence: a failing fallback reports the violation instead of silently shipping it", async () => {
  let warned: string | null = null;
  const result = await correctThemeViolations({
    initialCode: DIRTY,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => DIRTY,
    fallback: async () => DIRTY, // even the deterministic path failed
    onStillViolating: (name, count) => { warned = `${name}:${count}`; },
  });
  assert.equal(warned, "Button:1", "the remaining violation is named");
  assert.equal(result.usedFallback, false);
  assert.ok(HEX_VIOLATIONS(result.code).length > 0, "last-known code returned, flagged, never silent");
});

test("convergence: a null retry attempt stops the loop and falls back", async () => {
  let fallbacks = 0;
  const result = await correctThemeViolations({
    initialCode: DIRTY,
    violationHits: HEX_VIOLATIONS,
    componentName: "Button",
    attempt: async () => null, // model produced nothing usable
    fallback: async () => {
      fallbacks++;
      return CLEAN;
    },
  });
  assert.equal(fallbacks, 1);
  assert.equal(result.usedFallback, true);
  assert.equal(HEX_VIOLATIONS(result.code).length, 0);
});
