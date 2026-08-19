import React, { useState } from "react";
import { CheckCircle2, Clock, Calendar, User, Layers, Check, Share2, Sparkles, ShieldCheck } from "lucide-react";

export default function DetailPanel({
  title = "Cabin Record",
  fields = [],
  status = "Active"
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getFieldIcon = (label = "") => {
    const l = label.toLowerCase();
    if (l.includes("status")) return <Sparkles className="w-4 h-4 text-primary" />;
    if (l.includes("owner") || l.includes("host") || l.includes("guest")) return <User className="w-4 h-4 text-muted-foreground" />;
    if (l.includes("date") || l.includes("start") || l.includes("time")) return <Calendar className="w-4 h-4 text-muted-foreground" />;
    if (l.includes("item") || l.includes("room") || l.includes("count")) return <Layers className="w-4 h-4 text-muted-foreground" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const isStatusActive = status.toLowerCase() === "active";

  return (
    <div className="w-full bg-card rounded-[var(--radius-xl)] border border-border overflow-hidden">
      {/* Header section with status badge and share action */}
      <div className="p-6 pb-5 border-b border-border">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[var(--radius-full)] ${
                isStatusActive
                  ? "bg-secondary text-primary border border-border"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isStatusActive ? "bg-primary" : "bg-muted-foreground"
                }`}
              />
              {status}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground rounded-[var(--radius-full)] bg-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              Verified Stay
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Share property details"
            className="h-[var(--control-sm)] px-2.5 flex items-center gap-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-muted rounded-[var(--radius-md)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Dominant display-scale title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-[var(--font-display)] leading-tight">
          {title}
        </h1>
      </div>

      {/* Structured specs grid */}
      <div className="p-6 bg-card space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((field, idx) => {
            const isHighlight = field.label.toLowerCase() === "status";
            return (
              <div
                key={field.label || idx}
                className={`p-4 rounded-[var(--radius-lg)] border transition-colors ${
                  isHighlight
                    ? "bg-secondary border-border"
                    : "bg-card border-border hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {field.label}
                  </span>
                  {getFieldIcon(field.label)}
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground tracking-tight font-[var(--font-display)] truncate">
                  {field.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiet Host Assurance summary banner */}
        <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-secondary border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[var(--control-md)] rounded-[var(--radius-full)] bg-foreground text-card flex items-center justify-center font-bold text-sm tracking-wide">
              {title.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property record</p>
              <p className="text-sm font-semibold text-foreground">
                Managed & listed live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>Ready for guests</span>
          </div>
        </div>
      </div>
    </div>
  );
}