import React, { useState } from "react";
import { Search, SlidersHorizontal, ArrowUpRight, CheckCircle2, Clock, Calendar, Sparkles } from "lucide-react";
import { NavAdapter, IconOf } from "../lib/shell.jsx";
import { DATA } from "../data.js";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import MetricCard from "../components/MetricCard.jsx";
import RecordList from "../components/RecordList.jsx";

export default function Home() {
  const [activeNav, setActiveNav] = useState("home");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const primaryMetric = DATA.metrics[0];
  const secondaryMetrics = DATA.metrics.slice(1);

  // SVG Sparkline calculation for dominant metric block
  const sparkPoints = DATA.spark || [];
  const minVal = Math.min(...sparkPoints);
  const maxVal = Math.max(...sparkPoints);
  const range = maxVal - minVal || 1;
  const svgWidth = 240;
  const svgHeight = 44;
  const pointsString = sparkPoints
    .map((val, idx) => {
      const x = (idx / (sparkPoints.length - 1)) * svgWidth;
      const y = svgHeight - ((val - minVal) / range) * (svgHeight - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  const filterCategories = [
    { id: "all", label: "All properties" },
    { id: "active", label: "Lakefront & Peak" },
    { id: "pending", label: "Under review" }
  ];

  const filteredRows = DATA.list.rows.filter(row => {
    if (activeFilter === "active") return row.status === "Active";
    if (activeFilter === "pending") return row.status === "Pending";
    return true;
  });

  return (
    <NavAdapter nav="sidebar" activeId={activeNav} onNavigate={setActiveNav}>
      <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Top Search & Filter Bar (Airbnb signature pill) */}
        <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Cabin Marketplace
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {DATA.brand.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Pill Search Field */}
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-full px-4 h-[var(--control-md)] text-sm shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <label htmlFor="property-search-input" className="sr-only">
                Search cabins and reservations
              </label>
              <input
                id="property-search-input"
                type="text"
                placeholder="Where to? Location, status, dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-48 sm:w-64 text-sm"
                aria-label="Search cabins and reservations"
              />
            </div>

            <Button
              label={DATA.primaryCta}
              variant="primary"
              size="md"
              onClick={() => {}}
            />
          </div>
        </header>

        {/* DOMINANT MOMENT: Headline Metric & Trend Banner */}
        <section aria-labelledby="overview-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-card border border-border rounded-[var(--radius-xl)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Portfolio Operations
                </p>
                <h2 id="overview-heading" className="text-base font-semibold text-foreground mt-0.5">
                  {primaryMetric.label}
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                <span>+{primaryMetric.delta}% vs last cycle</span>
              </div>
            </div>

            {/* Display-scale dominant value */}
            <div className="flex flex-col sm:flex-row items-baseline sm:items-end justify-between gap-6 my-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight text-foreground tabular-nums">
                  {primaryMetric.value}
                </span>
                <span className="text-muted-foreground text-sm font-medium">units managed</span>
              </div>

              {/* Sparkline visualization */}
              <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">30-day velocity</span>
                <div className="w-full sm:w-60 h-[var(--control-sm)]">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 240 44" fill="none">
                    <path
                      d={`M 0,${svgHeight} L ${pointsString.split(" ")[0]} L ${pointsString} L ${svgWidth},${svgHeight} Z`}
                      className="fill-primary/10"
                    />
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsString}
                      className="text-primary"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Owner: <strong className="text-foreground">{DATA.user.name}</strong> ({DATA.user.role})</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Next turnover: <strong className="text-foreground">Jul 21, 2026</strong></span>
              </div>
            </div>
          </div>

          {/* Secondary Metric Cards */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
            {secondaryMetrics.map((m, idx) => (
              <div key={idx} className="flex-1">
                <MetricCard
                  label={m.label}
                  value={m.value}
                  unit={m.unit}
                  delta={m.delta}
                  positive={m.positive}
                />
              </div>
            ))}
            <div className="bg-secondary rounded-[var(--radius-lg)] p-4 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Host Rating</p>
                <p className="text-lg font-bold text-foreground mt-0.5">4.98 <span className="text-xs font-normal text-muted-foreground">/ 5.0</span></p>
              </div>
              <Badge label="Superhost" tone="primary" />
            </div>
          </div>
        </section>

        {/* Main Work Area: Filtered Records & Live Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Records Section (2/3 width) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {DATA.list.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Showing {filteredRows.length} properties requiring attention
                </p>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-[var(--radius-md)] border border-border self-start sm:self-auto">
                {filterCategories.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      activeFilter === tab.id
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Record Table / Divided Rows */}
            <div className="bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden">
              <RecordList
                rows={filteredRows}
                onSelect={(row) => {}}
              />
            </div>
          </div>

          {/* Side Context & Activity Feed (1/3 width) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Host / Owner Snapshot Panel */}
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-[var(--control-md)] rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {DATA.user.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{DATA.user.name}</h4>
                  <p className="text-xs text-muted-foreground">{DATA.user.role} • Fast response</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-border text-xs">
                {DATA.detail.fields.map((field, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{field.label}</span>
                    <span className="font-semibold text-foreground">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Marketplace Activity */}
            <div className="bg-secondary/60 border border-border rounded-[var(--radius-xl)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Audit Trail
                </h4>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>

              <div className="space-y-4">
                {DATA.activity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-semibold">{item.actor}</span>{" "}
                        <span className="text-muted-foreground">{item.action}</span>{" "}
                        <span className="font-semibold">{item.target}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

      </div>
    </NavAdapter>
  );
}