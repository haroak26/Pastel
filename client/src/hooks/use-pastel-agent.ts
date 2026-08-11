import { useState, useCallback, useRef, useEffect } from "react";

const CLARIFY_KEY = "pastel.agent.clarify.v6";

function saveClarifyState(data: Record<string, unknown>) {
  try { sessionStorage.setItem(CLARIFY_KEY, JSON.stringify(data)); } catch {}
}

function loadClarifyState<T>(key: string): T | undefined {
  try {
    const raw = sessionStorage.getItem(CLARIFY_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw)[key] as T;
  } catch { return undefined; }
}

function clearClarifyState() {
  try { sessionStorage.removeItem(CLARIFY_KEY); } catch {}
}

/** V14 pipeline phases — the agent panel timeline. V8 adds wireframe-review. */
export type AgentPhase = "discovery" | "design" | "brief" | "data" | "wireframe" | "wireframe-review" | "build" | "assemble" | "present" | "review";

export const PHASE_ORDER: AgentPhase[] = ["discovery", "design", "brief", "data", "wireframe", "wireframe-review", "build", "assemble", "present", "review"];

export const PHASE_LABELS: Record<AgentPhase, string> = {
  discovery: "Discovery",
  design: "Design System",
  brief: "Brief",
  data: "Content & Data",
  wireframe: "Wireframe",
  "wireframe-review": "Wireframe Review",
  build: "Components",
  assemble: "Assembly",
  present: "Present",
  review: "Review",
};

export const PHASE_DESCRIPTIONS: Record<AgentPhase, string> = {
  discovery: "Picking your inspiration and answering a few questions",
  design: "Creating the design tokens — brand colors, radius, sizing, and fonts",
  brief: "Selecting the reference companies and building the product brief",
  data: "Writing all the page content — metrics, items, reviews, and CTAs",
  wireframe: "Producing page wireframes and the component inventory",
  "wireframe-review": "Confirming the wireframes before any component work begins",
  build: "Planning and building every component in parallel",
  assemble: "Composing the screens and verifying them in the sandbox",
  present: "Presenting your rendered screens — they're live now",
  review: "Visual review of the renders + quality gate against the brief",
};

export interface PhaseState {
  status: "idle" | "running" | "done" | "error";
}

export interface DocItem {
  path: string;
  title: string;
  kind: string;
  content: string;
}

export interface FileItem {
  path: string;
  kind: string;
  content: string;
}

export interface BrandKit {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  sizes: Record<string, string>;
  radius: Record<string, string>;
}

export interface ClarifyQuestion {
  id: string;
  title: string;
  question: string;
  whyItMatters: string;
  options: Array<{ label: string; description: string }>;
  placeholder?: string;
}

/** Company design reference from the knowledge base (gallery card). */
export interface CompanyCatalogItem {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  swatches: string[];
  /** V10: auth'd preview image URL (when the company ships one). */
  imageUrl?: string;
}

export interface SuggestedCompany {
  slug: string;
  name: string;
  score: number;
  reason?: string;
}

export interface ActivityItem {
  id: number;
  message: string;
  ts: number;
  isSkill?: boolean;
}

export interface SkillState {
  loaded: string[];
  loading: string | null;
  totalPacks: number;
}

/** V8: wireframe confirmation-gate review payload (mirrors the pipeline's). */
export interface WireframeReviewPayload {
  phase: "wireframe-review";
  screens: Array<{
    id: string;
    name: string;
    route: string;
    dominantMoment: string;
    regions: Array<{
      name: string;
      role: string;
      hierarchy: string;
      purpose: string;
      components: Array<{ name: string; taxonomy: string; description: string }>;
    }>;
  }>;
  accent: string;
  radius: string;
  seed: string;
  revisionsUsed: number;
}

interface PastelEvent {
  type: "phase" | "agent" | "title" | "doc" | "file" | "activity" | "qaroute" | "screens" | "wireframes" | "done" | "error";
  phase?: AgentPhase;
  status?: "running" | "done" | "error";
  message?: string;
  doc?: DocItem;
  file?: FileItem;
  title?: string;
  screens?: string[];
  wireframes?: WireframeReviewPayload;
  agent?: string;
  agentStatus?: "pending" | "started" | "completed" | "failed" | "retrying" | "skipped";
  attempt?: number;
  qaRoute?: { target: string; targetAgent: string; reason: string };
  result?: {
    screens?: string[];
    docs?: string[];
    brandKit?: BrandKit | null;
    failedScreens?: string[];
  };
}

