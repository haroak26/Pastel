import { sql } from "drizzle-orm";
import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { patternRankSystemPrompt, patternRankUserPrompt } from "../prompts/pattern-rank";
import {
  patternRankResultSchema,
  type PatternContext,
  type RetrievedPattern,
} from "../schemas/plan-schemas";
import { db } from "../../../db";
import { designPatterns } from "@shared/schema";
import { getEmbedding } from "../../ai";
import { PATTERN_CORPUS, STATIC_FALLBACK_PATTERNS } from "../patterns/corpus";
import { saveProjectState } from "../state";
import type { StageContext } from "./context";

/**
 * Stage 11 — Design pattern retrieval. Semantic search (pgvector cosine) over
 * the curated pattern library + a light model rerank to assign 1-4 patterns
 * per screen. Falls back to the static library subset when the vector store
 * is unavailable — the pipeline never hard-fails on retrieval.
 */

const RETRIEVAL_LIMIT = 14;

export function staticPatternContext(screenNames: string[]): PatternContext {
  const patterns = PATTERN_CORPUS.filter((p) => STATIC_FALLBACK_PATTERNS.includes(p.name)).map(toRetrieved);
  return {
    provider: "static",
    patterns,
    assignments: screenNames.map((screen, index) => ({
      screen,
      patterns: heuristicAssignment(index, patterns.map((p) => p.name)),
    })),
  };
}

function heuristicAssignment(index: number, names: string[]): string[] {
  const opening = ["Split Hero", "Stat Row + Main Chart", "Full-Bleed Statement", "Stat Block"];
  const body = ["Bento Grid", "Master-Detail List", "Dense Data Table", "Settings Nav + Form Sections", "Divider Row", "Alternating Rows"];
  const picked = [opening[index % opening.length], body[(index * 2 + 1) % body.length], "Statement + Button"].filter((n) => names.includes(n));
  return picked.length > 0 ? picked : names.slice(0, 2);
}

function toRetrieved(p: { category: string; name: string; summary: string; structure: Record<string, unknown>; bestFor: string[] }): RetrievedPattern {
  return { name: p.name, category: p.category, summary: p.summary, bestFor: p.bestFor };
}

async function searchPatterns(query: string): Promise<RetrievedPattern[]> {
  const embedding = await getEmbedding(query);
  if (!embedding.length) throw new Error("embedding unavailable");
  const vector = `[${embedding.map((n) => Number(n.toFixed(6))).join(",")}]`;
  const rows = await db
    .select({
      name: designPatterns.name,
      category: designPatterns.category,
      summary: designPatterns.summary,
      bestFor: designPatterns.bestFor,
      distance: sql<number>`${designPatterns.embedding} <=> ${vector}::vector`,
    })
    .from(designPatterns)
    .where(sql`${designPatterns.embedding} IS NOT NULL`)
    .orderBy(sql`${designPatterns.embedding} <=> ${vector}::vector`)
    .limit(RETRIEVAL_LIMIT);
  if (rows.length === 0) throw new Error("design_patterns table is empty");
  return rows.map((row) => ({ name: row.name, category: row.category, summary: row.summary, bestFor: row.bestFor ?? [] }));
}

function buildQuery(ctx: StageContext): string {
  const brief = ctx.state.creativeBrief;
  const spec = ctx.state.productSpec;
  const strategy = ctx.state.brandStrategy;
  const parts = [
    brief?.productSummary,
    spec ? `Product: ${spec.title}. Screens: ${spec.screens.map((s) => `${s.name} (${s.userGoal})`).join(", ")}` : "",
    strategy ? `Direction: ${strategy.visualKeywords.join(", ")}; ${strategy.personality.join(", ")}` : "",
  ].filter(Boolean);
  return parts.join("\n").slice(0, 4000);
}

export async function patternRetrievalStage(ctx: StageContext): Promise<PatternContext> {
  ctx.activity("Retrieving proven design patterns");
  const spec = ctx.state.productSpec;
  if (!spec) throw new Error("pattern-retrieval stage requires productSpec in state");
  const screenNames = spec.screens.map((s) => s.name);

  let patterns: RetrievedPattern[] = [];
  let provider: PatternContext["provider"] = "static";
  try {
    patterns = await searchPatterns(buildQuery(ctx));
    provider = "pgvector";
    ctx.activity(`Retrieved ${patterns.length} patterns from the design library (${patterns.slice(0, 3).map((p) => p.name).join(", ")}…)`);
  } catch (err) {
    console.warn("[pastel-agent] pattern retrieval unavailable, using static library:", err instanceof Error ? err.message : err);
    const fallback = staticPatternContext(screenNames);
    patterns = fallback.patterns;
    ctx.activity("Pattern retrieval using the built-in pattern library");
  }

  // Light rerank — assign 1-4 retrieved patterns per screen.
  let assignments = staticPatternContext(screenNames).assignments;
  if (patterns.length > 0 && ctx.budgetAllowsModelCall?.() !== false) {
    const sys = patternRankSystemPrompt();
    const screensForRank = ctx.state.screenPlan
      ? ctx.state.screenPlan.screens.map((s) => ({ name: s.name, goal: s.goal, requiredContent: s.requiredContent }))
      : spec.screens.map((s) => ({ name: s.name, goal: s.userGoal, requiredContent: s.sections.map((sec) => sec.purpose) }));
    const screensJson = JSON.stringify(screensForRank);
    const candidatesJson = JSON.stringify(patterns.map((p) => ({ name: p.name, category: p.category, summary: p.summary, bestFor: p.bestFor })));
    const user = patternRankUserPrompt(screensJson, candidatesJson);
    try {
      const ranked = await chatJSON(
        [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        { model: "patternRank", temperature: 0.2, maxTokens: MAX_TOKENS_PER_CALL.patternRank, validate: (v) => patternRankResultSchema.parse(v) },
      );
      ctx.trackCost("patternRank", MODELS.patternRank, sys.length + user.length, JSON.stringify(ranked).length);
      const candidateNames = new Set(patterns.map((p) => p.name));
      const valid = ranked.assignments
        .filter((a) => screenNames.includes(a.screen))
        .map((a) => ({ screen: a.screen, patterns: a.patterns.filter((n) => candidateNames.has(n)).slice(0, 4) }))
        .filter((a) => a.patterns.length > 0);
      if (valid.length > 0) {
        assignments = screenNames.map((name) => valid.find((a) => a.screen === name) ?? { screen: name, patterns: heuristicAssignment(screenNames.indexOf(name), patterns.map((p) => p.name)) });
      }
    } catch (err) {
      console.warn("[pastel-agent] pattern rerank failed, using heuristic assignment:", err instanceof Error ? err.message : err);
    }
  }

  const context: PatternContext = { provider, patterns, assignments };
  ctx.state.patternContext = context;
  ctx.state.decisionLog = [...ctx.state.decisionLog, `Pattern retrieval (${provider}): ${assignments.map((a) => `${a.screen} [${a.patterns.join(", ")}]`).join("; ")}`];
  await saveProjectState(ctx.state);
  return context;
}

/** Text block injected into the composition prompt — the ONLY allowed patterns. */
export function formatPatternsForCompose(context: PatternContext): string {
  const library = context.patterns
    .map((p) => `- ${p.name} (${p.category}): ${p.summary}`)
    .join("\n");
  const assignments = context.assignments
    .map((a) => `- ${a.screen}: ${a.patterns.join(", ")}`)
    .join("\n");
  return `PATTERN LIBRARY:\n${library}\n\nPER-SCREEN ASSIGNMENTS:\n${assignments}`;
}
