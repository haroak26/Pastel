import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "knowledge");

const FILES = [
  "design-philosophy.md",
  "react-sandbox-contract.md",
  "design-tokens.md",
  "copywriting.md",
] as const;

type KnowledgeFile = (typeof FILES)[number];

const cache = new Map<KnowledgeFile, string>();

function load(name: KnowledgeFile): string {
  const hit = cache.get(name);
  if (hit) return hit;
  let content = "";
  try {
    content = fs.readFileSync(path.join(KNOWLEDGE_DIR, name), "utf8");
  } catch {
    content = "";
  }
  cache.set(name, content);
  return content;
}

/**
 * Knowledge base injected into the planning model (Sonnet).
 * Philosophy + tokens + copywriting — the design brain.
 */
export function planKnowledge(): string {
  return [
    load("design-philosophy.md"),
    load("design-tokens.md"),
    load("copywriting.md"),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

/**
 * Knowledge base injected into the coding model (GPT 5.6 Terra).
 * Everything — philosophy, sandbox contract, tokens, copywriting.
 */
export function codeKnowledge(): string {
  return FILES.map((f) => load(f))
    .filter(Boolean)
    .join("\n\n---\n\n");
}
