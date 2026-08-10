// BudgetInputForm.tsx — Collects a Wavelength budget and currency before continuing setup. Use when users are defining a spending limit.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const budgetInputFormVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] shadow-[var(--shadow-sm)]",
  {}
);

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)]",
        secondary:
          "border border-[var(--color-border-default)] bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
      size: {
        sm: "h-[var(--control-sm)] px-[var(--space-3)]",
        md: "h-[var(--control-md)] px-[var(--space-4)]",
        lg: "h-[var(--control-lg)] px-[var(--space-6)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface BudgetInputFormProps
  extends React.FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof budgetInputFormVariants> {
  currency: string;
  budgetAmount: number;
  currencies: string[];
  isLoading?: boolean;
  error?: string;
  onCurrencyChange: (currency: string) => void;
  onBudgetChange: (amount: number) => void;
  onNext: () => void;
  onSkip?: () => void;
}

function getCurrencySymbol(currency: string) {
  try {
    return (
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

export default function BudgetInputForm({
  className,
  currency,
  budgetAmount,
  currencies,
  isLoading = false,
  error,
  onCurrencyChange,
  onBudgetChange,
  onNext,
  onSkip,
  ...props
}: BudgetInputFormProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const amountInMajorUnits = (budgetAmount / 100).toFixed(2);

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const normalizedValue = event.target.value.replace(",", ".");
    const parsedAmount = Number.parseFloat(normalizedValue);

    onBudgetChange(
      Number.isFinite(parsedAmount) ? Math.round(parsedAmount * 100) : 0
    );
  }

  return (
    <form
      className={cn(budgetInputFormVariants(), className)}
      aria-busy={isLoading}
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      {...props}
    >
      <div className="flex flex-col gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            <h2
              className="text-[var(--color-text-primary)]"
              style={{
                font: "var(--text-xl) var(--font-display)",
                fontWeight: "var(--weight-semibold)",
              }}
            >
              Set your spending limit
            </h2>
            <p
              className="text-[var(--color-text-secondary)]"
              style={{
                font: "var(--text-base) var(--font-body)",
                fontWeight: "var(--weight-regular)",
              }}
            >
              Choose the currency and amount Wavelength should track for this
              budget.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <label
              htmlFor="budget-currency"
              className="text-[var(--color-text-secondary)]"
              style={{
                font: "var(--text-sm) var(--font-body)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              Currency
            </label>
            <select
              id="budget-currency"
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value)}
              disabled={isLoading}
              className="h-[var(--control-lg)] w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
              style={{
                font: "var(--text-base) var(--font-body)",
                fontWeight: "var(--weight-regular)",
              }}
            >
              {currencies.map((availableCurrency) => (
                <option key={availableCurrency} value={availableCurrency}>
                  {availableCurrency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[var(--space-2)]">
            <label
              htmlFor="budget-amount"
              className="text-[var(--color-text-secondary)]"
              style={{
                font: "var(--text-sm) var(--font-body)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              Monthly budget
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 left-[var(--space-4)] flex items-center text-[var(--color-text-muted)]"
                style={{
                  font: "var(--text-lg) var(--font-body)",
                  fontWeight: "var(--weight-medium)",
                }}
                aria-hidden="true"
              >
                {currencySymbol}
              </span>
              <input
                id="budget-amount"
                name="budgetAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountInMajorUnits}
                onChange={handleAmountChange}
                disabled={isLoading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "budget-error" : undefined}
                className={cn(
                  "h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-raised)] pl-[var(--space-8)] pr-[var(--space-4)] text-[var(--color-text-primary)] tabular-nums transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50",
                  error
                    ? "border-[var(--color-danger-500)]"
                    : "border-[var(--color-border-default)]"
                )}
                style={{
                  font: "var(--text-lg) var(--font-body)",
                  fontWeight: "var(--weight-medium)",
                }}
              />
            </div>
            {error && (
              <p
                id="budget-error"
                role="alert"
                className="text-[var(--color-danger-500)]"
                style={{
                  font: "var(--text-sm) var(--font-body)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-[var(--space-3)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]">
          {onSkip ? (
            <button
              type="button"
              className={cn(actionButtonVariants({ variant: "ghost", size: "md" }))}
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip for now
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className={cn(
              actionButtonVariants({ variant: "primary", size: "md" })
            )}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading && (
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
            )}
            Next
          </button>
        </div>
      </div>
    </form>
  );
}