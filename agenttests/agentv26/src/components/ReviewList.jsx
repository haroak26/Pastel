import React, { useState, useMemo } from "react";
import { Star, ShieldCheck, ThumbsUp, Search, SlidersHorizontal, Sparkles } from "lucide-react";

export default function ReviewList({
  reviews = [],
  averageRating = 4.98,
  totalReviews = 128
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [helpfulCounts, setHelpfulCounts] = useState({});

  const toggleHelpful = (idx) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [idx]: (prev[idx] || 0) + 1
    }));
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchesSearch =
        rev.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rev.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        selectedFilter === "all"
          ? true
          : selectedFilter === "5"
          ? rev.rating >= 5
          : rev.rating === Number(selectedFilter);
      return matchesSearch && matchesFilter;
    });
  }, [reviews, searchTerm, selectedFilter]);

  const ratingCategories = [
    { label: "Architectural craft", score: "5.0", fillPct: "100%" },
    { label: "Hearth & firewood", score: "4.9", fillPct: "98%" },
    { label: "Wilderness seclusion", score: "5.0", fillPct: "100%" },
    { label: "Cleanliness & care", score: "4.9", fillPct: "98%" }
  ];

  return (
    <section className="w-full text-foreground font-sans">
      {/* Header Breakdown Area */}
      <div className="border-b border-border pb-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Aggregate Score */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-foreground">
                {Number(averageRating).toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-primary">
                <Star className="w-5 h-5 fill-primary text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground mt-1">
              Sanctuary Guest Favorite
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on {totalReviews} verified stays and architectural logs
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-border/40 text-xs font-medium text-secondary">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Top 1% wilderness cabins worldwide</span>
            </div>
          </div>

          {/* Metric Aspect Breakdown */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 pt-1">
            {ratingCategories.map((cat) => (
              <div key={cat.label} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-foreground">{cat.label}</span>
                  <span className="font-bold tabular-nums text-foreground">{cat.score}</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: cat.fillPct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search timber, sauna, stars..."
              className="w-full h-[var(--control-md)] pl-10 pr-4 bg-background border border-border rounded-[var(--radius-lg)] text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
              aria-label="Search guest reviews"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-border/40 rounded-[var(--radius-lg)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`h-[var(--control-sm)] px-3.5 rounded-full text-xs font-medium transition-all ${
                selectedFilter === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All reviews
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("5")}
              className={`h-[var(--control-sm)] px-3.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                selectedFilter === "5"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span>5.0 only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Review Rows */}
      <div className="divide-y divide-border">
        {filteredReviews.length === 0 ? (
          <div className="py-12 text-center">
            <SlidersHorizontal className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No verified reviews found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query or filter tags.
            </p>
          </div>
        ) : (
          filteredReviews.map((rev, index) => {
            const initials = rev.name
              ? rev.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "GT";

            const helpfulCount = helpfulCounts[index] || 0;

            return (
              <article key={rev.id || `${rev.name}-${index}`} className="py-6 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Guest Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-[var(--control-md)] rounded-full bg-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 select-none">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-foreground leading-tight">
                          {rev.name}
                        </h4>
                        <span className="inline-flex items-center text-[10px] font-semibold text-success gap-0.5 bg-background border border-border px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Verified Stay
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rev.date || "Stayed recently"}
                      </p>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (rev.rating || 5)
                            ? "fill-primary text-primary"
                            : "text-border"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs font-semibold text-foreground">
                      {Number(rev.rating || 5).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Comment Body */}
                <p className="mt-3 text-sm text-foreground leading-relaxed">
                  {rev.comment}
                </p>

                {/* Interaction Footer */}
                <div className="mt-3.5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleHelpful(index)}
                    aria-label={`Mark review by ${rev.name} as helpful`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-[var(--radius-sm)] py-1 pr-2 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful {helpfulCount > 0 && `(${helpfulCount})`}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}