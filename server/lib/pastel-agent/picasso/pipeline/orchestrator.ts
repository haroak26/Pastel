import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Brief,
  CreativeDirection,
  Tokens,
  LayoutPlan,
  ComponentsManifest,
  CritiqueResult,
  PicassoPhase,
} from "./types";
import { NICHE_COMPANY_MAP } from "./types";
import { loadMegadesign, loadCompanyDoc, listCompanySlugs, getCompanyTagline } from "./knowledge";
import { generateCreativeDirections, loadContextForStage1 } from "./stage-1-brief";
import { generateTokens, generateTailwindConfig, generateTokensCSS } from "./stage-2-tokens";
import { planLayout, buildComponentManifest } from "./stage-3-layout";
import { generateAllComponents, generateCatalogPage, composeScreens } from "./stage-4-components";
import { renderScreenshots, critiqueScreenshots, decideNextAction } from "./stage-5-render-critique";
import { finalize, generateSummaryReport } from "./stage-6-finalize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PicassoRunConfig {
  projectId: string;
  userId?: string;
  onEvent?: (event: { type: string; phase?: string; message: string; data?: unknown }) => void;
}

const MAX_ITERATIONS = 3;
const OUTPUT_BASE = path.resolve(__dirname, "../output");

export async function runPicassoPipeline(
  brief: Brief,
  config: PicassoRunConfig,
): Promise<{ success: boolean; report: string; exportPath: string }> {
  const { projectId, onEvent } = config;
  const emit = (phase: PicassoPhase, type: string, message: string, data?: unknown) => {
    onEvent?.({ type, phase, message, data });
  };

  const projectDir = path.join(OUTPUT_BASE, projectId);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(projectDir, "tokens"), { recursive: true });
  fs.mkdirSync(path.join(projectDir, "components", "ui"), { recursive: true });

  try {
    // ── Stage 1: Creative direction ───────────────────────────────────
    emit("brief", "stage", "Generating creative directions...");

    const megadesignContent = loadMegadesign();

    const selectedSlugs = brief.companyRefs && brief.companyRefs.length > 0
      ? brief.companyRefs
      : NICHE_COMPANY_MAP[brief.niche].slice(0, 2);

    const companyContents: Record<string, string> = {};
    for (const slug of selectedSlugs) {
      try {
        companyContents[slug] = loadCompanyDoc(slug);
      } catch {
        // skip companies that don't exist in the Picasso knowledge base
      }
    }

    const directions = await generateCreativeDirections({
      brief,
      megadesignContent,
      companyContents,
    });

    emit("brief", "direction", "Creative directions ready", { directions });

    // Use the first direction as chosen (or user-selected if provided)
    const chosenDirection = brief.chosenDirection ?? directions[0];
    brief.chosenDirection = chosenDirection;

    // Write brief
    fs.writeFileSync(
      path.join(projectDir, "brief.json"),
      JSON.stringify({ ...brief, chosenDirection }, null, 2),
    );

    // ── Stage 2: Design tokens ────────────────────────────────────────
    emit("tokens", "stage", "Generating design tokens...");

    if (brief.mode === "both") {
      emit("tokens", "token", "Generating light tokens...");
      const lightTokens = await generateTokens({
        brief: { ...brief, mode: "light" },
        direction: chosenDirection,
        megadesignContent,
        companyContents,
      });

      emit("tokens", "token", "Generating dark tokens...");
      const darkTokens = await generateTokens({
        brief: { ...brief, mode: "dark" },
        direction: chosenDirection,
        megadesignContent,
        companyContents,
      });

      fs.writeFileSync(
        path.join(projectDir, "tokens", "tokens-light.json"),
        JSON.stringify(lightTokens, null, 2),
      );
      fs.writeFileSync(
        path.join(projectDir, "tokens", "tokens-dark.json"),
        JSON.stringify(darkTokens, null, 2),
      );

      const tokensCSS = generateTokensCSS(lightTokens) + "\n.dark {\n" + darkVarsBlock(darkTokens) + "\n}\n";
      fs.writeFileSync(path.join(projectDir, "tokens", "tokens.css"), tokensCSS);

      var tokens = lightTokens;
      var tailwindConfig = generateTailwindConfig(lightTokens);
      var tokensCSSContent = tokensCSS;
    } else {
      tokens = await generateTokens({
        brief,
        direction: chosenDirection,
        megadesignContent,
        companyContents,
      });

      fs.writeFileSync(
        path.join(projectDir, "tokens", "tokens.json"),
        JSON.stringify(tokens, null, 2),
      );

      tokensCSSContent = generateTokensCSS(tokens);
      fs.writeFileSync(path.join(projectDir, "tokens", "tokens.css"), tokensCSSContent);

      tailwindConfig = generateTailwindConfig(tokens);
    }

    fs.writeFileSync(path.join(projectDir, "tokens", "tailwind.config.ts"), tailwindConfig);

    emit("tokens", "token", "Design tokens generated");

    // ── Stage 3: Layout & IA ──────────────────────────────────────────
    emit("layout", "stage", "Planning layout and information architecture...");

    const layoutPlan = await planLayout(brief, tokens);
    fs.writeFileSync(
      path.join(projectDir, "layout-plan.json"),
      JSON.stringify(layoutPlan, null, 2),
    );

    const componentsManifest = await buildComponentManifest(brief, layoutPlan);
    fs.writeFileSync(
      path.join(projectDir, "components-manifest.json"),
      JSON.stringify(componentsManifest, null, 2),
    );

    emit("layout", "stage", `Layout plan: ${layoutPlan.screens.length} screens, ${componentsManifest.entries.length} components`);

    // ── Stage 4: Component generation ──────────────────────────────────
    emit("components", "stage", `Generating ${componentsManifest.entries.length} components...`);

    const generatedFiles = await generateAllComponents(
      componentsManifest,
      tokens,
      tokensCSSContent,
      brief,
    );

    for (const [name, code] of Object.entries(generatedFiles)) {
      const filePath = path.join(projectDir, "components", "ui", `${name}.tsx`);
      fs.writeFileSync(filePath, code);
      emit("components", "component", `Generated: ${name}`);
    }

    const catalogPage = await generateCatalogPage(componentsManifest, tokens);
    fs.writeFileSync(path.join(projectDir, "catalog", "page.tsx"), catalogPage);

    const screenFiles = await composeScreens(
      brief,
      layoutPlan,
      tokens,
      componentsManifest,
      generatedFiles,
    );

    for (const [name, code] of Object.entries(screenFiles)) {
      const screenDir = path.join(projectDir, "app", name);
      fs.mkdirSync(screenDir, { recursive: true });
      fs.writeFileSync(path.join(screenDir, "page.tsx"), code);
      emit("components", "file", `Composed screen: ${name}`);
    }

    // ── Stage 5: Render & Critique (loop) ─────────────────────────────
    emit("critique", "stage", "Rendering screenshots and running visual critique...");

    let allCritiqueResults: CritiqueResult[] = [];
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      emit("critique", "stage", `Critique iteration ${iteration}/${MAX_ITERATIONS}...`);

      const screenshots = await renderScreenshots({
        generatedFiles: { ...generatedFiles, ...screenFiles },
        catalogPage,
        tokens,
        tokensCSS: tokensCSSContent,
        brief,
      });

      const results = await critiqueScreenshots({
        screenshots,
        brief,
        tokens,
      });

      allCritiqueResults = results;

      const allPassed = results.every((r) => r.passed);
      if (allPassed) {
        emit("critique", "critique", "All screens passed critique!");
        break;
      }

      const failingResults = results.filter((r) => !r.passed);
      const decision = decideNextAction(failingResults, iteration, MAX_ITERATIONS);

      if (!decision.shouldLoop) {
        emit("critique", "critique", "Max iterations reached, proceeding with best version");
        break;
      }

      emit("critique", "critique", `Failing: ${failingResults.map((r) => r.diagnosis).join("; ")}. Routing to: ${decision.routeTo}`);

      // Route to the narrowest fix
      if (decision.shouldRegenTokens) {
        emit("tokens", "stage", "Regenerating tokens based on critique...");
        tokens = await generateTokens({
          brief,
          direction: chosenDirection,
          megadesignContent,
          companyContents,
        });
        tokensCSSContent = generateTokensCSS(tokens);
        continue;
      }

      if (decision.shouldRegenLayout) {
        emit("layout", "stage", "Re-planning layout based on critique...");
        continue;
      }

      // Regenerate specific components
      if (decision.affectedIds.length > 0) {
        emit("components", "stage", `Regenerating ${decision.affectedIds.length} components...`);
        for (const id of decision.affectedIds) {
          const entry = componentsManifest.entries.find((e) => e.id === id || e.name === id);
          if (entry) {
            const { generateComponent } = await import("./stage-4-components");
            const code = await generateComponent({
              entry,
              tokens,
              tokensCSS: tokensCSSContent,
              briefContext: `Critique feedback: ${failingResults.map((r) => r.diagnosis).join(". ")}`,
            });
            generatedFiles[entry.name] = code;
            fs.writeFileSync(path.join(projectDir, "components", "ui", `${entry.name}.tsx`), code);
          }
        }
      }
    }

    // Persist critique results
    fs.writeFileSync(
      path.join(projectDir, "critique-results.json"),
      JSON.stringify(allCritiqueResults, null, 2),
    );

    // ── Stage 6: Finalize ─────────────────────────────────────────────
    emit("finalize", "stage", "Finalizing: linting, accessibility audit, export...");

    const report = await finalize({
      projectId,
      brief,
      tokens,
      tokensCSS: tokensCSSContent,
      tailwindConfig,
      generatedFiles,
      catalogPage,
      screenFiles,
      critiqueResults: allCritiqueResults,
      manifest: componentsManifest,
    });

    fs.writeFileSync(
      path.join(projectDir, "report.md"),
      generateSummaryReport(report),
    );

    emit("done", "done", "Pipeline complete", { report, exportPath: report.exportPath });

    return {
      success: allCritiqueResults.every((r) => r.passed) || iteration >= MAX_ITERATIONS,
      report: generateSummaryReport(report),
      exportPath: report.exportPath,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit("error", "error", `Pipeline error: ${message}`);
    throw err;
  }
}

function darkVarsBlock(tokens: Tokens): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(tokens.color.neutral)) {
    lines.push(`  --color-neutral-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.accent)) {
    lines.push(`  --color-accent-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.surface)) {
    lines.push(`  --color-surface-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.text)) {
    lines.push(`  --color-text-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.color.border)) {
    lines.push(`  --color-border-${k}: ${v};`);
  }
  return lines.join("\n");
}

export { loadMegadesign, loadCompanyDoc, listCompanySlugs, getCompanyTagline };
