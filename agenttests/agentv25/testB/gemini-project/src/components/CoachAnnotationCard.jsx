import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export default function CoachAnnotationCard({
  coachName = "Coach",
  timestamp = "",
  analysis = "",
  statusTag = "Approved",
}) {
  return (
    <section aria-label="Coach annotation" className="w-full rounded-[var(--radius-xl)] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
            {coachName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold">{coachName}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {timestamp}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--success)]/10 px-2 py-1 text-xs font-medium" style={{ color: "var(--success)" }}>
          <CheckCircle2 className="h-3 w-3" /> {statusTag}
        </span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{analysis}</p>
    </section>
  );
}
