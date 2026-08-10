// MonthlyBudgetCard.tsx — Shows Wavelength’s current-month budget, spending progress, and amount left to spend.
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const monthlyBudgetCardVariants = cva(
  "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
  {
    variants: {
      size: {
        sm: "p-[var(--space-4)]",
        md: "p-[var(--space-6)]",
      },
      displayMode: {
        compact: "flex items-center gap-[var(--space-4)]",
        expanded: "flex flex-col gap-[var(--space-6)]",
      },
    },
    defaultVariants: {
      size: "md",
      displayMode: "expanded",
    },
  }
);

export interface MonthlyBudgetCardProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof monthlyBudgetCardVariants> {
  totalBudget: number;
  spent: number;
  currency: string;
  isLoading?: boolean;
  error?: string;
}

export default function MonthlyBudgetCard({
  className,
  size,
  displayMode,
  totalBudget,
  spent,
  currency,
  isLoading = false,
  error,
  ...props
}: MonthlyBudgetCardProps) {
  const remaining = totalBudget - spent;
  const progress =
    totalBudget > 0
      ? Math.min(100, Math.max(0, Math.round((spent / totalBudget) * 100)))
      : 0;

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatAmount = (amountInCents: number) =>
    formatter.format(amountInCents / 100);

  const ringSize =
    size === "sm" ? "h-[var(--space-12)] w-[var(--space-12)]" : "h-[var(--space-16)] w-[var(--space-16)]";

  return (
    <article
      className={cn(
        monthlyBudgetCardVariants({ size, displayMode }),
        isLoading && "pointer-events-none",
        className
      )}
      aria-busy={isLoading}
      {...props}
    >
      <div
        className={cn(
          "flex min-w-0",
          displayMode === "compact"
            ? "flex-1 items-center justify-between gap-[var(--space-4)]"
            : "items-start justify-between gap-[var(--space-4)]"
        )}
      >
        <div className="min-w-0">
          <p className="font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
            Monthly budget
          </p>
          <p className="mt-[var(--space-1)] font-[var(--font-display)] text-[var(--text-2xl)] font-[var(--weight-semibold)] tabular-nums">
            {formatAmount(totalBudget)}
          </p>
        </div>

        <div className="relative shrink-0" aria-label={`${progress}% of budget spent`}>
          <svg
            className={ringSize}
            viewBox="0 0 100 100"
            fill="none"
            role="img"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              pathLength="100"
              stroke="var(--color-accent-50)"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              pathLength="100"
              stroke="var(--color-accent-500)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${100 - progress}`}
              transform="rotate(-90 50 50)"
              className="transition-all duration-[var(--duration-slow)] ease-[var(--easing-standard)]"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-[var(--font-mono)] text-[var(--text-xs)] font-[var(--weight-semibold)] tabular-nums text-[var(--color-text-primary)]">
            {progress}%
          </span>
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex items-center gap-[var(--space-2)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)] text-[var(--text-sm)] text-[var(--color-text-muted)]"
          role="status"
        >
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
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
          Updating your budget
        </div>
      ) : error ? (
        <p
          className="border-t border-[var(--color-danger-500)] pt-[var(--space-4)] text-[var(--text-sm)] text-[var(--color-danger-900)]"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <div
          className={cn(
            "border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]",
            displayMode === "compact"
              ? "hidden"
              : "grid grid-cols-2 gap-[var(--space-4)]"
          )}
        >
          <div>
            <p className="font-[var(--font-body)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
              Spent
            </p>
            <p className="mt-[var(--space-1)] font-[var(--font-mono)] text-[var(--text-lg)] font-[var(--weight-semibold)] tabular-nums">
              {formatAmount(spent)}
            </p>
          </div>
          <div>
            <p className="font-[var(--font-body)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
              Left to spend
            </p>
            <p
              className={cn(
                "mt-[var(--space-1)] font-[var(--font-mono)] text-[var(--text-lg)] font-[var(--weight-semibold)] tabular-nums",
                remaining < 0
                  ? "text-[var(--color-danger-500)]"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              {formatAmount(remaining)}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}