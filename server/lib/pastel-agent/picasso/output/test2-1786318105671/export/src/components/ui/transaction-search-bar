// TransactionSearchBar.tsx — Search transactions by merchant or description. Use above transaction lists and activity feeds.
import { useId } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const searchBarVariants = cva(
  "flex h-[var(--control-md)] items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border bg-[var(--color-surface-raised)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-border-focus)] focus-within:ring-offset-2 active:border-[var(--color-accent-600)] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
  {
    variants: {
      state: {
        default: "border-[var(--color-border-default)]",
        disabled: "border-[var(--color-border-default)]",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export interface TransactionSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (query: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function TransactionSearchBar({
  placeholder,
  value,
  onChange,
  onClear,
  disabled = false,
  loading = false,
}: TransactionSearchBarProps) {
  const inputId = useId();
  const isDisabled = disabled || loading;

  return (
    <div
      className={cn(
        searchBarVariants({
          state: isDisabled ? "disabled" : "default",
        })
      )}
      data-disabled={isDisabled}
    >
      <svg
        className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 text-[var(--color-text-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>

      <label className="sr-only" htmlFor={inputId}>
        Search transactions
      </label>

      <input
        id={inputId}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={isDisabled}
        aria-busy={loading}
        className="min-w-0 flex-1 bg-transparent font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
      />

      {loading && (
        <svg
          className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 animate-spin text-[var(--color-accent-500)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}

      {!loading && value && onClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          aria-label="Clear transaction search"
          className="inline-flex h-[var(--control-sm)] w-[var(--control-sm)] shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:bg-[var(--color-neutral-200)] disabled:pointer-events-none disabled:opacity-50"
        >
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}