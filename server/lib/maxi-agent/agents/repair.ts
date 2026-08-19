import { MAX_TOKENS_PER_CALL, type OnUsage } from "../gateway";
import type { ChatMessage } from "../gateway";
import { sanitizeFileContent } from "../sandbox";
import type { ResolvedTheme } from "../schemas";
import { callText, gatewayModelChat, type ModelChat } from "../lib/model-chat";
import { validateAuthoredFile } from "./author";

/**
 * Maxi Agent v25 — Wave 3 · POLISH.
 *
 * One repair call per failing FILE with the file + the exact gate errors +
 * the rendered screenshot when one exists (the v24 lesson the hard way:
 * strong models fix overflow instantly when shown the render, and slowly or
 * never when only told about it). The orchestrator caps TOTAL repair calls
 * (default 3) — this module never loops on its own.
 *
 * Also carries the v24 convergence fallback verbatim in spirit:
 * `correctThemeViolations` — two same-class failures converge through a
 * deterministic path rather than shipping the violation.
 */

export interface RepairInput {
  path: string;
  code: string;
  /** The exact gate/verification errors this file must fix. */
  issues: string[];
  theme: ResolvedTheme;
  /** dataUrl screenshot of a screen rendering this file (when available). */
  screenshotDataUrl?: string;
  /** Short concept context so the repair keeps the art direction. */
  conceptLine: string;
  chat?: ModelChat;
  onUsage?: OnUsage;
}

const REPAIR_SYSTEM = `You are a senior frontend engineer doing precise, surgical repairs on a React file that failed automated verification. You fix the EXACT failures listed — you keep everything else byte-for-byte in spirit: the design, the composition, the copy. You never redesign, never restyle, never "improve" anything not listed as broken.

Rules:
- Output the COMPLETE fixed file — no diffs, no explanations, no markdown fences.
- Every color stays a design token (bg-primary, text-muted-foreground, var(--radius-md)…). NEVER introduce hex or raw Tailwind color literals.
- Keep every import that still resolves; keep the default export.
- If a component/screen the file mounts is missing props, pass real values from DATA (src/data.js) — never placeholder strings.`;

export async function repairFile(input: RepairInput): Promise<string> {
  const chatFn = input.chat ?? gatewayModelChat();
  const messages: ChatMessage[] = [
    { role: "system", content: REPAIR_SYSTEM },
    {
      role: "user",
      content: [
        `CONTEXT: ${input.conceptLine}`,
        "",
        `FILE: ${input.path}`,
        "```jsx",
        input.code,
        "```",
        "",
        "VERIFICATION FAILURES this file must fix:",
        ...input.issues.slice(0, 12).map((e) => `- ${e}`),
      ].join("\n"),
    },
  ];
  if (input.screenshotDataUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: "The rendered screenshot of a screen using this file (the failure may be visible — e.g. horizontal overflow, clipped text, an empty region). Fix what you see." },
        { type: "image", source: dataUrlToImageSource(input.screenshotDataUrl) },
      ] as Array<Record<string, unknown>>,
    });
  }

  const kind = input.path.includes("/screens/") ? "screen" : "component";
  const code = sanitizeFileContent(await callText(chatFn, messages, {
    model: "repair",
    maxTokens: MAX_TOKENS_PER_CALL.repair,
    temperature: 0.3,
    onUsage: input.onUsage,
  }));
  const errors = validateAuthoredFile(code, kind);
  if (errors.length > 0) {
    throw new Error(`repair of ${input.path} introduced violations: ${errors.join("; ")}`);
  }
  return code;
}

function dataUrlToImageSource(dataUrl: string): { type: "base64"; media_type: string; data: string } {
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) throw new Error("screenshot is not a base64 image data URL");
  return { type: "base64", media_type: m[1]!, data: m[2]! };
}

// ── Convergence fallback (v24 WS7, ported) ────────────────────────────────

export interface ThemeCorrectionOpts {
  initialCode: string;
  /** Re-scan a candidate output for violations of the same class. */
  violationHits: (code: string) => string[];
  /** One targeted corrective retry; null when it produced nothing usable. */
  attempt: (feedback: string) => Promise<string | null>;
  /** The deterministic fallback path (never ships the violation). */
  fallback: () => Promise<string | null>;
  onStillViolating?: (componentName: string, count: number) => void;
  componentName: string;
}

/**
 * Two corrective retries on the same violation class, then convergence
 * through the deterministic fallback instead of shipping the violation.
 * Pure dependency injection — the deterministic test suite drives it
 * without any model call.
 */
export async function correctThemeViolations(opts: ThemeCorrectionOpts): Promise<{ code: string; usedFallback: boolean }> {
  let code = opts.initialCode;
  const hits = opts.violationHits(code);
  if (hits.length === 0) return { code, usedFallback: false };

  const MAX_CORRECTIVE_RETRIES = 2;
  let remaining = hits;
  let usedFallback = false;
  for (let attempt = 0; attempt < MAX_CORRECTIVE_RETRIES && remaining.length > 0; attempt++) {
    const feedback = [
      "Your previous output violates the token/theme law. Replace EVERY one of these with theme tokens and the radius/control scale:",
      ...remaining.map((h) => `- ${h}`),
      "- raw radii → rounded-[var(--radius-md)] / var(--radius-lg)",
      "- raw heights → h-[var(--control-sm)] / h-[var(--control-md)] / h-[var(--control-lg)]",
    ].join("\n");
    const candidate = await opts.attempt(feedback);
    if (!candidate) break;
    code = candidate;
    remaining = opts.violationHits(candidate);
  }

  if (remaining.length > 0) {
    const fallbackCode = await opts.fallback();
    if (fallbackCode && opts.violationHits(fallbackCode).length === 0) {
      code = fallbackCode;
      usedFallback = true;
    } else {
      opts.onStillViolating?.(opts.componentName, remaining.length);
    }
  }
  return { code, usedFallback };
}
