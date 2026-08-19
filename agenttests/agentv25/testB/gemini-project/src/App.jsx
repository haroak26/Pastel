import { useState } from "react";
import TelemetryOverview from "./screens/telemetry-overview.jsx";
import SessionDetail from "./screens/session-detail.jsx";
import ZoneCalibration from "./screens/zone-calibration.jsx";

export default function App() {
  const [active, setActive] = useState("telemetry-overview");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 lg:hidden">
        <button key="telemetry-overview" type="button" onClick={() => setActive("telemetry-overview")} className={active === "telemetry-overview" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>Telemetry-overview</button>
        <button key="session-detail" type="button" onClick={() => setActive("session-detail")} className={active === "session-detail" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>Session-detail</button>
        <button key="zone-calibration" type="button" onClick={() => setActive("zone-calibration")} className={active === "zone-calibration" ? "rounded-[var(--radius-md)] bg-muted/50 px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" : "rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"}>Zone-calibration</button>
      </div>
      {active === "telemetry-overview" ? <TelemetryOverview /> : null}
      {active === "session-detail" ? <SessionDetail /> : null}
      {active === "zone-calibration" ? <ZoneCalibration /> : null}
    </div>
  );
}