const IDLE_PHASES: Record<AgentPhase, PhaseState> = {
  discovery: { status: "idle" },
  design: { status: "idle" },
  brief: { status: "idle" },
  data: { status: "idle" },
  wireframe: { status: "idle" },
  "wireframe-review": { status: "idle" },
  build: { status: "idle" },
  assemble: { status: "idle" },
  present: { status: "idle" },
  review: { status: "idle" },
};

let activityCounter = 0;

export function usePastelAgent(projectId: string | null) {
  // ── Clarify state (pre-run, session-cached) ──
  const [questions, setQuestions] = useState<ClarifyQuestion[] | null>(loadClarifyState("questions") ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>(loadClarifyState("answers") ?? {});
  const [awaitingAnswers, setAwaitingAnswers] = useState(loadClarifyState("awaitingAnswers") ?? false);
  const [pendingPrompt, setPendingPrompt] = useState(loadClarifyState("pendingPrompt") ?? "");
  const [isClarifying, setIsClarifying] = useState(false);
  const [suggestedCompanies, setSuggestedCompanies] = useState<SuggestedCompany[]>(loadClarifyState("suggestedCompanies") ?? []);
  const [inspiration, setInspiration] = useState<string>(loadClarifyState("inspiration") ?? "");
  const [secondaryInspiration, setSecondaryInspiration] = useState<string[]>(loadClarifyState("secondaryInspiration") ?? []);

  // ── Knowledge base catalog (gallery) ──
  const [catalog, setCatalog] = useState<CompanyCatalogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pastel-agent/knowledge", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.companies)) setCatalog(data.companies);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Run state (server-persisted, restored on mount) ──
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [phases, setPhases] = useState<Record<AgentPhase, PhaseState>>(IDLE_PHASES);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [files, setFiles] = useState<Record<string, FileItem>>({});
  const [screens, setScreens] = useState<string[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [failedScreens, setFailedScreens] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(!!projectId);
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [skills, setSkills] = useState<SkillState>({ loaded: [], loading: null, totalPacks: 0 });
  // V8 §4.4: pending wireframe review payload (null when not blocked).
  const [wireframeReview, setWireframeReview] = useState<WireframeReviewPayload | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const restoredRef = useRef(false);

  const pushActivity = useCallback((message: string) => {
    const isSkill = message.startsWith("Reading ") && message.endsWith(" skill ✓");
    const isSkillStart = message.startsWith("Reading ") && message.includes(" skill...");
    const isSkillsLoaded = message.startsWith("Skills loaded:");

    setActivity((prev) => [...prev.slice(-199), { id: ++activityCounter, message, ts: Date.now(), isSkill: isSkill || isSkillStart }]);

    if (isSkill) {
      const skillName = message.replace("Reading ", "").replace(" skill ✓", "").trim();
      setSkills((s) => ({ ...s, loaded: [...s.loaded, skillName], loading: null }));
    } else if (isSkillStart) {
      const skillName = message.replace("Reading ", "").replace(" skill...", "").trim();
      setSkills((s) => ({ ...s, loading: skillName }));
    } else if (isSkillsLoaded) {
      const match = message.match(/Skills loaded: (\d+) packs loaded/);
      setSkills((s) => ({ ...s, totalPacks: match ? parseInt(match[1]) : s.totalPacks }));
    }
  }, []);

  // ── SSE attach ──
  const attachToStream = useCallback((id: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch(`/api/pastel-agent/runs/${id}/events`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            try {
              const event: PastelEvent = JSON.parse(trimmed.slice(6));
              handleEvent(event);
            } catch {}
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[pastel-agent] stream error:", err?.message || err);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEvent = useCallback((event: PastelEvent) => {
    switch (event.type) {
      case "phase":
        if (event.phase && event.status) {
          setPhases((prev) => ({ ...prev, [event.phase!]: { status: event.status! } }));
          if (event.status === "running") setStatus("running");
        }
        break;
      case "title":
        if (event.title) setTitle(event.title);
        break;
      case "doc":
        if (event.doc) {
          setDocs((prev) => {
            const idx = prev.findIndex((d) => d.path === event.doc!.path);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = event.doc!;
              return next;
            }
            return [...prev, event.doc!].sort((a, b) => a.path.localeCompare(b.path));
          });
        }
        break;
      case "file":
        if (event.file) {
          setFiles((prev) => ({ ...prev, [event.file!.path]: event.file! }));
        }
        break;
      case "activity":
        if (event.message) pushActivity(event.message);
        break;
      case "agent":
        if (event.agent && event.agentStatus === "retrying") {
          pushActivity(`${event.agent} retrying (attempt ${event.attempt ?? 2})`);
        }
        break;
      case "qaroute":
        if (event.qaRoute) {
          pushActivity(`QA routed: ${event.qaRoute.targetAgent} takes ${event.qaRoute.target}`);
        }
        break;
      case "screens":
        if (event.screens) setScreens(event.screens);
        break;
      case "wireframes":
        // V8 §4.4: the pipeline is blocked at the confirmation gate until
        // the user posts approve/revise/cancel.
        if (event.wireframes) {
          setWireframeReview(event.wireframes);
          pushActivity("Wireframes ready for review — approve or request changes before any components are built.");
        }
        break;
      case "done":
        setStatus("done");
        setWireframeReview(null);
        if (event.result?.screens) setScreens(event.result.screens);
        if (event.result?.brandKit) setBrandKit(event.result.brandKit);
        if (event.result?.failedScreens) setFailedScreens(event.result.failedScreens);
        break;
      case "error":
        setStatus("error");
        setError(event.message || "Generation failed");
        break;
    }
  }, [pushActivity]);

  // ── Restore latest run for this project (refresh-safe) ──
  useEffect(() => {
    if (!projectId || restoredRef.current) return;
    restoredRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/pastel-agent/projects/${projectId}/state`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.run) return;
        setRunId(data.run.id);
        setTitle(data.run.title ?? null);
        setOriginalPrompt(data.run.prompt ?? "");
        if (data.run.error) setError(data.run.error);

        const manifest = (data.run.manifest ?? {}) as {
          screens?: string[];
          brandKit?: BrandKit | null;
          phases?: Record<string, "idle" | "running" | "done" | "error">;
          failedScreens?: string[];
        };

        if (manifest.brandKit) setBrandKit(manifest.brandKit);
        if (manifest.screens) setScreens(manifest.screens);
        if (manifest.failedScreens) setFailedScreens(manifest.failedScreens);
        if (Array.isArray(data.docs)) setDocs(data.docs);
        if (Array.isArray(data.files)) {
          const map: Record<string, FileItem> = {};
          for (const f of data.files) map[f.path] = f;
          setFiles(map);
        }

        if (data.run.status === "running" || data.liveStatus === "running") {
          setStatus("running");
          setPhases((prev) => {
            const next = { ...prev };
            for (const p of PHASE_ORDER) {
              const s = manifest.phases?.[p];
              next[p] = { status: s === "done" || s === "error" ? s : p === data.livePhase ? "running" : next[p].status };
            }
            return next;
          });
          pushActivity("Reconnected — the agent is still working");
          attachToStream(data.run.id);
        } else if (data.run.status === "done") {
          setStatus("done");
          const next = { ...IDLE_PHASES };
          for (const p of PHASE_ORDER) {
            next[p] = { status: manifest.phases?.[p] === "error" ? "error" : "done" };
          }
          setPhases(next);
        } else if (data.run.status === "error") {
          setStatus("error");
        }
      } catch (err: any) {
        console.error("[pastel-agent] restore error:", err?.message || err);
      } finally {
        setIsRestoring(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Clarify ──
  const clarify = useCallback(async (prompt: string) => {
    setError(null);
    setQuestions(null);
    setAnswers({});
    setSuggestedCompanies([]);
    setAwaitingAnswers(true);
    setPendingPrompt(prompt);
    setIsClarifying(true);
    clearClarifyState();

    try {
      const res = await fetch("/api/pastel-agent/clarify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const text = await res.text();
      if (!res.ok) {
        let message = "Failed to generate questions";
        try { message = JSON.parse(text).message || message; } catch {}
        throw new Error(message);
      }
      const data = JSON.parse(text);
      const qs = Array.isArray(data.questions) ? data.questions : [];
      const suggestions = Array.isArray(data.suggestedCompanies) ? data.suggestedCompanies : [];
      setSuggestedCompanies(suggestions);

      if (qs.length === 0) {
        setAwaitingAnswers(false);
        setIsClarifying(false);
        start(prompt, {});
        return;
      }
      setQuestions(qs);
      saveClarifyState({ questions: qs, answers: {}, awaitingAnswers: true, pendingPrompt: prompt, suggestedCompanies: suggestions, inspiration: "", secondaryInspiration: [] });
    } catch (err: any) {
      setError(err.message || "Failed to generate questions");
      setStatus("error");
      setAwaitingAnswers(false);
    } finally {
      setIsClarifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      saveClarifyState({ questions, answers: next, awaitingAnswers: true, pendingPrompt, suggestedCompanies, inspiration, secondaryInspiration });
      return next;
    });
  }, [questions, pendingPrompt, suggestedCompanies, inspiration, secondaryInspiration]);

  const chooseInspiration = useCallback((slug: string, secondary = false) => {
    if (!secondary) {
      setInspiration(slug);
      saveClarifyState({ questions, answers, awaitingAnswers: true, pendingPrompt, suggestedCompanies, inspiration: slug, secondaryInspiration });
    } else {
      setSecondaryInspiration((prev) => {
        const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
        saveClarifyState({ questions, answers, awaitingAnswers: true, pendingPrompt, suggestedCompanies, inspiration, secondaryInspiration: next });
        return next;
      });
    }
  }, [questions, answers, pendingPrompt, suggestedCompanies, inspiration, secondaryInspiration]);

  // ── Start a run ──
  const start = useCallback(async (prompt: string, answerMap: Record<string, string>) => {
    abortRef.current?.abort();
    clearClarifyState();
    setRunId(null);
    setStatus("running");
    setPhases(IDLE_PHASES);
    setDocs([]);
    setFiles({});
    setScreens([]);
    setBrandKit(null);
    setTitle(null);
    setActivity([]);
    setFailedScreens([]);
    setError(null);
    setSkills({ loaded: [], loading: null, totalPacks: 0 });
    setWireframeReview(null);
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    setOriginalPrompt(prompt);

    const enriched = { ...answerMap };
    if (inspiration) enriched["inspiration"] = inspiration;
    if (secondaryInspiration.length > 0) enriched["inspirationSecondary"] = secondaryInspiration.join(",");

    try {
      const res = await fetch("/api/pastel-agent/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          answers: Object.keys(enriched).length > 0 ? enriched : undefined,
          projectId: projectId ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || "Request failed");
      }
      const data = await res.json();
      setRunId(data.runId);
      pushActivity("Agent started");
      attachToStream(data.runId);
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Generation failed");
    }
  }, [projectId, attachToStream, pushActivity, inspiration, secondaryInspiration]);

  const submitAnswers = useCallback(() => {
    if (!pendingPrompt) return;
    start(pendingPrompt, answers);
  }, [pendingPrompt, answers, start]);

  const skipClarify = useCallback(() => {
    if (!pendingPrompt) return;
    start(pendingPrompt, {});
  }, [pendingPrompt, start]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearClarifyState();
    setRunId(null);
    setStatus("idle");
    setPhases(IDLE_PHASES);
    setDocs([]);
    setFiles({});
    setScreens([]);
    setBrandKit(null);
    setTitle(null);
    setActivity([]);
    setFailedScreens([]);
    setError(null);
    setSkills({ loaded: [], loading: null, totalPacks: 0 });
    setWireframeReview(null);
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    setPendingPrompt("");
    setOriginalPrompt("");
    setSuggestedCompanies([]);
    setInspiration("");
    setSecondaryInspiration([]);
  }, []);

  // ── V8 §4.4: wireframe confirmation-gate actions ───────────────────────
  const sendWireframeDecision = useCallback(async (action: "approve" | "revise" | "cancel", notes?: Record<string, string>) => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/pastel-agent/runs/${runId}/wireframe-decision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(notes ? { notes } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Decision failed" }));
        throw new Error(err.message || "Decision failed");
      }
      if (action === "approve") pushActivity("Wireframes approved — building components.");
      else if (action === "cancel") pushActivity("Run cancelled at the wireframe review.");
      else pushActivity("Changes requested — re-architecting the wireframes.");
    } catch (err: any) {
      setError(err.message || "Failed to send wireframe decision");
    }
  }, [runId, pushActivity]);

  const isGenerating = status === "running";
  const activePhase = PHASE_ORDER.find((p) => phases[p].status === "running") ?? null;

  return {
    // clarify + knowledge
    catalog,
    questions,
    answers,
    awaitingAnswers,
    pendingPrompt,
    isClarifying,
    suggestedCompanies,
    inspiration,
    secondaryInspiration,
    clarify,
    setAnswer,
    chooseInspiration,
    submitAnswers,
    skipClarify,
    // run
    runId,
    status,
    isGenerating,
    phases,
    activePhase,
    phaseOrder: PHASE_ORDER,
    phaseLabels: PHASE_LABELS,
    phaseDescriptions: PHASE_DESCRIPTIONS,
    skills,
    docs,
    files,
    screens,
    brandKit,
    title,
    activity,
    failedScreens,
    error,
    isRestoring,
    originalPrompt,
    // V8 §4.4: wireframe confirmation gate
    wireframeReview,
    sendWireframeDecision,
    start,
    reset,
  };
}
