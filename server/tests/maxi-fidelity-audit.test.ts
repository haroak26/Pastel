import test from "node:test";
import assert from "node:assert/strict";

import {
  validateFromScratchComponent,
  nearestBaseFor,
  auditComponentFidelity,
} from "../lib/maxi-agent/checks/fidelity";
import type { ComponentUISpec } from "../lib/maxi-agent/schemas";

function spec(name: string, over: Partial<ComponentUISpec> = {}): ComponentUISpec {
  return {
    name,
    purpose: `${name} for the product`,
    usedBy: ["home"],
    props: [{ name: "className", type: "string" }],
    variants: [{ name: "default", purpose: "default" }, { name: "secondary", purpose: "secondary" }],
    states: ["default"],
    ...over,
  };
}

const GOOD_CODE = `import * as React from "react"
import { ArrowUp } from "lucide-react"

export default function StatCard({ className, value, delta, ...props }: any) {
  return (
    <div className={className ?? ""} data-slot="stat-card">
      <p className="text-sm text-muted-foreground">Delta</p>
      <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
      <span className="inline-flex items-center gap-1 text-primary">
        <ArrowUp className="size-4" />
        {delta}
      </span>
    </div>
  )
}
`;

// ── validateFromScratchComponent ─────────────────────────────────────────

test("from-scratch contract: a clean component passes", () => {
  const res = validateFromScratchComponent(GOOD_CODE);
  assert.equal(res.passed, true, res.errors.join("; "));
});

test("from-scratch contract: raw hex is rejected", () => {
  const bad = GOOD_CODE.replace("text-primary", "text-[#ff0000]");
  const res = validateFromScratchComponent(bad);
  assert.equal(res.passed, false);
  assert.ok(res.errors.some((e) => /hex/i.test(e)));
});

test("from-scratch contract: non-react/lucide bare imports are rejected", () => {
  const bad = GOOD_CODE.replace('from "lucide-react"', 'from "radix-ui"');
  const res = validateFromScratchComponent(bad);
  assert.equal(res.passed, false);
  assert.ok(res.errors.some((e) => /radix-ui/.test(e)));
});

test("from-scratch contract: missing default export is rejected (composer imports default)", () => {
  const bad = GOOD_CODE.replace("export default function StatCard", "export function StatCard");
  const res = validateFromScratchComponent(bad);
  assert.equal(res.passed, false);
  assert.ok(res.errors.some((e) => /default export/i.test(e)));
});

test("from-scratch contract: alias and shadcn imports are rejected", () => {
  const aliased = GOOD_CODE.replace('from "lucide-react"', 'from "@/lib/utils"');
  assert.ok(!validateFromScratchComponent(aliased).passed);
  const shadcn = GOOD_CODE.replace('from "lucide-react"', 'from "@shadcn/button"');
  assert.ok(!validateFromScratchComponent(shadcn).passed);
});

// ── nearestBaseFor ───────────────────────────────────────────────────────

test("nearestBaseFor: shell names resolve to the vendored catalog", () => {
  const base = nearestBaseFor("Button");
  assert.ok(base, "Button resolves to a base");
  assert.equal(base!.name, "button");
  const card = nearestBaseFor("Card");
  assert.ok(card && card.name === "card");
});

test("nearestBaseFor: product-specific names have no meaningful base", () => {
  const base = nearestBaseFor("StatCard");
  assert.equal(base, null);
});

// ── auditComponentFidelity ───────────────────────────────────────────────

test("audit: a clean from-scratch component records a PASS verdict", () => {
  const { report, issues } = auditComponentFidelity(
    { StatCard: spec("StatCard") },
    { "src/components/StatCard.jsx": GOOD_CODE },
  );
  assert.equal(report.summary.total, 1);
  assert.equal(report.summary.passed, 1);
  assert.equal(report.verdicts[0].passed, true);
  assert.deepEqual(issues.filter((i) => i.severity === "high"), []);
});

test("audit: a structural violation becomes a HIGH gate issue", () => {
  const bad = GOOD_CODE.replace("text-primary", "text-[#ff0000]");
  const { report, issues } = auditComponentFidelity(
    { StatCard: spec("StatCard") },
    { "src/components/StatCard.jsx": bad },
  );
  assert.equal(report.summary.passed, 0);
  assert.ok(issues.some((i) => i.severity === "high" && i.category === "fidelity"));
});

test("audit: a basedOn-anchored component that keeps none of its base breaches the anchor floor", () => {
  const { report, issues } = auditComponentFidelity(
    { "stat-card": spec("stat-card", { basedOn: "card" }) },
    { "src/components/stat-card.jsx": GOOD_CODE },
  );
  const verdict = report.verdicts[0];
  assert.equal(verdict.baseAnchor, "card");
  assert.ok(verdict.floor !== null, "the tier floor applies when an anchor exists");
  // GOOD_CODE shares none of the card base's skeleton — the floor verdict is
  // an honest FAIL: an anchored component must retain its base's structure.
  assert.equal(verdict.passed, false);
  assert.ok(verdict.issues.some((i) => /floor/i.test(i)));
  assert.ok(issues.some((i) => i.severity === "high"));
});

test("audit: an unanchored from-scratch component is judged by ceiling + structural only", () => {
  const { report } = auditComponentFidelity(
    { StatCard: spec("StatCard") },
    { "src/components/StatCard.jsx": GOOD_CODE },
  );
  const verdict = report.verdicts[0];
  assert.equal(verdict.baseAnchor, null, "no anchor for a product-specific component");
  assert.equal(verdict.floor, null, "floor N/A without an anchor");
  assert.equal(verdict.passed, true);
});

test("audit: a missing component file is a failed verdict", () => {
  const { report, issues } = auditComponentFidelity(
    { Ghost: spec("Ghost") },
    {},
  );
  assert.equal(report.summary.failed, 1);
  assert.ok(issues.length >= 1);
});

test("audit: shell taxonomy defaults to primitive, custom to molecule", () => {
  const { report } = auditComponentFidelity(
    { Button: spec("Button"), StatCard: spec("StatCard") },
    { "src/components/Button.jsx": GOOD_CODE, "src/components/StatCard.jsx": GOOD_CODE },
  );
  const byName = Object.fromEntries(report.verdicts.map((v) => [v.componentName, v.taxonomy]));
  assert.equal(byName.Button, "primitive");
  assert.equal(byName.StatCard, "molecule");
});
