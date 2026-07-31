import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Knowledge base — focused selectors so every model call carries only the
 * guidance its stage needs (no whole-library dumps into prompts).
 */

function resolveKnowledgeDir(): string {
  try {
    const url = import.meta?.url;
    if (url) {
      const dir = path.join(path.dirname(fileURLToPath(url)), "knowledge");
      if (fs.existsSync(dir)) return dir;
    }
  } catch {
    // bundled CJS output has no import.meta — fall through to cwd resolution
  }
  return path.join(process.cwd(), "server", "lib", "pastel-agent", "knowledge");
}

const KNOWLEDGE_DIR = resolveKnowledgeDir();

const FILES = [
  "design-philosophy.md",
  "react-sandbox-contract.md",
  "design-tokens.md",
  "copywriting.md",
  "layout-patterns.md",
] as const;

type KnowledgeFile = (typeof FILES)[number];

const cache = new Map<KnowledgeFile, string>();

function load(name: KnowledgeFile): string {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  let content = "";
  try {
    content = fs.readFileSync(path.join(KNOWLEDGE_DIR, name), "utf8");
  } catch {
    content = "";
  }
  cache.set(name, content);
  return content;
}

function join(...docs: string[]): string {
  return docs.filter(Boolean).join("\n\n---\n\n");
}

/** React sandbox contract — injected into every implementer/repair call. */
export function sandboxContractKnowledge(): string {
  return load("react-sandbox-contract.md");
}

/** Token naming + usage rules — implementer calls. */
export function tokenKnowledge(): string {
  return load("design-tokens.md");
}

/** Design philosophy + anti-slop rubric — reasoner planning/gate calls. */
export function philosophyKnowledge(): string {
  return load("design-philosophy.md");
}

/** Composition pattern library — architecture/blueprint calls. */
export function patternsKnowledge(): string {
  return load("layout-patterns.md");
}

/** Copywriting rules — intake/spec/architecture calls. */
export function copyKnowledge(): string {
  return load("copywriting.md");
}

/** Reasoner bundle for design-system generation. */
export function designSystemKnowledge(): string {
  return join(philosophyKnowledge(), tokenKnowledge(), copyKnowledge());
}

/** Reasoner bundle for architecture planning. */
export function architectureKnowledge(): string {
  return join(philosophyKnowledge(), patternsKnowledge(), copyKnowledge());
}

/** Compact implementer bundle (Luna) — contract + tokens only. */
export function implementerKnowledge(): string {
  return join(sandboxContractKnowledge(), tokenKnowledge());
}
