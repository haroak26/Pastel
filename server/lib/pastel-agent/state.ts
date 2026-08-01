import { eq } from "drizzle-orm";
import { db } from "../../db";
import { agentProjectState } from "@shared/schema";
import type {
  ArchitecturePlan,
  BrandStrategy,
  CreativeBrief,
  DesignSystemSpec,
  InformationArchitecture,
  InteractionPlan,
  IntakeBrief,
  LayoutPlan,
  PatternContext,
  ProductSpec,
  ScreenPlan,
  UserFlowPlan,
} from "./schemas/plan-schemas";
import { hashPrompt } from "./codegen/hash";

/**
 * Persistent structured project state — the backbone of the 17-stage pipeline.
 * Every stage reads compact slices of this object and produces exactly one
 * structured artifact; nothing re-derives work another stage completed.
 *
 * Artifact ownership (stage → state field):
 *   1 clarify            → intake
 *   2 creative brief     → creativeBrief
 *   3 product spec       → productSpec
 *   4 brand strategy     → brandStrategy
 *   5 brand kit          → designSystem (brand kit spec — column name kept)
 *   6 information arch.  → informationArchitecture
 *   7 user flows         → userFlowPlan
 *   8 screen plan        → screenPlan
 *   9 layout plan        → layoutPlan
 *   10 component system  → architecture.components
 *   11 pattern retrieval → patternContext
 *   12 composition       → architecture.screens (screen-composition JSON)
 *   13 interactions      → interactionPlan
 */

export interface ProjectState {
  projectId: string;
  intake: IntakeBrief | null;
  creativeBrief: CreativeBrief | null;
  productSpec: ProductSpec | null;
  brandStrategy: BrandStrategy | null;
  /** Stage 5 — the brand kit (design-system spec). Column name kept from v2. */
  designSystem: DesignSystemSpec | null;
  informationArchitecture: InformationArchitecture | null;
  userFlowPlan: UserFlowPlan | null;
  screenPlan: ScreenPlan | null;
  layoutPlan: LayoutPlan | null;
  patternContext: PatternContext | null;
  interactionPlan: InteractionPlan | null;
  /** Assembled component system + screen compositions (stages 10 + 12). */
  architecture: ArchitecturePlan | null;
  styleSeed: string | null;
  decisionLog: string[];
  artifactHashes: Record<string, string>;
  version: number;
}

export function emptyProjectState(projectId: string): ProjectState {
  return {
    projectId,
    intake: null,
    creativeBrief: null,
    productSpec: null,
    brandStrategy: null,
    designSystem: null,
    informationArchitecture: null,
    userFlowPlan: null,
    screenPlan: null,
    layoutPlan: null,
    patternContext: null,
    interactionPlan: null,
    architecture: null,
    styleSeed: null,
    decisionLog: [],
    artifactHashes: {},
    version: 0,
  };
}

export async function loadProjectState(projectId: string): Promise<ProjectState | null> {
  try {
    const [row] = await db
      .select()
      .from(agentProjectState)
      .where(eq(agentProjectState.projectId, projectId))
      .limit(1);
    if (!row) return null;
    return {
      projectId,
      intake: (row.intake as unknown as IntakeBrief) ?? null,
      creativeBrief: (row.creativeBrief as unknown as CreativeBrief) ?? null,
      productSpec: (row.productSpec as unknown as ProductSpec) ?? null,
      brandStrategy: (row.brandStrategy as unknown as BrandStrategy) ?? null,
      designSystem: (row.designSystem as unknown as DesignSystemSpec) ?? null,
      informationArchitecture: (row.informationArchitecture as unknown as InformationArchitecture) ?? null,
      userFlowPlan: (row.userFlowPlan as unknown as UserFlowPlan) ?? null,
      screenPlan: (row.screenPlan as unknown as ScreenPlan) ?? null,
      layoutPlan: (row.layoutPlan as unknown as LayoutPlan) ?? null,
      patternContext: (row.patternContext as unknown as PatternContext) ?? null,
      interactionPlan: (row.interactionPlan as unknown as InteractionPlan) ?? null,
      architecture: (row.architecture as unknown as ArchitecturePlan) ?? null,
      styleSeed: row.styleSeed ?? null,
      decisionLog: Array.isArray(row.decisionLog) ? (row.decisionLog as string[]) : [],
      artifactHashes: (row.artifactHashes as Record<string, string>) ?? {},
      version: row.version ?? 0,
    };
  } catch (err) {
    console.warn("[pastel-agent] loadProjectState failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function saveProjectState(state: ProjectState): Promise<void> {
  try {
    const nextVersion = state.version + 1;
    const values = {
      projectId: state.projectId,
      intake: state.intake as unknown as Record<string, unknown>,
      creativeBrief: state.creativeBrief as unknown as Record<string, unknown>,
      productSpec: state.productSpec as unknown as Record<string, unknown>,
      brandStrategy: state.brandStrategy as unknown as Record<string, unknown>,
      designSystem: state.designSystem as unknown as Record<string, unknown>,
      informationArchitecture: state.informationArchitecture as unknown as Record<string, unknown>,
      userFlowPlan: state.userFlowPlan as unknown as Record<string, unknown>,
      screenPlan: state.screenPlan as unknown as Record<string, unknown>,
      layoutPlan: state.layoutPlan as unknown as Record<string, unknown>,
      patternContext: state.patternContext as unknown as Record<string, unknown>,
      interactionPlan: state.interactionPlan as unknown as Record<string, unknown>,
      architecture: state.architecture as unknown as Record<string, unknown>,
      styleSeed: state.styleSeed,
      decisionLog: state.decisionLog,
      artifactHashes: state.artifactHashes,
      version: nextVersion,
      updatedAt: new Date(),
    };
    const { projectId: _pk, ...setValues } = values;
    await db
      .insert(agentProjectState)
      .values(values)
      .onConflictDoUpdate({ target: [agentProjectState.projectId], set: setValues });
    state.version = nextVersion;
  } catch (err) {
    // State persistence is an optimization — the run must not die because of it.
    console.warn("[pastel-agent] saveProjectState failed:", err instanceof Error ? err.message : err);
  }
}

// ── Intake cache ────────────────────────────────────────────────────────────
//
// The client calls /clarify first and /generate later with the same prompt.
// Re-running the intake model for /generate would duplicate the exact same
// reasoning, so the intake brief is cached by normalized prompt hash.

const INTAKE_TTL_MS = 30 * 60 * 1000;
const INTAKE_CACHE_MAX = 200;
const intakeCache = new Map<string, { at: number; intake: IntakeBrief }>();

export function getCachedIntake(prompt: string): IntakeBrief | null {
  const key = hashPrompt(prompt);
  const hit = intakeCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > INTAKE_TTL_MS) {
    intakeCache.delete(key);
    return null;
  }
  return hit.intake;
}

export function setCachedIntake(prompt: string, intake: IntakeBrief): void {
  const key = hashPrompt(prompt);
  if (intakeCache.size >= INTAKE_CACHE_MAX) {
    intakeCache.delete(intakeCache.keys().next().value!);
  }
  intakeCache.set(key, { at: Date.now(), intake });
}

/** Test hook — clears the in-process intake cache. */
export function clearIntakeCache(): void {
  intakeCache.clear();
}
