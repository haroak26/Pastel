import { useState } from "react";
import { NavAdapter, IconOf } from "../lib/shell.jsx";
import { DATA } from "../data.js";
import PaceScoreboard from "../components/PaceScoreboard.jsx";
import SessionLogList from "../components/SessionLogList.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";

export default function TelemetryOverview() {
  const [active, setActive] = useState("telemetry-overview");
  return (
    <NavAdapter nav="topbar" activeId="telemetry-overview" onNavigate={setActive}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <PaceScoreboard metrics={DATA.metrics} headline="Lactate Threshold & Telemetry Board" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {DATA.list.name}
            </h2>
            <Badge label={`${DATA.list.rows.length} logged`} variant="success" />
          </div>
          <Button variant="primary" size="md">
            <IconOf name="plus" className="h-4 w-4" />
            Log session
          </Button>
        </div>
        <SessionLogList sessions={DATA.list.rows} />
      </div>
    </NavAdapter>
  );
}
