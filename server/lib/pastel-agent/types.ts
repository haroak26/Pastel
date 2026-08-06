export interface BrandKit {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  sizes: Record<string, string>;
  radius: Record<string, string>;
  shadows?: Record<string, string>;
}

export type RunKind = "full" | "solo";

// ── Pipeline phases (wire contract — client UI) ──────────────────────────

export type PastelPhase =
  | "discovery"
  | "brief"
  | "wireframe"
  | "build"
  | "assemble"
  | "review"
  | "present";

export const PHASE_ORDER: PastelPhase[] = ["discovery", "brief", "wireframe", "build", "assemble", "present", "review"];
export type PhaseStatus = "idle" | "running" | "done" | "error";

// ── SSE events (wire contract) ──────────────────────────────────────────

export interface PastelEvent {
  type:
    | "phase"
    | "agent"
    | "title"
    | "doc"
    | "file"
    | "activity"
    | "qaroute"
    | "screens"
    | "done"
    | "error";
  phase?: PastelPhase;
  status?: PhaseStatus;
  message?: string;
  doc?: { path: string; title: string; kind: string; content: string };
  file?: { path: string; kind: string; content: string };
  title?: string;
  screens?: string[];
  result?: unknown;
  agent?: string;
  agentStatus?: string;
  attempt?: number;
  qaRoute?: { target: string; targetAgent: string; reason: string };
}

// ── Manifest + run metadata ─────────────────────────────────────────────

export interface AgentManifest {
  screens: string[];
  docs: string[];
  brandKit: BrandKit | null;
  styleSeed: string | null;
  phases: Record<string, PhaseStatus>;
  failedScreens: string[];
  costs?: { entries: Array<{ stage: string; modelId: string; inputChars: number; outputChars: number; credits: number }>; totalCredits: number; totalDollars: number };
  quality?: { passed: boolean; score?: number; repairs?: number };
}
