import { sql } from "drizzle-orm";
import { db } from "../server/db";
import { designPatterns } from "../shared/schema";
import { PATTERN_CORPUS } from "../server/lib/pastel-agent/patterns/corpus";
import { getEmbedding } from "../server/lib/ai";

/**
 * Seeds the curated design-pattern library into the `design_patterns` table
 * with embeddings for Stage 11 (design pattern retrieval).
 *
 * Requires: DATABASE_URL (with the pgvector extension available) and
 * MERGE_GATEWAY_API_KEY (for text-embedding-3-small via the gateway).
 *
 * Usage: npx tsx script/seed-design-patterns.ts
 * Safe to re-run — patterns upsert by name.
 */

async function main() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  } catch (err) {
    console.error("pgvector extension is unavailable on this database:", err instanceof Error ? err.message : err);
    process.exit(1);
  }

  let seeded = 0;
  for (const pattern of PATTERN_CORPUS) {
    const text = `${pattern.category}: ${pattern.name} — ${pattern.summary}\nLayout: ${pattern.structure.layout}\nSections: ${pattern.structure.sections.join(", ")}\nBest for: ${pattern.bestFor.join(", ")}`;
    let embedding: number[] = [];
    try {
      embedding = await getEmbedding(text);
    } catch (err) {
      console.error(`Embedding failed for ${pattern.name}:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
    const vector = `[${embedding.map((n) => Number(n.toFixed(6))).join(",")}]`;
    await db
      .insert(designPatterns)
      .values({
        category: pattern.category,
        name: pattern.name,
        summary: pattern.summary,
        structure: pattern.structure as Record<string, unknown>,
        bestFor: pattern.bestFor,
        embedding: sql`${vector}::vector` as unknown as number[],
      })
      .onConflictDoUpdate({
        target: [designPatterns.name],
        set: {
          category: pattern.category,
          summary: pattern.summary,
          structure: pattern.structure as Record<string, unknown>,
          bestFor: pattern.bestFor,
          embedding: sql`${vector}::vector` as unknown as number[],
        },
      });
    seeded++;
    if (seeded % 10 === 0) console.log(`…${seeded}/${PATTERN_CORPUS.length}`);
  }
  console.log(`Seeded ${seeded} design patterns.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
