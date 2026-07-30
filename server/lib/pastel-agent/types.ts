export interface BrandKit {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  sizes: Record<string, string>;
  radius: Record<string, string>;
}

/** Pipeline phases for the multi-model agent loop. */
export type PastelPhase =
  | "brief"
  | "plan"
  | "build"
  | "verify"
  | "present";

export const PHASE_ORDER: PastelPhase[] = ["brief", "plan", "build", "verify", "present"];

export type PhaseStatus = "idle" | "running" | "done" | "error";

export interface PastelEvent {
  /** phase | title | doc | file | activity | done | error */
  type:
    | "phase"
    | "title"
    | "doc"
    | "file"
    | "activity"
    | "done"
    | "error";
  phase?: PastelPhase;
  status?: PhaseStatus;
  message?: string;
  /** doc events */
  doc?: { path: string; title: string; kind: string; content: string };
  /** file events */
  file?: { path: string; kind: string; content: string };
  /** title events */
  title?: string;
  /** done event result */
  result?: unknown;
}

export interface SitemapScreen {
  id: string;
  name: string;
  purpose: string;
  sections: string[];
  components: string[];
}

export interface Sitemap {
  screens: SitemapScreen[];
  components: string[];
}

export interface AgentManifest {
  screens: string[];
  docs: string[];
  brandKit: BrandKit | null;
  phases: Record<string, PhaseStatus>;
  /** screens that failed verification after all fix rounds */
  failedScreens: string[];
}

export interface GeneratedFile {
  path: string;
  kind: "screen" | "component" | "style" | "entry";
  content: string;
}

export type StyleSeed = {
  name: string;
  mood: string[];
  spatialPhilosophy: string;
  typographicAttitude: string;
  colorTemperature: string;
  textureApproach: string;
  creativeDirection: string;
};
