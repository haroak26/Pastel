import { Star } from "lucide-react";

/** Compact star-rating display — product reviews and ratings. */
export default function RatingStars({ rating = 4.8, count = 0, size = "sm", className = "" }) {
  const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const fill = (i) => Math.max(0, Math.min(1, rating - i));
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center" aria-label={`${rating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={`${starSize} fill-current text-accent`} style={{ opacity: 0.25 + fill(i) * 0.75 }} />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums">{rating.toFixed(1)}</span>
      {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
