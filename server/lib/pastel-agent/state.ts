import { eq } from "drizzle-orm";
import { db } from "../../db";
import { agentProjectState } from "@shared/schema";
import type {
  ArchitecturePlan,
  DesignSystemSpec,
  IntakeBrief,
  ProductSpec,
} from "./schemas/plan-schemas";
import { hashPrompt } from "./codegen/hash";

/**
 * Persistent structured project state — the backbone of the v2 pipeline.
 * Stages consume compact slices of this object; nothing re-derives work
 * another stage already completed.
 */

export interface ProjectState {
  projectId: string;
  intake: IntakeBrief | null;
  productSpec: ProductSpec | null;
  designSystem: DesignSystemSpec | null;
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
    productSpec: null,
    designSystem: null,
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
      productSpec: (row.productSpec as unknown as ProductSpec) ?? null,
      designSystem: (row.designSystem as unknown as DesignSystemSpec) ?? null,
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
    await db
      .insert(agentProjectState)
      .values({
        projectId: state.projectId,
        intake: state.intake as unknown as Record<string, unknown>,
        productSpec: state.productSpec as unknown as Record<string, unknown>,
        designSystem: state.designSystem as unknown as Record<string, unknown>,
        architecture: state.architecture as unknown as Record<string, unknown>,
        styleSeed: state.styleSeed,
        decisionLog: state.decisionLog,
        artifactHashes: state.artifactHashes,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [agentProjectState.projectId],
        set: {
          intake: state.intake as unknown as Record<string, unknown>,
          productSpec: state.productSpec as unknown as Record<string, unknown>,
          designSystem: state.designSystem as unknown as Record<string, unknown>,
          architecture: state.architecture as unknown as Record<string, unknown>,
          styleSeed: state.styleSeed,
          decisionLog: state.decisionLog,
          artifactHashes: state.artifactHashes,
          version: nextVersion,
          updatedAt: new Date(),
        },
      });
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
