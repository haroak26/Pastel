import React, { useState } from "react";
import { Search, MapPin, Calendar, Users, SlidersHorizontal, Waves, MountainSnow, Trees, Compass } from "lucide-react";

export default function SearchFilterBar({
  location = "Lake Tahoe, California",
  dateSummary = "Mar 12 – Mar 17",
  guestSummary = "4 guests · 2 beds",
  activeTerrain = "Lakefront"
}) {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [currentTerrain, setCurrentTerrain] = useState(activeTerrain);

  const terrains = [
    { id: "lakefront", label: "Lakefront", icon: Waves, count: "42" },
    { id: "timber", label: "Deep Timber", icon: Trees, count: "68" },
    { id: "alpine", label: "Alpine Ridge", icon: MountainSnow, count: "39" },
    { id: "coastal", label: "Clifftop Surf", icon: Compass, count: "35" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 font-sans">
      {/* Floating Segmented Master Pill */}
      <div 
        className="relative bg-card border border-border rounded-[var(--radius-full)] p-1.5 transition-all"
        style={{
          boxShadow: "0 12px 32px -8px rgba(33, 29, 26, 0.08), 0 4px 12px -2px rgba(33, 29, 26, 0.04)"
        }}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center">
          
          {/* Segment 1: Location */}
          <button
            type="button"
            onClick={() => setSelectedSegment(selectedSegment === "location" ? null : "location")}
            className={`group flex-1 flex items-center gap-3 px-5 py-2.5 rounded-[var(--radius-full)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedSegment === "location" ? "bg-[var(--input)]/40" : "hover:bg-[var(--background)]"
            }`}
          >
            <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--background)] border border-border flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sanctuary
              </span>
              <span className="block text-sm font-medium text-foreground truncate">
                {location || "Search destinations"}
              </span>
            </div>
          </button>

          {/* Hairline Divider */}
          <div className="hidden md:block w-px h-8 bg-border self-center" />

          {/* Segment 2: Stay Dates */}
          <button
            type="button"
            onClick={() => setSelectedSegment(selectedSegment === "dates" ? null : "dates")}
            className={`group flex-1 flex items-center gap-3 px-5 py-2.5 rounded-[var(--radius-full)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedSegment === "dates" ? "bg-[var(--input)]/40" : "hover:bg-[var(--background)]"
            }`}
          >
            <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--background)] border border-border flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dates
              </span>
              <span className="block text-sm font-medium text-foreground truncate">
                {dateSummary || "Add stay dates"}
              </span>
            </div>
          </button>

          {/* Hairline Divider */}
          <div className="hidden md:block w-px h-8 bg-border self-center" />

          {/* Segment 3: Guests & Capacity */}
          <button
            type="button"
            onClick={() => setSelectedSegment(selectedSegment === "guests" ? null : "guests")}
            className={`group flex-1 flex items-center gap-3 px-5 py-2.5 rounded-[var(--radius-full)] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedSegment === "guests" ? "bg-[var(--input)]/40" : "hover:bg-[var(--background)]"
            }`}
          >
            <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--background)] border border-border flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Capacity
              </span>
              <span className="block text-sm font-medium text-foreground truncate">
                {guestSummary || "Add guests"}
              </span>
            </div>
          </button>

          {/* Search Action CTA */}
          <div className="p-1 md:pl-2 flex items-center justify-end">
            <button
              type="button"
              aria-label="Search curated retreats"
              className="w-full md:w-auto h-[var(--control-lg)] px-6 rounded-[var(--radius-full)] bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <Search className="w-4 h-4" />
              <span>Explore</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terrains / Archetypes Secondary Filter Track */}
      <div className="flex items-center justify-between gap-3 px-2 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {terrains.map((terrain) => {
            const Icon = terrain.icon;
            const isActive = currentTerrain.toLowerCase() === terrain.label.toLowerCase() || currentTerrain.toLowerCase() === terrain.id;

            return (
              <button
                key={terrain.id}
                type="button"
                onClick={() => setCurrentTerrain(terrain.label)}
                className={`inline-flex items-center gap-2 h-[var(--control-sm)] px-3.5 rounded-[var(--radius-full)] text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  isActive
                    ? "bg-foreground text-card shadow-sm"
                    : "bg-card border border-border text-secondary hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                <span>{terrain.label}</span>
                <span className={`text-[10px] tabular-nums ${isActive ? "text-card/80" : "text-muted-foreground"}`}>
                  {terrain.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactile Filter Action Button */}
        <button
          type="button"
          aria-label="Open advanced architectural filters"
          className="hidden sm:inline-flex items-center gap-2 h-[var(--control-sm)] px-3 rounded-[var(--radius-full)] bg-card border border-border text-foreground hover:bg-[var(--background)] transition-colors text-xs font-medium shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}