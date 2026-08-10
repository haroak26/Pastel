// BudgetSettingsSection.tsx — Monthly budget controls for setting the spending limit, currency, and reset day in Wavelength.
import { useId } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const sectionVariants = cva(
  "rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-6)] shadow-[var(--shadow-sm)]",
  {
    variants: {},
  }
);

export interface BudgetSettingsSectionProps {
  monthlyBudget: number;
  currency: string;
  budgetResetDay: number;
  isLoading?: boolean;
  error?: string;
  onBudgetChange: (amount: number) => void;
  onCurrencyChange: (currency: string) => void;
  onResetDayChange: (day: number) => void;
  className?: string;
}

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

export default function BudgetSettingsSection({
  monthlyBudget,
  currency,
  budgetResetDay,
  isLoading = false,
  error,
  onBudgetChange,
  onCurrencyChange,
  onResetDayChange,
  className,
}: BudgetSettingsSectionProps) {
  const budgetId = useId();
  const currencyId = useId();
  const resetDayId = useId();
  const errorId = useId();

  const resetDays = Array.from({ length: 31 }, (_, index) => index + 1);

  return (
    <section
      className={cn(sectionVariants(), className)}
      aria-busy={isLoading}
      aria-describedby={error ? errorId : undefined}
    >
      <div className="flex items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
        <div>
          <h2
            className="text-[var(--color-text-primary)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: "var(--weight-semibold)",
              lineHeight: "var(--text-xl)",
            }}
          >
            Monthly budget
          </h2>
          <p
            className="mt-[var(--space-1)] text-[var(--color-text-secondary)]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-regular)",
              lineHeight: "var(--text-base)",
            }}
          >
            Keep your spending streak on track with a limit that fits your month.
          </p>
        </div>

        {isLoading && (
          <svg
            className="mt-[var(--space-1)] h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Saving budget settings"
            role="status"
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
      </div>

      <fieldset
        disabled={isLoading}
        className="mt-[var(--space-6)] grid gap-[var(--space-4)] md:grid-cols-[2fr_1fr_1fr]"
      >
        <legend className="sr-only">Budget settings</legend>

        <div className="flex flex-col gap-[var(--space-2)]">
          <label
            htmlFor={budgetId}
            className="text-[var(--color-text-secondary)]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--text-sm)",
            }}
          >
            Monthly limit
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-base)",
                fontWeight: "var(--weight-medium)",
                lineHeight: "var(--text-base)",
              }}
            >
              {currency}
            </span>
            <input
              id={budgetId}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={(monthlyBudget / 100).toFixed(2)}
              onChange={(event) => {
                const amount = Number.parseFloat(event.target.value);
                onBudgetChange(Number.isFinite(amount) ? Math.round(amount * 100) : 0);
              }}
              className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pl-[var(--space-8)] pr-[var(--space-3)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-lg)",
                fontWeight: "var(--weight-medium)",
                lineHeight: "var(--text-lg)",
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-2)]">
          <label
            htmlFor={currencyId}
            className="text-[var(--color-text-secondary)]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--text-sm)",
            }}
          >
            Currency
          </label>
          <select
            id={currencyId}
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value)}
            className="h-[var(--control-lg)] w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--text-base)",
            }}
          >
            {currencies.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-[var(--space-2)]">
          <label
            htmlFor={resetDayId}
            className="text-[var(--color-text-secondary)]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--text-sm)",
            }}
          >
            Reset day
          </label>
          <select
            id={resetDayId}
            value={budgetResetDay}
            onChange={(event) => onResetDayChange(Number(event.target.value))}
            className="h-[var(--control-lg)] w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-base)",
              fontWeight: "var(--weight-medium)",
              lineHeight: "var(--text-base)",
            }}
          >
            {resetDays.map((day) => (
              <option key={day} value={day}>
                Day {day}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-[var(--space-4)] rounded-[var(--radius-sm)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-danger-900)]"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            lineHeight: "var(--text-sm)",
          }}
        >
          {error}
        </p>
      )}
    </section>
  );
}