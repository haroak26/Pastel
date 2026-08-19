import { useState } from "react";
import { NavAdapter } from "../lib/shell.jsx";
import { DATA } from "../data.js";
import SplitTable from "../components/SplitTable.jsx";
import TelemetryRibbon from "../components/TelemetryRibbon.jsx";
import CoachAnnotationCard from "../components/CoachAnnotationCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";

export default function SessionDetail() {
  const [active, setActive] = useState("session-detail");
  const coachNote = DATA.activity[0] ?? {};
  return (
    <NavAdapter nav="topbar" activeId="session-detail" onNavigate={setActive}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge label="VO2 Inflection" variant="volt" />
              <Badge label="Target Met" variant="success" />
            </div>
            <h1 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {DATA.detail.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {DATA.detail.fields[0]?.label}: {DATA.detail.fields[0]?.value} ·{" "}
              {DATA.detail.fields[1]?.label}: {DATA.detail.fields[1]?.value}
            </p>
          </div>
          <Button variant="secondary" size="md">Export splits</Button>
        </div>

        <TelemetryRibbon
          cadenceAvg={184}
          elevationGain={142}
          heartRateMax={188}
          aerobicDecoupling="1.9%"
        />

        <SplitTable targetPace="2:50 - 2:54 min/km" />

        <CoachAnnotationCard
          coachName={coachNote.actor ?? "Coach"}
          timestamp={coachNote.time ?? "—"}
          analysis={coachNote.action === "approved" ? "Approved the 12x400m split ledger. Tempo band held inside the prescribed 2:50–2:54 window for 11 of 12 reps; single late fade attributable to heat, not pacing error." : "Coaching annotation pending."}
          statusTag="Approved"
        />
      </div>
    </NavAdapter>
  );
}
