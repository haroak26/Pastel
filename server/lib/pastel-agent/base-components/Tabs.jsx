import { useState } from "react";

export default function Tabs({ items = [], defaultValue, onChange, className = "" }) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.id);
  return (
    <div className={className}>
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1" role="tablist">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setActive(item.id);
                onChange?.(item.id);
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                selected
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.find((i) => i.id === active)?.content}
    </div>
  );
}
