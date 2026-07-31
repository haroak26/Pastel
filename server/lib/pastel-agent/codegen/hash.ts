import { createHash } from "node:crypto";

/** Short stable hash of an artifact's content (for reuse/invalidation checks). */
export function hashArtifact(content: string): string {
  return createHash("sha1").update(content).digest("hex").slice(0, 12);
}

/** Stable hash of structured data (stable key order). */
export function hashStructured(value: unknown): string {
  return hashArtifact(stableStringify(value));
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

/** Normalized hash of a user prompt (intake cache key). */
export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex").slice(0, 24);
}
