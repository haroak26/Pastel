// NameInput.tsx — Text input for user's first name. Use in onboarding flows, profile setup, and account creation forms.
import { cn } from "../lib/cn";

export interface NameInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export default function NameInput({
  className,
  value,
  onChange,
  placeholder = "Enter your first name",
  disabled = false,
  error,
  required = false,
  id,
  ...props
}: NameInputProps) {
  const inputId = id || "name-input";

  return (
    <div className="w-full">
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "w-full h-[var(--control-md)] px-4 rounded-[var(--radius-md)] font-[var(--font-body)] text-base text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
          "hover:border-[var(--color-border-default)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
          error && "border-[var(--color-danger-500)] focus-visible:ring-[var(--color-danger-500)]",
          disabled && "opacity-50 pointer-events-none bg-[var(--color-neutral-100)]",
          className
        )}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-2 text-sm text-[var(--color-danger-500)] font-[var(--font-body)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}