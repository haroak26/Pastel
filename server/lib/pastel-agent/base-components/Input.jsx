import { AlertCircle } from "lucide-react";

export default function Input({
  label,
  icon,
  hint,
  error,
  className = "",
  ...props
}) {
  const IconComp = icon ? icon : null;
  return (
    <label className={`block min-w-0 ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-card-foreground">{label}</span>
      )}
      <span className="relative block">
        {IconComp && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <IconComp size={16} />
          </span>
        )}
        <input
          className={`flex h-[var(--control-md)] w-full rounded-[var(--radius-md)] border border-input bg-card px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            icon ? "pl-9" : ""
          } ${error ? "border-destructive" : ""}`}
          {...props}
        />
      </span>
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      {!error && hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
