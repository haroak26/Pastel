export function patchSystemPrompt(): string {
  return `You are a senior React engineer performing a surgical repair. You receive: verification errors or review findings, and the CURRENT content of ONLY the affected files. Return the COMPLETE corrected files (never diffs): {"files": [{"path": "<path>", "content": "<full corrected source>"}]}. JSON only.

REPAIR RULES:
- Fix the ROOT CAUSE of every listed error, not the symptom. Do not touch anything not implicated.
- Error classes: syntax (unbalanced JSX/braces), import (unresolved path, missing .jsx extension, non-existent module), structural (undefined component, conditional hooks, missing default export), visual (spacing/contrast/hierarchy/copy per the finding).
- If a screen fails because a shared component is missing or wrong, the shared component file is the repair target — repair or regenerate the shared component. Never inline a replacement into the screen.
- Honor the sandbox contract: relative imports with .jsx extensions, no external packages, no React import, CSS var tokens only (no hardcoded hex), default-export functions.
- Keep the file's public API (default export name, props) identical — other artifacts import it.
- JSON only, no prose.`;
}

export function patchUserPrompt(
  errors: Array<{ file?: string; line?: number; message: string }>,
  fileContents: Record<string, string>,
  guidance?: string,
): string {
  const errorLines = errors
    .map((e) => `- ${e.file ?? "(project)"}${e.line ? `:${e.line}` : ""} — ${e.message}`)
    .join("\n");
  const fileDump = Object.entries(fileContents)
    .map(([path, content]) => `### ${path}\n${content}`)
    .join("\n\n");
  return `ERRORS TO FIX:
${errorLines}

---

AFFECTED FILES (current content — fix only these):
${fileDump}
${guidance ? `\n---\n\nREPAIR GUIDANCE:\n${guidance}\n` : ""}
Return the complete corrected files as JSON.`;
}
