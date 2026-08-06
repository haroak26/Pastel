import { ChevronDown } from "lucide-react";

export default function Select({
  label,
  options = [],
  placeholder,
  value = "",
  className = "",
  ...props
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-card-foreground">{label}</span>
      )}
      <span className="relative block">
        <select
          className="flex h-[var(--control-md)] w-full appearance-none rounded-[var(--radius-md)] border border-input bg-card px-3 pr-9 text-sm text-card-foreground ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <ChevronDown size={16} />
        </span>
      </span>
    </label>
  );
}
