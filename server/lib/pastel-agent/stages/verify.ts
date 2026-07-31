import { listScreens, screenNameFromPath, type SandboxError } from "../sandbox";
import { projectContractErrors } from "../codegen/lint";
import { scanAntiSlop, hasHighSeveritySlop } from "../codegen/anti-slop";
import { pathForComponent, toPascalCase } from "../codegen/derive";
import { formatContractForImplementer } from "../codegen/markdown";
import { repairArtifact } from "./repair";
import { upsertRegistryComponent } from "../registry";
import { persistFile } from "../run-store";
import type { StageContext } from "./context";

/**
 * Verify — incremental, artifact-scoped. Only screens whose dependency
 * closure changed are re-verified; only failing files are repaired; at most 2
 * repair rounds, each carrying a single file instead of the whole project.
 */

const MAX_REPAIR_ROUNDS = 2;
const MAX_TARGETS_PER_ROUND = 6;

function repairGuidance(ctx: StageContext, file: string): string | undefined {
  const plan = ctx.state.architecture;
  if (!plan) return undefined;
  const screenMatch = file.match(/^src\/screens\/([A-Za-z0-9]+)\.jsx$/);
  if (screenMatch) {
    const blueprint = plan.screens.find((s) => s.name === screenMatch[1]);
    if (blueprint) return `SCREEN BLUEPRINT (compose it exactly):\n${JSON.stringify(blueprint)}`;
  }
  const component = plan.components.find((c) => pathForComponent(c.name, c.kind, c.ownerScreen) === file);
  if (component) return formatContractForImplementer(component, file);
  return undefined;
}

