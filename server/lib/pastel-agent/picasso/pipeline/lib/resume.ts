import type { Brief, Tokens, LayoutPlan, ComponentsManifest, PropContract } from "../types";
import type { DiscoveryOutput } from "../stage-1-discovery";
import type { ArchitectureOutput } from "../stage-3-wireframe";
import type { ContentOutput } from "../stage-4-build";
import type { MotionSpec } from "../stage-2-design-system";
import type { Stage2Direction } from "../stage-2-design-system";

/**
 * V8 checkpoint/resume (§4.3) — stage artifacts are persisted to the run's
 * doc store as each stage completes; on restart with the same runId (or an
 * explicit resume path) the orchestrator loads the persisted artifacts and
 * skips stages that already completed instead of re-paying for discovery →
 * architecture from scratch. This directly fixes the DIAGNOSIS.md §1 defect:
 * "stages 1-4 are re-generated from scratch on restart, re-paying the full
 * model cost".
 */

export interface ResumeLoaders {
  loadDoc(path: string): Promise<string | null> | string | null;
  loadFile(path: string): Promise<string | null> | string | null;
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface ResumedArtifacts {
  discovery: DiscoveryOutput | null;
  tokens: Tokens | null;
  globalsCSS: string | null;
  motionSpec: MotionSpec | null;
  directions: Stage2Direction[] | null;
  architecture: (ArchitectureOutput & { propContract?: PropContract }) | null;
  /** True when the architecture was already approved in a previous run. */
  wireframeApproved: boolean;
  content: ContentOutput | null;
  components: Record<string, string> | null;
  screens: Record<string, string> | null;
}

export async function loadResumableArtifacts(loaders: ResumeLoaders): Promise<ResumedArtifacts> {
  const [discovery, tokens, motionSpec, directions, layoutPlan, componentsManifest, propContractRaw, brandKit, contentData, copyPlan, globalsCSS, checkpoint] = await Promise.all([
    loaders.loadDoc("docs/planning/Discovery.json"),
    loaders.loadDoc("docs/design/DesignTokens.json"),
    loaders.loadDoc("docs/design/MotionSpec.json"),
    loaders.loadDoc("docs/design/CreativeDirections.json"),
    loaders.loadDoc("docs/planning/WireframePlan.json"),
    loaders.loadDoc("docs/planning/ComponentManifest.json"),
    loaders.loadDoc("docs/planning/PropContract.json"),
    loaders.loadDoc("docs/design/BrandKit.json"),
    loaders.loadDoc("docs/planning/ContentData.json"),
    loaders.loadDoc("docs/planning/CopyPlan.json"),
    loaders.loadFile("src/globals.css"),
    loaders.loadDoc("docs/checkpoints/checkpoint.json"),
  ]);

  const ck = parse<{ stages?: Record<string, { status?: string }> }>(checkpoint, {});
  const wireframeApproved = ck.stages?.["wireframe"]?.status === "done";

  const layout = parse<LayoutPlan | null>(layoutPlan, null);
  const manifest = parse<ComponentsManifest | null>(componentsManifest, null);
  const propContract = parse<PropContract | null>(propContractRaw, null);
  const architecture = layout && manifest
    ? {
        layoutPlan: layout,
        componentsManifest: manifest,
        ...(propContract ? { propContract } : {}),
        brandKit: parse<ArchitectureOutput["brandKit"]>(brandKit, {
          colorRules: { accentUsage: "", semanticUsage: "", neutralUsage: "", forbiddenPatterns: [] },
          typographyRules: { displayUsage: "", bodyUsage: "", monoUsage: "", weightRules: "", sizeRules: "" },
          spacingRules: { sectionMargins: "", componentPadding: "", rhythmDescription: "" },
          motionRules: { transitions: "", easing: "", duration: "" },
          signatureMoves: [],
          antiPatterns: [],
          generatedAt: "",
        }),
        uxDesignPlan: { navigationStrategy: "", surfaceRhythm: "", interactionPatterns: "", densityStrategy: "", primaryActionPerScreen: {}, generatedAt: "" },
        componentInventory: manifest.entries.map((e) => ({
          id: e.id, name: e.name, taxonomy: e.taxonomy,
          complexity: Object.keys(e.props).length > 6 || e.taxonomy === "organism" ? "high" as const : e.taxonomy === "molecule" ? "medium" as const : "low" as const,
        })),
      }
    : null;

  const content = contentData
    ? {
        data: parse(contentData, null),
        copy: parse<{ screens: ContentOutput["copy"]["screens"] }>(copyPlan, { screens: {} }),
        coherenceReport: { valid: true, issues: [] },
      }
    : null;

  const components = await loadComponentFiles(loaders, manifest);
  const screens = await loadScreenFiles(loaders, layout);

  return {
    discovery: parse<DiscoveryOutput | null>(discovery, null),
    tokens: parse<Tokens | null>(tokens, null),
    globalsCSS: globalsCSS ?? null,
    motionSpec: parse<MotionSpec | null>(motionSpec, null),
    directions: parse<Stage2Direction[] | null>(directions, null),
    architecture,
    wireframeApproved,
    content: content && content.data ? (content as unknown as ContentOutput) : null,
    components,
    screens,
  };
}

async function loadComponentFiles(loaders: ResumeLoaders, manifest: ComponentsManifest | null): Promise<Record<string, string> | null> {
  if (!manifest) return null;
  const files: Record<string, string> = {};
  const ids = new Set(manifest.entries.map((e) => e.id));
  // Probe manifest ids, then any sibling bases they import (dependency
  // closure files persist under their base name).
  const queue = [...ids];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (files[id] !== undefined) continue;
    const raw = await loaders.loadFile(`src/components/${id}.tsx`);
    if (!raw) continue;
    files[id] = raw;
    for (const sibling of scanRelativeImports(raw)) {
      if (!ids.has(sibling) && !SUPPORT.has(sibling) && !queue.includes(sibling) && files[sibling] === undefined) {
        queue.push(sibling);
      }
    }
  }
  return Object.keys(files).length > 0 ? files : null;
}

async function loadScreenFiles(loaders: ResumeLoaders, layout: LayoutPlan | null): Promise<Record<string, string> | null> {
  if (!layout) return null;
  const files: Record<string, string> = {};
  for (const s of layout.screens) {
    const raw = await loaders.loadFile(`src/screens/${s.id}.tsx`);
    if (raw) files[s.id] = raw;
  }
  return Object.keys(files).length > 0 ? files : null;
}

const SUPPORT = new Set(["cn", "use-mobile"]);

function scanRelativeImports(code: string): string[] {
  const out: string[] = [];
  const re = /from\s+["']\.\/([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    out.push(m[1].replace(/\.(?:tsx|ts|jsx|js)$/, "").trim());
  }
  return out.filter((n) => n && n !== ".");
}

/** Convenience: does a resume look-up carry any artifacts at all? */
export function hasResumableArtifacts(r: ResumedArtifacts): boolean {
  return !!(r.discovery || r.tokens || r.architecture || r.components || r.screens || r.content);
}

export type { Brief };
