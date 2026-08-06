import { Play } from "lucide-react";

/** Horizontal media strip — browse rows of playable/editable content. */
export default function MediaStrip({ title = "", items = [], onSelect = null, className = "" }) {
  return (
    <div className={className}>
      {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {items.slice(0, 8).map((item) => (
          <button
            key={item?.id ?? item?.name}
            type="button"
            onClick={() => onSelect?.(item)}
            className="group w-32 shrink-0 text-left focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="relative block aspect-square overflow-hidden rounded-lg bg-muted/60">
              <span className="absolute inset-0 flex items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground">
                <Play className="h-6 w-6 fill-current" />
              </span>
            </span>
            <span className="mt-1.5 block truncate text-xs font-medium">{item?.name ?? item}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{item?.detail ?? ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
