import test from "node:test";
import assert from "node:assert/strict";

import {
  findUsages,
  auditScreenProps,
  applyPropAutoFix,
  type PropContract,
} from "../lib/maxi-agent/lib/prop-validation";

const CONTRACT: PropContract = {
  generatedAt: "test",
  entries: [
    {
      componentId: "sprint-task-table",
      componentName: "SprintTaskTable",
      props: {
        tasks: { type: "Task[]", required: true, description: "the rows" },
        title: { type: "string", required: true, description: "section title" },
      },
      importPath: "src/components/sprint-task-table.jsx",
    },
    {
      componentId: "goal-progress",
      componentName: "GoalProgress",
      props: {
        value: { type: "number", required: true, description: "progress 0..1" },
      },
      importPath: "src/components/goal-progress.jsx",
    },
    {
      componentId: "avatar",
      componentName: "Avatar",
      props: {},
      importPath: "src/components/avatar.jsx",
    },
  ],
};

// ── findUsages ───────────────────────────────────────────────────────────

test("findUsages: matches PascalCase ids by longest prefix", () => {
  const code = `
    <SprintTaskTable tasks={DATA.home.rows} title="Tasks" className="w-full" />
    <SprintTaskTableHeader />
    <GoalProgress value={0.6} />
  `;
  const usages = findUsages(code, ["sprint-task-table", "goal-progress"]);
  assert.equal(usages.get("sprint-task-table")!.length, 1);
  assert.equal(usages.get("goal-progress")!.length, 1);
});

test("findUsages: chrome attributes are excluded from data-bearing attrs", () => {
  const code = `<SprintTaskTable className="w-full" style={{x:1}} />`;
  const usages = findUsages(code, ["sprint-task-table"]);
  const usage = usages.get("sprint-task-table")![0];
  assert.equal(usage.isEmpty, true, "only chrome attrs = empty usage");
});

test("findUsages: spread props mark the usage unverifiable", () => {
  const code = `<SprintTaskTable {...props} />`;
  const usages = findUsages(code, ["sprint-task-table"]);
  assert.equal(usages.get("sprint-task-table")![0].hasSpread, true);
});

// ── auditScreenProps ─────────────────────────────────────────────────────

test("auditScreenProps: complete usage passes with no violations", () => {
  const code = `<SprintTaskTable tasks={DATA.home.rows} title="Tasks" />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.deepEqual(audit.violations, []);
});

test("auditScreenProps: missing required props are violations", () => {
  const code = `<SprintTaskTable title="Tasks" />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.equal(audit.violations.length, 1);
  assert.equal(audit.violations[0].componentId, "sprint-task-table");
  assert.deepEqual(audit.violations[0].missingRequired, ["tasks"]);
});

test("auditScreenProps: spread usage is unverifiable, never a violation", () => {
  const code = `<SprintTaskTable {...itemProps} />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.deepEqual(audit.violations, []);
});

test("auditScreenProps: chrome-only mount of a required-prop component is flagged", () => {
  const code = `<SprintTaskTable className="mt-8" />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.equal(audit.violations.length, 1);
  assert.deepEqual(audit.violations[0].missingRequired.sort(), ["tasks", "title"]);
});

test("auditScreenProps: components with no required props never violate", () => {
  const code = `<Avatar />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.deepEqual(audit.violations, []);
});

test("auditScreenProps: a required prop passed as empty expression is still present", () => {
  const code = `<SprintTaskTable tasks={[]} title="" />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.deepEqual(audit.violations, [], "prop presence is the contract here; empty-literal judgement lives in checks/props.ts");
});

// ── applyPropAutoFix ─────────────────────────────────────────────────────

test("applyPropAutoFix: chrome-only broken mounts are replaced with a safe wrapper", () => {
  const code = `export function Home() {
  return (
    <main>
      <SprintTaskTable className="w-full" />
    </main>
  );
}`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.equal(audit.violations.length, 1);
  const fixed = applyPropAutoFix(code, audit, CONTRACT);
  assert.equal(fixed.fixed.length, 1);
  assert.ok(!fixed.code.includes("<SprintTaskTable"), "broken mount replaced");
  assert.ok(fixed.code.includes("data-mount=\"sprint-task-table\""), "safe wrapper carries the mount id");
  assert.deepEqual(fixed.audit.violations, [], "no violations remain");
});

test("applyPropAutoFix: paired tags keep their children", () => {
  const code = `export function Home() {
  return (
    <main>
      <SprintTaskTable className="w-full">
        <span>loading</span>
      </SprintTaskTable>
    </main>
  );
}`;
  const audit = auditScreenProps(code, CONTRACT);
  const fixed = applyPropAutoFix(code, audit, CONTRACT);
  assert.ok(!fixed.code.includes("<SprintTaskTable"), "opening tag replaced");
  assert.ok(fixed.code.includes("</SprintTaskTable>") === false, "closing tag replaced too");
  assert.ok(fixed.code.includes("loading"), "children preserved");
});

test("applyPropAutoFix: mounts with real data are never touched", () => {
  const code = `<SprintTaskTable tasks={DATA.home.rows} title="Tasks" className="mt-4" />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.equal(audit.violations.length, 0);
  const fixed = applyPropAutoFix(code, audit, CONTRACT);
  assert.equal(fixed.fixed.length, 0);
  assert.equal(fixed.code, code);
});

test("applyPropAutoFix: no violations → identity", () => {
  const code = `<GoalProgress value={0.4} />`;
  const audit = auditScreenProps(code, CONTRACT);
  const fixed = applyPropAutoFix(code, audit, CONTRACT);
  assert.equal(fixed.code, code);
  assert.deepEqual(fixed.fixed, []);
});

test("applyPropAutoFix: unverifiable (spread) mounts are not auto-fixed", () => {
  const code = `<SprintTaskTable {...props} />`;
  const audit = auditScreenProps(code, CONTRACT);
  assert.deepEqual(audit.violations, []);
  const fixed = applyPropAutoFix(code, audit, CONTRACT);
  assert.equal(fixed.code, code);
});
