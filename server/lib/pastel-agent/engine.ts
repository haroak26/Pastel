import { selectStyleSeed } from "./style-seeds";
import { chat, chatJSON } from "./gateway";
import { conceptSystemPrompt, conceptUserPrompt } from "./prompts/concept";
import { systemPromptSystem, systemUserPrompt } from "./prompts/system";
import { composeSystemPrompt, composeUserPrompt } from "./prompts/compose";
import { critiqueSystemPrompt, critiqueUserPrompt } from "./prompts/critique";
import { polishSystemPrompt, polishUserPrompt } from "./prompts/polish";
import { clarifySystemPrompt, clarifyUserPrompt } from "./prompts/clarify";
import { validateGeneratedCode, quickSanityCheck } from "./validator";
import type { DesignConcept, DesignSystem, CritiqueResult, PastelEvent, PastelGeneration } from "./types";

const MAX_RETRIES = 2;
const RECENT_SEEDS: string[] = [];

interface ClarifyResult {
  questions: Array<{ id: string; question: string; options?: string[] }>;
}

interface PipelineContext {
  userIntent: string;
  answers?: Record<string, string>;
  concept: DesignConcept;
  designSystem: DesignSystem;
  code: string;
  critique?: CritiqueResult;
  finalCode?: string;
  usedSeed: string;
}

function trackSeed(seed: string) {
  RECENT_SEEDS.push(seed);
  if (RECENT_SEEDS.length > 5) RECENT_SEEDS.shift();
}

function sendEvent(
  emit: (event: PastelEvent) => void,
  type: PastelEvent["type"],
  phase?: string,
  status?: PastelEvent["status"],
  result?: unknown,
) {
  emit({ type, phase, status, result } as PastelEvent);
}

function phaseStart(emit: (event: PastelEvent) => void, phase: string) {
  sendEvent(emit, "phase", phase, "running");
}

function phaseDone(emit: (event: PastelEvent) => void, phase: string, result?: unknown) {
  sendEvent(emit, "phase", phase, "done", result);
}

function buildFullIntent(userPrompt: string, answers?: Record<string, string>): string {
  if (!answers || Object.keys(answers).length === 0) return userPrompt;
  const answerText = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return `${userPrompt}\n\nAdditional context from the user:\n${answerText}`;
}

export async function runClarify(
  userPrompt: string,
): Promise<ClarifyResult> {
  return chatJSON<ClarifyResult>([
    { role: "system", content: clarifySystemPrompt() },
    { role: "user", content: clarifyUserPrompt(userPrompt) },
  ], { temperature: 0.7, maxTokens: 400 });
}

export async function runPipeline(
  userPrompt: string,
  emit: (event: PastelEvent) => void,
  answers?: Record<string, string>,
): Promise<PipelineContext> {
  const fullIntent = buildFullIntent(userPrompt, answers);
  const ctx: PipelineContext = { userIntent: fullIntent } as PipelineContext;

  // ── Phase 1: Concept ──
  phaseStart(emit, "concept");
  const seed = selectStyleSeed(RECENT_SEEDS);
  trackSeed(seed.name);
  ctx.usedSeed = seed.name;

  const concept = await chatJSON<DesignConcept>([
    { role: "system", content: conceptSystemPrompt() },
    { role: "user", content: conceptUserPrompt(
      fullIntent,
      seed.name,
      `Mood: ${seed.mood.join(", ")}. Spatial: ${seed.spatialPhilosophy}. Typography: ${seed.typographicAttitude}. Colors: ${seed.colorTemperature}. Texture: ${seed.textureApproach}. Direction: ${seed.creativeDirection}`,
    ) },
  ], { temperature: 0.7, maxTokens: 300 });
  ctx.concept = concept;
  phaseDone(emit, "concept", { mood: concept.mood, seed: seed.name });

  const conceptSummary = `Mood: ${concept.mood.join(", ")}. ${concept.creativeDirection}`;

  // ── Phase 2: Design System ──
  phaseStart(emit, "system");
  const designSystem = await chatJSON<DesignSystem>([
    { role: "system", content: systemPromptSystem() },
    { role: "user", content: systemUserPrompt(conceptSummary, fullIntent) },
  ], { temperature: 0.5, maxTokens: 500 });
  ctx.designSystem = designSystem;
  phaseDone(emit, "system", { colors: designSystem.colors, spacing: designSystem.spacing });

  const dsJSON = JSON.stringify(designSystem, null, 2);

  // ── Phase 3: Compose ──
  phaseStart(emit, "compose");
  let code = await composePass(fullIntent, conceptSummary, dsJSON);
  ctx.code = code;
  phaseDone(emit, "compose", { codeLength: code.length });

  // ── Phase 4: Critique ──
  phaseStart(emit, "critique");
  let critique = await critiquePass(fullIntent, conceptSummary, code);

  for (let retry = 0; retry < MAX_RETRIES && !critique.passed; retry++) {
    const issuesSummary = critique.issues
      .map((i) => `[${i.severity}] ${i.location}: ${i.fix}`)
      .join("\n");

    phaseStart(emit, "polish");
    code = await polishPass(code, issuesSummary);
    ctx.code = code;

    critique = await critiquePass(fullIntent, conceptSummary, code);
  }

  ctx.critique = critique;
  phaseDone(emit, "critique", { passed: critique.passed, score: critique.score });

  // ── Deterministic validation ──
  const validation = validateGeneratedCode(code);
  if (!validation.passed) {
    const detIssues = validation.flags.map((f) => `[low] Global: Remove ${f.label}`).join("\n");
    phaseStart(emit, "polish");
    code = await polishPass(code, detIssues);
  }

  // ── Sanity check ──
  if (!quickSanityCheck(code)) {
    sendEvent(emit, "error", undefined, undefined, { message: "Generated code failed sanity check — trying one more compose" });
    phaseStart(emit, "compose");
    code = await composePass(fullIntent, conceptSummary, dsJSON);
  }

  ctx.finalCode = stripMarkdownFences(code);
  sendEvent(emit, "done");
  return ctx;
}

async function composePass(userIntent: string, conceptSummary: string, dsJSON: string): Promise<string> {
  const { content } = await chat([
    { role: "system", content: composeSystemPrompt() },
    { role: "user", content: composeUserPrompt(userIntent, conceptSummary, dsJSON) },
  ], { temperature: 0.7, maxTokens: 3000 });
  return stripMarkdownFences(content);
}

async function critiquePass(userIntent: string, conceptSummary: string, code: string): Promise<CritiqueResult> {
  return chatJSON<CritiqueResult>([
    { role: "system", content: critiqueSystemPrompt() },
    { role: "user", content: critiqueUserPrompt(userIntent, conceptSummary, code) },
  ], { temperature: 0.3, maxTokens: 500 });
}

async function polishPass(code: string, issuesSummary: string): Promise<string> {
  const { content } = await chat([
    { role: "system", content: polishSystemPrompt() },
    { role: "user", content: polishUserPrompt(code, issuesSummary) },
  ], { temperature: 0.4, maxTokens: 3000 });
  return stripMarkdownFences(content);
}

function stripMarkdownFences(code: string): string {
  let cleaned = code.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[\w-]*\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned.trim();
}
