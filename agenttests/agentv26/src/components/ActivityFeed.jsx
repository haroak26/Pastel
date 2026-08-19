import React, { useState } from "react";
import { Clock, Filter, ArrowUpRight, CheckCircle2, Home, Sparkles } from "lucide-react";

export default function ActivityFeed({ items = [] }) {
  const [filter, setFilter] = useState("all");

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getActivityIcon = (action = "") => {
    if (action.includes("created")) return Sparkles;
    if (action.includes("status")) return CheckCircle2;
    return Home;
  };

  const filteredItems = items.filter((item) => {
    if (filter === "created") return item.action?.toLowerCase().includes("created");
    if (filter === "status") return item.action?.toLowerCase().includes("status");
    return true;
  });

  return (
    <div className="w-full bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden">
      {/* Header section with contextual count & filter pills */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground font-[family-name:var(--font-display)]">
              Activity
            </h3>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] bg-secondary text-secondary-foreground">
              {filteredItems.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-[family-name:var(--font-body)]">
            Timeline of recent changes across your cabin listings
          </p>
        </div>

        {/* Quiet Filter Tabs */}
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-[var(--radius-md)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`h-[calc(var(--control-sm)-4px)] px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              filter === "all"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("status")}
            className={`h-[calc(var(--control-sm)-4px)] px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              filter === "status"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => setFilter("created")}
            className={`h-[calc(var(--control-sm)-4px)] px-3 text-xs font-medium rounded-[var(--radius-sm)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              filter === "created"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Created
          </button>
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-border bg-card">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-[var(--control-md)] rounded-[var(--radius-full)] bg-secondary flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No recent events found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Changes and updates to properties will appear in this timeline.
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const Icon = getActivityIcon(item.action);
            const isLast = index === filteredItems.length - 1;

            return (
              <div
                key={`${item.actor}-${item.target}-${index}`}
                className="group relative p-4 sm:p-5 hover:bg-secondary/40 transition-colors flex items-start gap-3 sm:gap-4"
              >
                {/* Timeline visual marker / Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-9 h-[var(--control-sm)] rounded-[var(--radius-full)] bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground group-hover:border-primary/40 transition-colors">
                    {item.actor ? getInitials(item.actor) : <Icon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-[var(--radius-full)] bg-card border border-border flex items-center justify-center">
                    <Icon className="w-2.5 h-2.5 text-primary" />
                  </div>
                </div>

                {/* Content body */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                    <span className="font-semibold text-foreground">
                      {item.actor || "Team member"}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {item.action || "interacted with"}
                    </span>
                    <span className="font-medium text-foreground inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                      {item.target || "Listing"}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time || "Just now"}
                    </span>
                    <span className="w-1 h-1 rounded-[var(--radius-full)] bg-border" />
                    <span className="capitalize">{item.target ? "Cabin property" : "General update"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info note */}
      <div className="p-3 sm:px-5 sm:py-3.5 bg-secondary/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Logged automatically</span>
        <span className="font-medium text-foreground">Live synchronization</span>
      </div>
    </div>
  );
}