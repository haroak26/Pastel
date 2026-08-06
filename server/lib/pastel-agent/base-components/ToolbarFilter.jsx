import { Search } from "lucide-react";

/** Toolbar filter — one search input + one Select + one action (UX law). */
export default function ToolbarFilter({ placeholder = "Search", options = [], onSearch = null, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center ${className}`}>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        />
      </label>
      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
        {(options ?? []).map((o) => (
          <option key={o?.value ?? o} value={o?.value ?? o}>
            {o?.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}
