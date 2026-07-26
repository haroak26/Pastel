import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

type SurveyMeta = {
  id: string;
  fromName: string | null;
  alreadyResponded: boolean;
  rating: number | null;
};

export default function CsatSurveyPage() {
  const [, params] = useRoute("/csat/:token");
  const token = params?.token ?? "";
  const [, searchParams] = [null, new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")];
  const presetRating = searchParams.get("rating") ? Number(searchParams.get("rating")) : null;

  const [meta, setMeta] = useState<SurveyMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(presetRating);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/csat/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? "Not found");
        return r.json();
      })
      .then((data: SurveyMeta) => {
        setMeta(data);
        if (data.alreadyResponded && data.rating) setSelectedRating(data.rating);
        if (!data.alreadyResponded && presetRating) {
          handleSubmit(presetRating);
        }
      })
      .catch((err) => setLoadError(err.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(ratingOverride?: number) {
    const rating = ratingOverride ?? selectedRating;
    if (!rating) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/csat/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to submit");
      setSubmitted(true);
      if (ratingOverride) setSelectedRating(ratingOverride);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const LABELS = ["", "Terrible", "Bad", "Okay", "Good", "Excellent"];
  const COLORS = ["", "#DC2B2B", "#f97316", "#E78A13", "#84cc16", "#1F9D69"];

  const displayRating = hoveredRating ?? selectedRating;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <span className="text-[22px] font-bold tracking-tight text-foreground">Pastel</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {loadError ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <AlertCircle className="text-destructive" size={36} />
              <p className="text-[15px] font-medium text-foreground">Survey not found</p>
              <p className="text-[13px] text-fg-muted">{loadError}</p>
            </div>
          ) : meta?.alreadyResponded ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2 className="text-success" size={40} />
              <p className="text-[17px] font-semibold text-foreground">Thanks for your feedback!</p>
              <p className="text-[13px] text-fg-muted">You already responded with a rating of {meta.rating}/5.</p>
            </div>
          ) : submitted ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2 className="text-success" size={40} />
              <p className="text-[17px] font-semibold text-foreground">Thanks for your feedback!</p>
              <p className="text-[13px] text-fg-muted">Your rating has been recorded. We really appreciate it.</p>
            </div>
          ) : !meta ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-fg-muted" size={28} />
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-[17px] font-semibold text-foreground mb-1">
                  How was your support experience{meta.fromName ? `, ${meta.fromName.split(" ")[0]}` : ""}?
                </p>
                <p className="text-[13px] text-fg-muted">Click a star to rate your recent interaction with our team.</p>
              </div>

              {/* Star rating */}
              <div
                className="flex items-center justify-center gap-2 mb-3"
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onMouseEnter={() => setHoveredRating(r)}
                    onClick={() => setSelectedRating(r)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 bg-transparent border-none cursor-pointer"
                  >
                    <Star
                      size={36}
                      className="transition-colors"
                      style={{
                        color: displayRating && r <= displayRating ? COLORS[displayRating] : "hsl(var(--border))",
                        fill: displayRating && r <= displayRating ? COLORS[displayRating] : "none",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Rating label */}
              <div className="text-center h-6 mb-5">
                {displayRating && (
                  <span className="text-[13px] font-semibold transition-all" style={{ color: COLORS[displayRating] }}>
                    {LABELS[displayRating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              {selectedRating && (
                <div className="mb-5">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any additional feedback? (optional)"
                    rows={3}
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-fg-faint resize-none outline-none transition-all",
                      "focus:border-foreground/25 focus:ring-1 focus:ring-foreground/[0.05]",
                    )}
                  />
                </div>
              )}

              {submitError && (
                <p className="text-[12px] text-destructive mb-3 text-center">{submitError}</p>
              )}

              <Button
                className="w-full"
                size="md"
                disabled={!selectedRating || submitting}
                onClick={() => handleSubmit()}
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                ) : "Submit Rating"}
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-[12px] text-fg-faint mt-6">
          Powered by <span className="font-medium">Pastel</span>
        </p>
      </div>
    </div>
  );
}
