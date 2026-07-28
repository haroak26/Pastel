import { SLOP_DETECTION_PATTERNS } from "./taste-engine";

export interface ValidationResult {
  passed: boolean;
  flags: Array<{ label: string; count: number }>;
  summary: string;
}

export function validateGeneratedCode(code: string): ValidationResult {
  const flags: Array<{ label: string; count: number }> = [];

  for (const { pattern, label } of SLOP_DETECTION_PATTERNS) {
    const matches = code.match(pattern);
    if (matches) {
      const count = Array.isArray(matches) ? matches.length : 1;
      flags.push({ label, count });
    }
  }

  const passed = flags.length === 0;
  const summary = passed
    ? "No slop patterns detected"
    : `Found ${flags.length} slop pattern(s): ${flags.map(f => `${f.label} (${f.count}x)`).join(", ")}`;

  return { passed, flags, summary };
}

export function quickSanityCheck(code: string): boolean {
  if (code.length < 100) return false;
  if (!code.includes("<") || !code.includes(">")) return false;
  if (!code.includes("section") && !code.includes("main") && !code.includes("div")) return false;
  if (code.includes("```")) return false; // markdown fences left in
  if (code.toLowerCase().includes("here's")) return false; // explanatory text
  return true;
}
