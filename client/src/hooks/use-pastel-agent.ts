import { useState, useCallback, useRef } from "react";

export type PastelPhase =
  | "concept"
  | "system"
  | "compose"
  | "critique"
  | "polish"
  | "done"
  | "error";

export interface PhaseState {
  phase: PastelPhase;
  status: "idle" | "running" | "done";
  result?: Record<string, unknown>;
}

export interface PastelResult {
  code: string;
  concept: { mood: string[]; seed: string };
  designSystem: { colors: Record<string, string>; spacing: Record<string, unknown> };
  critique?: { passed: boolean; score: number };
}

interface PastelEvent {
  type: "phase" | "done" | "error";
  phase?: string;
  status?: string;
  result?: unknown;
  message?: string;
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  options?: string[];
}

export function usePastelAgent() {
  const [phases, setPhases] = useState<Record<string, PhaseState>>({
    concept: { phase: "concept", status: "idle" },
    system: { phase: "system", status: "idle" },
    compose: { phase: "compose", status: "idle" },
    critique: { phase: "critique", status: "idle" },
    polish: { phase: "polish", status: "idle" },
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PastelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClarifyQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [awaitingAnswers, setAwaitingAnswers] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const clarify = useCallback(async (prompt: string) => {
    setError(null);
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(true);

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
        try {
          const errData = JSON.parse(text);
          message = errData.message || message;
        } catch {}
        throw new Error(message);
      }

      const data = JSON.parse(text);
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response");
      }

      setQuestions(data.questions);
    } catch (err: any) {
      const msg = err.message || "Failed to generate questions";
      setError(msg);
      setAwaitingAnswers(false);

      // Auto-skip to generation if clarify fails
      setTimeout(() => {
        generate(prompt, {});
      }, 500);
    }
  }, []);

  const skipClarify = useCallback((prompt: string) => {
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    generate(prompt, {});
  }, []);

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const submitAnswers = useCallback((prompt: string) => {
    setAwaitingAnswers(false);
    generate(prompt, answers);
  }, [answers]);

  const generate = useCallback(async (prompt: string, answerMap: Record<string, string>) => {
    setPhases({
      concept: { phase: "concept", status: "idle" },
      system: { phase: "system", status: "idle" },
      compose: { phase: "compose", status: "idle" },
      critique: { phase: "critique", status: "idle" },
      polish: { phase: "polish", status: "idle" },
    });
    setResult(null);
    setError(null);
    setCode(null);
    setQuestions(null);
    setAwaitingAnswers(false);
    setIsGenerating(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/pastel-agent/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          answers: Object.keys(answerMap).length > 0 ? answerMap : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

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
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const json = trimmed.slice(6);
          if (json === "[DONE]") continue;

          try {
            const event: PastelEvent = JSON.parse(json);

            if (event.type === "phase" && event.phase && event.status) {
              setPhases((prev) => ({
                ...prev,
                [event.phase!]: {
                  phase: event.phase as PastelPhase,
                  status: event.status as "running" | "done",
                  result: event.result as Record<string, unknown> | undefined,
                },
              }));
            }

            if (event.type === "done" && event.result) {
              const r = event.result as Record<string, unknown>;
              setResult({
                code: r.code as string,
                concept: r.concept as PastelResult["concept"],
                designSystem: r.designSystem as PastelResult["designSystem"],
                critique: r.critique as PastelResult["critique"],
              });
              setCode(r.code as string);
            }

            if (event.type === "error") {
              setError(event.message || "Generation failed");
            }
          } catch {
            // skip unparseable events
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Generation failed");
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setAwaitingAnswers(false);
  }, []);

  const reset = useCallback(() => {
    setPhases({
      concept: { phase: "concept", status: "idle" },
      system: { phase: "system", status: "idle" },
      compose: { phase: "compose", status: "idle" },
      critique: { phase: "critique", status: "idle" },
      polish: { phase: "polish", status: "idle" },
    });
    setResult(null);
    setError(null);
    setCode(null);
    setQuestions(null);
    setAnswers({});
    setAwaitingAnswers(false);
    setIsGenerating(false);
  }, []);

  const PHASE_ORDER: PastelPhase[] = ["concept", "system", "compose", "critique", "polish"];

  const activePhase = PHASE_ORDER.find((p) => phases[p].status === "running");
  const currentPhaseIndex = activePhase ? PHASE_ORDER.indexOf(activePhase) : -1;

  return {
    phases,
    isGenerating,
    result,
    error,
    code,
    questions,
    answers,
    awaitingAnswers,
    activePhase,
    currentPhaseIndex,
    phaseOrder: PHASE_ORDER,
    clarify,
    skipClarify,
    setAnswer,
    submitAnswers,
    cancel,
    reset,
  };
}
