import { Sparkles, Palette, Grid3X3, Eye, Wand2, ChevronRight, RefreshCw, X, Check } from "lucide-react";
import type { PastelPhase, PhaseState } from "@/hooks/use-pastel-agent";

const PHASE_CONFIG: Record<PastelPhase, { label: string; icon: typeof Sparkles; description: string }> = {
  concept:   { label: "Creative Director", icon: Palette,    description: "Developing a unique creative vision" },
  system:    { label: "Design Engineer",   icon: Grid3X3,    description: "Crafting a bespoke design system" },
  compose:   { label: "Composer",          icon: Wand2,      description: "Composing the layout and code" },
  critique:  { label: "Art Director",      icon: Eye,        description: "Reviewing against quality standards" },
  polish:    { label: "Finisher",          icon: Sparkles,   description: "Refining and polishing details" },
  done:      { label: "Complete",          icon: Check,      description: "Generation complete" },
  error:     { label: "Error",             icon: X,          description: "Something went wrong" },
};

interface PastelAgentPanelProps {
  phases: Record<string, PhaseState>;
  isGenerating: boolean;
  activePhase: string | undefined;
  currentPhaseIndex: number;
  phaseOrder: PastelPhase[];
  error: string | null;
  conceptResult?: { mood?: string[]; seed?: string };
  questions: any[] | null;
  answers: Record<string, string>;
  awaitingAnswers: boolean;
  onCancel: () => void;
  onReset: () => void;
  onClose?: () => void;
  onAnswerChange: (id: string, value: string) => void;
  onSubmitAnswers: () => void;
  onSkipClarify: () => void;
}

export function PastelAgentPanel({
  phases,
  isGenerating,
  activePhase,
  currentPhaseIndex,
  phaseOrder,
  error,
  conceptResult,
  awaitingAnswers,
  onCancel,
  onReset,
  onClose,
}: PastelAgentPanelProps) {

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} strokeWidth={1.5} className="text-brand" />
          <span className="text-[13px] font-semibold text-foreground">Pastel Agent</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Concept mood display */}
        {conceptResult?.mood && conceptResult.mood.length > 0 && (
          <div className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Creative Vision</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conceptResult.mood.map((m) => (
                <span key={m} className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-fg-muted border border-border-subtle">
                  {m}
                </span>
              ))}
            </div>
            {conceptResult.seed && (
              <p className="text-[11px] text-fg-faint">Aesthetic direction: {conceptResult.seed}</p>
            )}
          </div>
        )}

        {/* Phase progress */}
        <div className="space-y-1">
          {phaseOrder.map((phase, idx) => {
            const state = phases[phase];
            const config = PHASE_CONFIG[phase];
            const Icon = config.icon;
            const isActive = state.status === "running";
            const isDone = state.status === "done";
            const isPending = !isActive && !isDone && (idx > currentPhaseIndex || currentPhaseIndex === -1);

            return (
              <div
                key={phase}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isActive ? "bg-brand/5" : isDone ? "" : ""
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                  isActive ? "bg-brand text-white" :
                  isDone ? "bg-surface-muted text-fg-muted" :
                  "bg-surface-muted text-fg-faint"
                }`}>
                  {isActive ? (
                    <RefreshCw size={13} strokeWidth={1.5} className="animate-spin" />
                  ) : isDone ? (
                    <Check size={13} strokeWidth={2} />
                  ) : (
                    <Icon size={13} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold truncate ${
                    isActive ? "text-brand" : isDone ? "text-fg-muted" : "text-fg-faint"
                  }`}>
                    {config.label}
                  </p>
                  <p className={`text-[11px] truncate ${
                    isActive ? "text-brand/70" : "text-fg-faint"
                  }`}>
                    {isActive ? config.description :
                     isDone ? "Done" :
                     isPending ? "Waiting" : ""}
                  </p>
                </div>
                {isDone && (
                  <Check size={12} strokeWidth={2} className="text-fg-subtle shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
            <p className="text-[12px] font-medium text-danger mb-1">Error</p>
            <p className="text-[11px] text-fg-muted leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 px-4 py-3 border-t border-border flex items-center gap-2">
        {isGenerating ? (
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded-xl border border-border text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
        ) : awaitingAnswers ? null : (
          <button
            onClick={onReset}
            className="flex-1 h-9 rounded-xl border border-border text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors bg-transparent cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
