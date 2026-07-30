import { useState, useCallback, useRef, useEffect } from "react";

const CLARIFY_KEY = "pastel.agent.clarify";

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

export type AgentPhase = "brief" | "plan" | "build" | "verify" | "present";

export const PHASE_ORDER: AgentPhase[] = ["brief", "plan", "build", "verify", "present"];

export const PHASE_LABELS: Record<AgentPhase, string> = {
  brief: "Build brief",
  plan: "Design specs",
  build: "Coding",
  verify: "Sandbox verify",
  present: "Present",
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
  question: string;
  options?: string[];
}

export interface ActivityItem {
  id: number;
  message: string;
  ts: number;
}

interface PastelEvent {
  type: "phase" | "title" | "doc" | "file" | "activity" | "done" | "error";
  phase?: AgentPhase;
  status?: "running" | "done" | "error";
  message?: string;
  doc?: DocItem;
  file?: FileItem;
  title?: string;
  result?: {
    screens?: string[];
    docs?: string[];
    brandKit?: BrandKit | null;
    failedScreens?: string[];
  };
}

const IDLE_PHASES: Record<AgentPhase, PhaseState> = {
  brief: { status: "idle" },
  plan: { status: "idle" },
  build: { status: "idle" },
  verify: { status: "idle" },
  present: { status: "idle" },
};

let activityCounter = 0;

export function usePastelAgent(projectId: string | null) {
  // ── Clarify state (pre-run, session-cached) ──
  const [questions, setQuestions] = useState<ClarifyQuestion[] | null>(loadClarifyState("questions") ?? null);
  const [answers, setAnswers] = useState<Record<string, string>>(loadClarifyState("answers") ?? {});
  const [awaitingAnswers, setAwaitingAnswers] = useState(loadClarifyState("awaitingAnswers") ?? false);
  const [pendingPrompt, setPendingPrompt] = useState(loadClarifyState("pendingPrompt") ?? "");
  const [isClarifying, setIsClarifying] = useState(false);

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

  const abortRef = useRef<AbortController | null>(null);
  const restoredRef = useRef(false);

  const pushActivity = useCallback((message: string) => {
    setActivity((prev) => [...prev.slice(-199), { id: ++activityCounter, message, ts: Date.now() }]);
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
          setPhases((prev) => ({
            ...prev,
            [event.phase!]: { status: event.status! },
          }));
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
      case "done":
        setStatus("done");
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
          // Hydrate phase statuses from the manifest
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
          setPhases({
            brief: { status: "done" },
            plan: { status: "done" },
            build: { status: "done" },
            verify: { status: manifest.phases?.verify === "error" ? "error" : "done" },
            present: { status: "done" },
          });
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
      if (qs.length === 0) {
        // Model decided the prompt is detailed enough — go straight to run.
        setAwaitingAnswers(false);
        setIsClarifying(false);
        start(prompt, {});
        return;
      }
      setQuestions(qs);
      saveClarifyState({ questions: qs, answers: {}, awaitingAnswers: true, pendingPrompt: prompt });
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
      saveClarifyState({ questions, answers: next, awaitingAnswers: true, pendingPrompt });
      return next;
    });
  }, [questions, pendingPrompt]);

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
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    setOriginalPrompt(prompt);

    try {
      const res = await fetch("/api/pastel-agent/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          answers: Object.keys(answerMap).length > 0 ? answerMap : undefined,
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
  }, [projectId, attachToStream, pushActivity]);

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
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    setPendingPrompt("");
    setOriginalPrompt("");
  }, []);

  const isGenerating = status === "running";
  const activePhase = PHASE_ORDER.find((p) => phases[p].status === "running") ?? null;

  return {
    // clarify
    questions,
    answers,
    awaitingAnswers,
    pendingPrompt,
    isClarifying,
    clarify,
    setAnswer,
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
    start,
    reset,
  };
}
