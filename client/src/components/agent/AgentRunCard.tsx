import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ActivityItem, AgentPhase, PhaseState, SkillState } from "@/hooks/use-pastel-agent";
import { formatScreenLabel } from "@/lib/utils";

interface AgentRunCardProps {
  status: "idle" | "running" | "done" | "error";
  phases: Record<AgentPhase, PhaseState>;
  phaseOrder: AgentPhase[];
  phaseLabels: Record<AgentPhase, string>;
  phaseDescriptions?: Record<AgentPhase, string>;
  activity: ActivityItem[];
  prompt: string;
  error: string | null;
  screensCount: number;
  docsCount: number;
  failedScreens: string[];
  skills?: SkillState;
  onReset: () => void;
}

const RUNNING_TITLES: Record<AgentPhase, string> = {
  discovery: "Discovery — picking your inspiration",
  brief: "Brief — building the product brief",
  wireframe: "Wireframe — producing page wireframes",
  build: "Components — planning and building in parallel",
  assemble: "Assembly — composing screens & verifying",
  present: "Presenting — your screens are live",
  review: "Quality Review — gate + visual review",
};

export function AgentRunCard({
  status,
  phases,
  phaseOrder,
  phaseLabels,
  phaseDescriptions,
  activity,
  prompt,
  error,
  screensCount,
  docsCount,
  failedScreens,
  skills,
  onReset,
}: AgentRunCardProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activity.length]);

  const activePhase = phaseOrder.find((p) => phases[p]?.status === "running") ?? null;
  const assembleFailed = phases.assemble?.status === "error" || phases.review?.status === "error";

  const headline =
    status === "running"
      ? RUNNING_TITLES[activePhase ?? "brief"]
      : status === "done"
        ? "Design approved"
        : status === "error"
          ? "The run hit a problem"
          : "";

  const doneSummary =
    status === "done"
      ? [
          screensCount > 0 ? `${screensCount} screen${screensCount === 1 ? "" : "s"}` : null,
          docsCount > 0 ? `${docsCount} doc${docsCount === 1 ? "" : "s"}` : null,
          assembleFailed ? "needs fixes" : "sandbox verified",
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  const skillsLoaded = skills && skills.loaded.length > 0;

  return (
    <div className="rounded-t-[20px] rounded-b-none border border-border bg-background shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-b-0 mb-[-48px]">
      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {status === "running" && (
              <Loader2 size={13} className="animate-spin text-brand shrink-0" />
            )}
            {status === "done" && !assembleFailed && (
              <ShieldCheck size={13} strokeWidth={2} className="text-success shrink-0" />
            )}
            {status === "done" && assembleFailed && (
              <AlertTriangle size={13} strokeWidth={2} className="text-warning shrink-0" />
            )}
            {status === "error" && (
              <AlertTriangle size={13} strokeWidth={2} className="text-danger shrink-0" />
            )}
            <span className="text-[12px] font-semibold text-foreground truncate">{headline}</span>
            {doneSummary && (
              <span className="text-[11px] text-fg-faint truncate hidden sm:inline">{doneSummary}</span>
            )}
          </div>
          {status === "running" ? (
            <span className="shrink-0 text-[10px] text-fg-faint px-1">safe to leave — runs on our servers</span>
          ) : (
            <button
              onClick={onReset}
              className="shrink-0 text-[11px] font-medium text-fg-muted hover:text-foreground px-2.5 py-1 rounded-lg border border-border bg-transparent cursor-pointer transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Phase timeline */}
        <div className="flex items-start gap-1.5">
          {phaseOrder.map((phase) => {
            const state = phases[phase]?.status ?? "idle";
            return (
              <div key={phase} className="flex-1 min-w-0">
                <div
                  className={`h-1.5 rounded-full transition-colors duration-500 ${
                    state === "running"
                      ? "bg-brand"
                      : state === "done"
                        ? "bg-brand/40"
                        : state === "error"
                          ? "bg-warning"
                          : "bg-surface-muted"
                  }`}
                />
                <div className="mt-1 flex items-center gap-1">
                  {state === "done" && <Check size={9} strokeWidth={3} className="text-brand/60 shrink-0" />}
                  {state === "running" && <Loader2 size={9} className="animate-spin text-brand shrink-0" />}
                  <span
                    className={`text-[9px] truncate transition-colors ${
                      state === "running"
                        ? "text-brand font-semibold"
                        : state === "done"
                          ? "text-fg-muted"
                          : state === "error"
                            ? "text-warning"
                            : "text-fg-faint"
                    }`}
                  >
                    {phaseLabels[phase]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active phase description */}
        {activePhase && phaseDescriptions?.[activePhase] && status === "running" && (
          <p className="text-[10px] text-fg-muted italic">{phaseDescriptions[activePhase]}</p>
        )}

        {/* Skills loaded indicator */}
        {skillsLoaded && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-fg-faint font-medium">Skills:</span>
            {skills!.loaded.slice(0, 6).map((skill) => (
              <span key={skill} className="inline-flex items-center gap-0.5 text-[10px] text-success bg-success/5 px-1.5 py-0.5 rounded">
                <Check size={8} strokeWidth={2.5} />
                {skill}
              </span>
            ))}
            {skills!.loaded.length > 6 && (
              <span className="text-[10px] text-fg-faint">+{skills!.loaded.length - 6} more</span>
            )}
          </div>
        )}

        {/* Live activity feed */}
        {activity.length > 0 && status !== "idle" && (
          <div ref={feedRef} className="max-h-[86px] overflow-y-auto space-y-1 pr-1">
            <AnimatePresence initial={false}>
              {activity.slice(-30).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-1.5"
                >
                  {item.isSkill ? (
                    <Check size={10} strokeWidth={2.5} className="mt-[3px] text-success shrink-0" />
                  ) : (
                    <span className="mt-[5px] w-1 h-1 rounded-full bg-brand/50 shrink-0" />
                  )}
                  <span className={`text-[11px] leading-snug ${item.isSkill ? "text-success/80" : "text-fg-muted"}`}>
                    {item.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {failedScreens.length > 0 && status === "done" && (
          <p className="text-[11px] text-warning font-medium">
            Couldn't verify: {failedScreens.map(formatScreenLabel).join(", ")} — try Reset and generate again.
          </p>
        )}

        {error && <p className="text-[11px] text-danger font-medium">{error}</p>}

        {prompt && (
          <p className="text-[11px] text-fg-faint truncate">{prompt}</p>
        )}
      </div>
      <div className="h-12" />
    </div>
  );
}
