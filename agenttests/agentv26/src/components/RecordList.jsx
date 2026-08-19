import React, { useState } from "react";
import { ChevronRight, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function RecordList({ rows = [], onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleRowClick = (row) => {
    setSelectedId(row.id);
    if (onSelect) {
      onSelect(row);
    }
  };

  const handleKeyDown = (e, row) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(row);
    }
  };

  return (
    <div className="w-full bg-card rounded-[var(--radius-lg)] border border-border overflow-hidden">
      {/* Table Header / Meta Ribbon */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>Record</span>
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-secondary text-foreground text-[11px] font-medium">
            {rows.length}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-8 text-right">
          <span className="w-28 text-left">Activity</span>
          <span className="w-24 text-center">Status</span>
          <span className="w-16">Timeline</span>
        </div>
      </div>

      {/* Row List */}
      <div className="divide-y divide-border/80" role="list">
        {rows.map((row) => {
          const isActive = row.status?.toLowerCase() === "active";
          const isSelected = selectedId === row.id;

          return (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              onClick={() => handleRowClick(row)}
              onKeyDown={(e) => handleKeyDown(e, row)}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-inset ${
                isSelected
                  ? "bg-secondary"
                  : "bg-card hover:bg-secondary/40"
              }`}
            >
              {/* Primary & Subtitle cluster */}
              <div className="flex items-start gap-3.5 min-w-0 pr-4">
                <div className="mt-0.5 flex-shrink-0">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors font-display">
                      {row.title}
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  {row.subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {row.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta, Status & Date Group */}
              <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 sm:gap-8 flex-shrink-0 text-xs">
                {/* Meta item */}
                <div className="flex items-center gap-1.5 text-muted-foreground sm:w-28">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{row.meta}</span>
                </div>

                {/* Status Badge */}
                <div className="sm:w-24 flex sm:justify-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-[var(--radius-full)] text-[11px] font-medium leading-none ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                {/* Date stamp & action cue */}
                <div className="flex items-center gap-3 sm:w-16 justify-end text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 hidden sm:inline" />
                    <span className="font-medium text-foreground text-xs">{row.date}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}