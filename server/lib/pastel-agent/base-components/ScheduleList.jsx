import { Clock } from "lucide-react";

/** Schedule list — dated rows for itineraries, plans, and sessions. */
export default function ScheduleList({ items = [], title = "", className = "" }) {
  return (
    <div className={className}>
      {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
      <ol className="mt-4">
        {(items ?? []).slice(0, 6).map((item, i) => (
          <li key={item?.id ?? i} className="relative flex gap-4 pb-5 last:pb-0">
            <span className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </span>
              {i < Math.min((items ?? []).length, 6) - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
            </span>
            <span className="min-w-0 pt-1">
              <span className="block truncate text-sm font-semibold">{item?.name ?? item}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {[item?.detail, item?.date].filter(Boolean).join(" · ")}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
