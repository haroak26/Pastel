import test from "node:test";
import assert from "node:assert/strict";

import { compileCompanyBlock, megadesignBlock, visualMoodBlock } from "../lib/maxi-agent/knowledge/index";
import { buildGenomeUserText, buildBriefBlock, COMPANY_REFERENCE_GUIDANCE, USER_TARGET_GUARDRAILS } from "../lib/maxi-agent/agents/genome";
import { buildModeVocabulary } from "../lib/maxi-agent/lib/genome";
import type { ProductBrief } from "../lib/maxi-agent/schemas";

/**
 * Maxi Agent v24 — inspiration-as-mood regression.
 *
 * v23 compiled the inspiration company's literal brand tokens (`:root {
 * --primary: #EAFF6A; ... }`) into every prompt, so a non-branded product
 * (the exact v23 e2e case: a fitness tracking app inspired by Nike) was
 * prompted to reproduce Nike's literal hex values. V24 compiles the
 * company's design.md into a VISUAL MOOD (contrast, accent frequency,
 * corners, density, motion, type voice) and the reference imagery is
 * explicitly reference-for-patterns, never brand/color reproduction.
 */

function fitnessBrief(inspiration = "nike"): ProductBrief {
  return {
    version: "1.0.0",
    title: "RunPulse",
    productType: "fitness tracking app",
    mode: "track",
    description: "A fitness tracking app that logs runs: today's workout, weekly distance, pace trends, and run history with splits.",
    audience: { primary: "runners", needs: ["logs", "trends"] },
    goals: ["log runs", "track trends"],
    features: [{ name: "run log", description: "log every run", priority: "critical" }],
    platform: "all",
    screenPurposes: [
      { id: "home", purpose: "today's workout and weekly progress — the primary workflow" },
      { id: "detail", purpose: "one run's splits and effort — the focused record view" },
    ],
    designLanguage: "energetic minimal",
    inspiration: { primary: inspiration, secondary: [] },
  };
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

test("mood: compileCompanyBlock ships the mood, never the literal brand tokens", async () => {
  const block = await compileCompanyBlock("nike");
  assert.ok(!HEX_RE.test(block), `company block contains a hex literal: ${block.match(HEX_RE)?.[0]}`);
  assert.ok(!block.includes(":root"), "no :root token injection");
  assert.ok(block.includes("Visual mood (derived"), "mood block present");
  assert.ok(block.includes("Contrast:"), "contrast level present");
  assert.ok(block.includes("Accent frequency:"), "accent frequency present");
  assert.ok(block.includes("Corner language:"), "corner language present");
  assert.ok(block.includes("Motion character:"), "motion character present");
  assert.ok(block.includes("Type voice:"), "type voice present");
});

test("mood: every registered company compiles without hex literals", async () => {
  const { listCompanySlugs } = await import("../lib/maxi-agent/knowledge/index");
  for (const slug of listCompanySlugs()) {
    const block = await compileCompanyBlock(slug);
    assert.ok(!HEX_RE.test(block), `${slug}: company block contains a hex literal`);
  }
});

test("mood: visualMoodBlock derives from the manifest deterministically", async () => {
  const { loadCompany } = await import("../lib/maxi-agent/knowledge/index");
  const nike = await loadCompany("nike");
  const mood = visualMoodBlock(nike);
  assert.ok(mood.includes("very high") || mood.includes("high"), "nike foreground/background contrast is high");
  assert.ok(mood.includes("statement-scale display"), "nike 44px display is statement-scale");
});

test("inspiration guardrail: the fitness+nike genome prompt carries no literal brand hex", async () => {
  const brief = fitnessBrief("nike");
  const companyBlock = await compileCompanyBlock("nike");
  const megadesign = await megadesignBlock();
  const vocabulary = buildModeVocabulary("track");

  const prompt = buildGenomeUserText({
    brief,
    companyBlock,
    megadesign,
    vocabulary,
    companyRefText: COMPANY_REFERENCE_GUIDANCE,
    userRefText: "",
  });

  // The full user prompt (brief + company block + megadesign + vocabulary)
  // must contain NO hex literal — in particular none of Nike's own values.
  assert.ok(!HEX_RE.test(prompt), `genome prompt leaks a hex literal: ${prompt.match(HEX_RE)?.[0]}`);
  for (const hex of ["#EAFF6A", "#111111", "#FFFFFF", "#FF6D00", "#00B662", "#4C00FF", "#FF007A", "#E4E4E4"]) {
    assert.ok(!prompt.includes(hex), `prompt contains Nike literal ${hex}`);
  }
});

test("inspiration guardrail: the verbatim user-upload wording is reused", () => {
  const guardrail = "Match its composition, hierarchy, spacing, surface treatment, density, and responsive intent. Do not copy its domain, text, brand, or page archetype.";
  assert.ok(COMPANY_REFERENCE_GUIDANCE.includes(guardrail), "company imagery uses the guardrail verbatim");
  assert.ok(USER_TARGET_GUARDRAILS.includes(guardrail), "user-upload path keeps the guardrail verbatim");
});

test("inspiration guardrail: reference-for-patterns, not brand/color reproduction", () => {
  assert.ok(/reference for typography, spacing, and motion patterns/.test(COMPANY_REFERENCE_GUIDANCE));
  assert.ok(/never for brand or color reproduction/.test(COMPANY_REFERENCE_GUIDANCE));
  assert.ok(/unless the product IS that brand/.test(COMPANY_REFERENCE_GUIDANCE));
});

test("inspiration guardrail: the brief block carries the product identity, not the brand", () => {
  const brief = fitnessBrief("nike");
  const text = buildBriefBlock(brief);
  assert.ok(text.includes("RunPulse"), "product title present");
  assert.ok(text.includes("A fitness tracking app that logs runs"), "product description present");
  assert.ok(!text.includes("Nike") && !text.includes("#"), "brief block has no brand hexes");
});
