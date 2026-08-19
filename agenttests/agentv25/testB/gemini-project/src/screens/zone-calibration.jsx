import { useState } from "react";
import { NavAdapter, IconOf } from "../lib/shell.jsx";
import { DATA } from "../data.js";
import ZoneCalibrationMatrix from "../components/ZoneCalibrationMatrix.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";

export default function ZoneCalibration() {
  const [active, setActive] = useState("zone-calibration");
  const threshold = DATA.metrics.find((m) => m.label === "Threshold Pace");
  return (
    <NavAdapter nav="topbar" activeId="zone-calibration" onNavigate={setActive}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge label="5-Tier Lactate" variant="volt" />
              <Badge label="94.2% fidelity" variant="success" />
            </div>
            <h1 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Zone Calibration
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Anchor: {threshold ? `${threshold.value} ${threshold.unit}` : "—"} threshold pace. Adjust bands to keep the curve physiological.
            </p>
          </div>
          <Button variant="primary" size="md">
            <IconOf name="check" className="h-4 w-4" />
            Commit calibration
          </Button>
        </div>
        <ZoneCalibrationMatrix lactateThresholdPace={threshold ? `${threshold.value} ${threshold.unit}` : "3:12 min/km"} />
      </div>
    </NavAdapter>
  );
}