export async function verifyStage(ctx: StageContext): Promise<void> {
  const plan = ctx.state.architecture;
  if (!plan) throw new Error("verify stage requires architecture in state");

  // Missing screens (generation failed without producing a file) get one
  // complete regeneration through the repair channel.
  const plannedPaths = plan.screens.map((s) => `src/screens/${s.name}.jsx`);
  const missing = plannedPaths.filter((p) => !ctx.files[p]);
  for (const path of missing.slice(0, 3)) {
    if (!ctx.budgetAllowsModelCall()) break;
    ctx.activity(`Regenerating missing screen: ${path}`);
    const fixed = await repairArtifact(
      ctx,
      path,
      "",
      [{ path, message: `Planned screen ${path} was never generated — generate it completely per its blueprint.` }],
      repairGuidance(ctx, path),
    );
    if (fixed && fixed.trim()) {
      ctx.files[path] = fixed;
      await ctx.saveFile({ path, kind: "screen", content: fixed });
    }
  }

  let verify = await ctx.verifier.verify(ctx.files);
  const contractErrors = () => projectContractErrors(ctx.files, plan);
  const allErrors = () => [...verify.errors, ...contractErrors()];

  let round = 0;
  while (allErrors().length > 0 && round < MAX_REPAIR_ROUNDS && ctx.budgetAllowsModelCall()) {
    round++;
    const errors = allErrors();
    ctx.activity(`Verification found ${errors.length} issue${errors.length === 1 ? "" : "s"} — repair round ${round}/${MAX_REPAIR_ROUNDS}`);

    const byFile = new Map<string, SandboxError[]>();
    for (const err of errors) {
      const file = err.file && (ctx.files[err.file] !== undefined || err.file.startsWith("src/")) ? err.file : "(project)";
      byFile.set(file, [...(byFile.get(file) ?? []), err]);
    }

    let fixedAny = false;
    for (const [file, errs] of [...byFile].slice(0, MAX_TARGETS_PER_ROUND)) {
      const fixed = await repairArtifact(
        ctx,
        file,
        ctx.files[file] ?? "",
        errs.map((e) => ({ path: file, line: e.line, message: e.message })),
        repairGuidance(ctx, file),
      );
      if (fixed && fixed.trim() && fixed !== ctx.files[file]) {
        ctx.files[file] = fixed;
        await ctx.saveFile({
          path: file,
          kind: file.includes("/screens/") ? "screen" : file.endsWith(".css") ? "style" : "component",
          content: fixed,
        });
        fixedAny = true;
      }
    }
    if (!fixedAny) break;
    verify = await ctx.verifier.verify(ctx.files);
    if (verify.ok && contractErrors().length === 0) {
      ctx.activity(`All screens verified after repair round ${round}`);
    }
  }

  // ── Deterministic anti-slop audit (project-wide, free) ─────────────────
  const slopByFile = new Map<string, string[]>();
  for (const [path, content] of Object.entries(ctx.files)) {
    if (!path.endsWith(".jsx") && !path.endsWith(".js")) continue;
    const violations = scanAntiSlop(content, ctx.seed.name);
    if (hasHighSeveritySlop(violations)) {
      slopByFile.set(path, violations.filter((v) => v.severity === "high").map((v) => v.message));
    }
  }
  if (slopByFile.size > 0 && ctx.budgetAllowsModelCall()) {
    ctx.activity(`Design gate: repairing ${slopByFile.size} file(s) with high-severity design violations`);
    for (const [path, messages] of [...slopByFile].slice(0, 4)) {
      const repaired = await repairArtifact(
        ctx,
        path,
        ctx.files[path] ?? "",
        messages.map((message) => ({ path, message: `Design violation: ${message}` })),
        repairGuidance(ctx, path),
      );
      if (repaired && repaired.trim()) {
        ctx.files[path] = repaired;
        await ctx.saveFile({ path, kind: path.includes("/screens/") ? "screen" : "component", content: repaired });
      }
    }
    verify = await ctx.verifier.verify(ctx.files);
  }

  // ── Registry heal — repaired components that belong to verified builds ────
  // keep the long-lived registry in sync with their fixed sources.
  if (ctx.projectId && Object.keys(verify.bundles).length > 0) {
    for (const contract of plan.components) {
      const name = toPascalCase(contract.name);
      const componentPath = pathForComponent(name, contract.kind, contract.ownerScreen);
      const source = ctx.files[componentPath];
      if (!source) continue;
      const existing = ctx.registry.find((entry) => entry.name === name);
      if (existing && existing.source !== source) {
        await upsertRegistryComponent(ctx.projectId, { name, kind: contract.kind, contract: { ...contract, name }, source, status: "validated" });
        const idx = ctx.registry.findIndex((entry) => entry.name === name);
        if (idx >= 0) {
          ctx.registry[idx] = { ...ctx.registry[idx], contract: { ...contract, name }, source, sourceHash: "", version: existing.version + 1, status: "validated" };
        }
      }
    }
  }

  // ── Final state ─────────────────────────────────────────────────────────
  const finalErrors = allErrors();
  const verifiedScreens = new Set(Object.keys(verify.bundles));
  for (const [name, js] of Object.entries(verify.bundles)) {
    if (!js) continue;
    if (!ctx.builtScreens.includes(name)) ctx.builtScreens.push(name);
    await persistFile(ctx.runId, { path: `.build/${name}.js`, kind: "build", content: js });
  }

  if (finalErrors.length > 0) {
    const failed = [...new Set(
      finalErrors
        .map((e) => e.file)
        .filter((f): f is string => !!f && f.includes("/screens/"))
        .map(screenNameFromPath),
    )];
    const planned = plan.screens.map((s) => s.name);
    for (const name of planned) {
      if (!verifiedScreens.has(name) && !ctx.builtScreens.includes(name)) {
        ctx.builtScreens = ctx.builtScreens.filter((s) => s !== name);
      }
    }
    ctx.failedScreens = [...new Set([...ctx.failedScreens, ...failed, ...planned.filter((n) => !ctx.builtScreens.includes(n))])];
    ctx.activity(`Verified with warnings — ${ctx.failedScreens.length} screen(s) still have issues`);
    console.error("[pastel-agent] residual sandbox errors:", JSON.stringify(finalErrors.slice(0, 10)));
  } else {
    ctx.activity("Build verified — every screen compiles and renders");
  }
}
