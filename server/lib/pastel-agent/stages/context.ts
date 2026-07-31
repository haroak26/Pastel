import type {
  AgentManifest,
  BrandKit,
  CostLedgerEntry,
  PastelEvent,
  PastelPhase,
  RegistryStats,
  RunKind,
  RunQualityStats,
  StyleSeed,
} from "../types";
import type { ProjectState } from "../state";
import type { RegistryComponent } from "../registry";
import { IncrementalScreenVerifier } from "../sandbox";
import {
  emitEvent,
  updateRun,
  mergeManifest,
  persistDoc,
  persistFile,
} from "../run-store";
import { calcCost } from "../../pricing";

/**
 * StageContext — everything a stage may touch. Stages read compact state
 * slices, produce structured artifacts, and never re-derive each other's work.
 */
export interface StageContext {
  runId: string;
  runKind: RunKind;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;

  /** persistent structured state (working copy, persisted after each stage) */
  state: ProjectState;
  seed: StyleSeed;
  styleDirection: string;

  /** the virtual file system under construction */
  files: Record<string, string>;
  registry: RegistryComponent[];
  verifier: IncrementalScreenVerifier;

  brandKit: BrandKit | null;
  failedScreens: string[];
  builtScreens: string[];
  ledger: CostLedgerEntry[];
  registryStats: RegistryStats;
  quality: RunQualityStats;
  maxCredits: number;

  emit(event: PastelEvent): void;
  activity(message: string): void;
  setPhase(phase: PastelPhase, status: "running" | "done" | "error"): Promise<void>;
  saveDoc(doc: { path: string; title: string; kind: string; content: string }): Promise<void>;
  saveFile(file: { path: string; kind: string; content: string }): Promise<void>;
  trackCost(stage: string, modelId: string, inputChars: number, outputChars: number): void;
  usedCredits(): number;
  /** true while repair/optional model calls are affordable */
  budgetAllowsModelCall(): boolean;
}

export interface StageContextInit {
  runId: string;
  runKind: RunKind;
  prompt: string;
  answers: Record<string, string>;
  projectId: string | null;
  userId?: string;
  holdId?: string;
  state: ProjectState;
  seed: StyleSeed;
  styleDirection: string;
  files: Record<string, string>;
  registry: RegistryComponent[];
  maxCredits: number;
}

export function createStageContext(init: StageContextInit): StageContext {
  const emit = (event: PastelEvent) => emitEvent(init.runId, event);
  const activity = (message: string) => emit({ type: "activity", message });

  const ctx: StageContext = {
    runId: init.runId,
    runKind: init.runKind,
    prompt: init.prompt,
    answers: init.answers,
    projectId: init.projectId,
    userId: init.userId,
    holdId: init.holdId,
    state: init.state,
    seed: init.seed,
    styleDirection: init.styleDirection,
    files: init.files,
    registry: init.registry,
    verifier: new IncrementalScreenVerifier(),
    brandKit: null,
    failedScreens: [],
    builtScreens: [],
    ledger: [],
    registryStats: { reused: 0, generated: 0, fallback: 0 },
    quality: { repairs: 0, gatePassedFirstTry: false },
    maxCredits: init.maxCredits,
    emit,
    activity,

    async setPhase(phase, status) {
      emit({ type: "phase", phase, status });
      const manifest = await mergeManifest(init.runId, { phases: { [phase]: status } as AgentManifest["phases"] });
      await updateRun(init.runId, { phase, manifest: manifest as unknown as Record<string, unknown> });
    },

    async saveDoc(doc) {
      await persistDoc(init.runId, doc);
      emit({ type: "doc", doc });
      const state = await mergeManifest(init.runId, {});
      const docs = [...new Set([...(state.docs ?? []), doc.path])];
      await mergeManifest(init.runId, { docs });
    },

    async saveFile(file) {
      await persistFile(init.runId, file);
      emit({ type: "file", file });
    },

    trackCost(stage, modelId, inputChars, outputChars) {
      const cost = calcCost(modelId, inputChars, outputChars);
      ctx.ledger.push({ stage, modelId, inputChars, outputChars, credits: cost.credits });
    },

    usedCredits() {
      return Math.round(ctx.ledger.reduce((sum, entry) => sum + entry.credits, 0) * 100) / 100;
    },

    budgetAllowsModelCall() {
      return ctx.usedCredits() < ctx.maxCredits;
    },
  };

  return ctx;
}
