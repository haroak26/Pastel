import { useState } from "react";
import { Check, X, Pencil, Layers, Loader2 } from "lucide-react";
import type { WireframeReviewPayload } from "@/hooks/use-pastel-agent";

interface WireframeReviewPanelProps {
  review: WireframeReviewPayload;
  onDecision: (action: "approve" | "revise" | "cancel", notes?: Record<string, string>) => void;
}

/**
 * V8 §4.4 — the wireframe confirmation gate UI. The pipeline is blocked in
 * the `wireframe-review` phase until the user approves, requests changes
 * (bounded re-architecture, no pipeline restart), or cancels (no further
 * spend, credit hold refunded).
 */
export function WireframeReviewPanel({ review, onDecision }: WireframeReviewPanelProps) {
  const [revising, setRevising] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"approve" | "revise" | "cancel" | null>(null);

  const send = (action: "approve" | "revise" | "cancel") => {
    setBusy(action);
    onDecision(action, action === "revise" ? notes : undefined);
  };

  return (
    <div className="rounded-t-[20px] rounded-b-none border border-brand/30 bg-background shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-b-0 mb-[-48px] overflow-hidden">
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-brand shrink-0" />
            <span className="text-[12px] font-semibold text-foreground">
              Wireframes ready — approve before any components are built
            </span>
          </div>
          <span className="shrink-0 text-[10px] text-fg-faint">
            accent {review.accent} · radius {review.radius}
            {review.revisionsUsed > 0 ? ` · revision ${review.revisionsUsed}` : ""}
          </span>
        </div>

        <p className="text-[10px] text-fg-muted">
          Review the planned screens below. Nothing has been built yet — this checkpoint is where layout and
          content decisions get locked in. Approving starts the component build.
        </p>

        {/* Screens */}
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {review.screens.map((screen) => (
            <div key={screen.id} className="rounded-lg border border-border bg-surface-muted/50 p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-foreground">
                  {screen.name} <span className="text-fg-faint font-normal">· {screen.route}</span>
                </span>
                {revising && (
                  <Pencil size={10} className="text-fg-faint shrink-0" />
                )}
              </div>
              {screen.dominantMoment && (
                <p className="text-[10px] text-fg-muted italic leading-snug">
                  Dominant: {screen.dominantMoment}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {screen.regions.map((region) => (
                  <span
                    key={region.name}
                    className="inline-flex items-center gap-1 text-[9px] text-fg-muted bg-background border border-border rounded px-1.5 py-0.5"
                    title={region.purpose}
                  >
                    <span className={region.hierarchy === "primary" ? "text-brand font-semibold" : ""}>
                      {region.name}
                    </span>
                    <span className="text-fg-faint">
                      ({region.components.map((c) => c.name).join(", ")})
                    </span>
                  </span>
                ))}
              </div>
              {revising && (
                <textarea
                  value={notes[screen.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [screen.id]: e.target.value }))}
                  placeholder={`Changes for ${screen.name} (e.g. "move the toolbar into the sidebar")`}
                  className="w-full text-[10px] rounded-md border border-border bg-background px-2 py-1 outline-none focus:border-brand resize-none"
                  rows={1}
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => send("approve")}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary-foreground bg-primary rounded-lg px-3 py-1.5 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "approve" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={2.5} />}
            Approve & build
          </button>
          <button
            onClick={() => (revising ? send("revise") : setRevising(true))}
            disabled={busy !== null || (revising && Object.values(notes).every((n) => !n.trim()))}
            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-foreground border border-border rounded-lg px-3 py-1.5 cursor-pointer transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            {busy === "revise" ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
            {revising ? "Send changes" : "Request changes"}
          </button>
          <button
            onClick={() => send("cancel")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-danger border border-danger/30 rounded-lg px-3 py-1.5 cursor-pointer transition-colors hover:bg-danger/5 disabled:opacity-50"
          >
            {busy === "cancel" ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            Cancel
          </button>
        </div>

        {revising && (
          <p className="text-[9px] text-fg-faint">
            Changes trigger a bounded re-architecture — discovery and design tokens are not re-run.
          </p>
        )}
      </div>
      <div className="h-12" />
    </div>
  );
}
