import test from "node:test";
import assert from "node:assert/strict";

import { retrieveKnowledge, resetKnowledgeIndex } from "../lib/maxi-agent/knowledge/retrieval";
import { MODE_LAW_SLICES, MODE_COMPONENT_LAW } from "../lib/maxi-agent/knowledge/retrieval";

test.after(() => resetKnowledgeIndex());

test("knowledge index: every mode's law slices exist on disk", async () => {
  resetKnowledgeIndex();
  const { buildKnowledgeIndex } = await import("../lib/maxi-agent/knowledge/retrieval");
  const index = buildKnowledgeIndex();
  for (const laws of Object.values(MODE_LAW_SLICES)) {
    for (const name of laws) assert.ok(index.lawSizes[name] !== undefined, `design-law ${name} indexed`);
  }
  for (const laws of Object.values(MODE_COMPONENT_LAW)) {
    for (const name of laws) assert.ok(index.componentLawSizes[name] !== undefined, `component-law ${name} indexed`);
  }
});

test("retrieval: the slice is mode-scoped (only relevant laws, not the whole KB)", async () => {
  const slice = await retrieveKnowledge({ company: "linear", mode: "track" });
  const expectedLaws = MODE_LAW_SLICES.track;
  for (const l of slice.designLaws) assert.ok(expectedLaws.includes(l.name), `${l.name} relevant for track`);
  for (const l of slice.componentLaws) assert.ok(MODE_COMPONENT_LAW.track.includes(l.name), `${l.name} relevant for track`);
  assert.ok(slice.files.includes("companies/linear/design.md"));
});

test("retrieval: law files are bounded per file (the prompt-token lever)", async () => {
  const slice = await retrieveKnowledge({ company: "linear", mode: "track" });
  for (const l of [...slice.designLaws, ...slice.componentLaws]) {
    assert.ok(l.content.length <= 3_500, `${l.name} capped at 3500 chars (got ${l.content.length})`);
    assert.ok(l.content.includes("truncated") || l.content.length < 3_500 || l.content.trim().endsWith("."), `${l.name} has a truncation marker when cut`);
  }
  assert.ok(slice.chars < 50_000, `slice chars ${slice.chars} — the company doc (full) + capped laws`);
});

test("retrieval: a custom cap is honored", async () => {
  const slice = await retrieveKnowledge({ company: "linear", mode: "track", maxLawCharsPerFile: 1_000 });
  for (const l of [...slice.designLaws, ...slice.componentLaws]) {
    assert.ok(l.content.length <= 1_000, `${l.name} capped at 1000`);
  }
});

test("retrieval: the company design.md rides in full (it IS the design language)", async () => {
  const slice = await retrieveKnowledge({ company: "linear", mode: "track" });
  assert.ok(slice.companyDoc.includes("Linear design language"));
  assert.ok(slice.companyDoc.length > 500, "full company doc present");
});
