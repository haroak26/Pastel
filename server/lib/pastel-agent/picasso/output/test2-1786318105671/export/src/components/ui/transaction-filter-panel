// TransactionFilterPanel.tsx — Compact Wavelength transaction filters for narrowing spending history by date, category, amount, and money flow.
import React, { useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "../lib/cn";

const transactionFilterPanelVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]"
);

export interface TransactionFilterPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof transactionFilterPanelVariants> {
  dateRange: {
    start: string;
    end: string;
  };
  selectedCategories: string[];
  amountRange: {
    min: number;
    max: number;
  };
  transactionType: "all" | "income" | "expense";
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onCategoryChange: (categories: string[]) => void;
  onAmountRangeChange: (range: { min: number; max: number }) => void;
  onTransactionTypeChange: (type: string) => void;
  categoryOptions?: string[];
  amountBounds?: {
    min: number;
    max: number;
  };
  disabled?: boolean;
  loading?: boolean;
}

export default function TransactionFilterPanel({
  className,
  dateRange,
  selectedCategories,
  amountRange,
  transactionType,
  onDateRangeChange,
  onCategoryChange,
  onAmountRangeChange,
  onTransactionTypeChange,
  categoryOptions = selectedCategories,
  amountBounds,
  disabled = false,
  loading = false,
  ...props
}: TransactionFilterPanelProps) {
  const id = useId();
  const startDateId = `${id}-start-date`;
  const endDateId = `${id}-end-date`;
  const amountMinId = `${id}-amount-min`;
  const amountMaxId = `${id}-amount-max`;
  const categoryTriggerId = `${id}-categories`;

  const bounds = {
    min: amountBounds?.min ?? amountRange.min,
    max: amountBounds?.max ?? amountRange.max,
  };

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const toggleCategory = (category: string) => {
    const nextCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];

    onCategoryChange(nextCategories);
  };

  const updateMinAmount = (value: number) => {
    onAmountRangeChange({
      min: Math.min(value, amountRange.max),
      max: amountRange.max,
    });
  };

  const updateMaxAmount = (value: number) => {
    onAmountRangeChange({
      min: amountRange.min,
      max: Math.max(value, amountRange.min),
    });
  };

  return (
    <div
      className={cn(
        transactionFilterPanelVariants(),
        loading && "pointer-events-none opacity-50",
        className
      )}
      aria-busy={loading}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
        <div>
          <p className="font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)]">
            Tune your money view
          </p>
          <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            Shape the transactions that appear in your Wavelength feed.
          </p>
        </div>

        {loading && (
          <span
            className="mt-[var(--space-1)] inline-flex h-[var(--space-4)] w-[var(--space-4)] animate-spin rounded-[var(--radius-full)] border-2 border-[var(--color-border-subtle)] border-t-[var(--color-accent-500)]"
            aria-label="Loading filters"
          />
        )}
      </div>

      <div className="mt-[var(--space-6)] grid gap-[var(--space-6)] lg:grid-cols-[2fr_1fr]">
        <section className="space-y-[var(--space-6)]" aria-label="Date and amount filters">
          <div>
            <div className="mb-[var(--space-2)] flex items-baseline justify-between gap-[var(--space-3)]">
              <label
                htmlFor={startDateId}
                className="text-[var(--text-sm)] font-[var(--weight-semibold)]"
              >
                Date range
              </label>
              <span className="font-[var(--font-mono)] text-[var(--text-xs)] text-[var(--color-text-muted)]">
                {dateRange.start} – {dateRange.end}
              </span>
            </div>

            <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
              <div>
                <label
                  htmlFor={startDateId}
                  className="mb-[var(--space-1)] block text-[var(--text-xs)] text-[var(--color-text-muted)]"
                >
                  From
                </label>
                <input
                  id={startDateId}
                  type="date"
                  value={dateRange.start}
                  disabled={disabled || loading}
                  onChange={(event) =>
                    onDateRangeChange({
                      start: event.target.value,
                      end: dateRange.end,
                    })
                  }
                  className="h-[var(--control-md)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor={endDateId}
                  className="mb-[var(--space-1)] block text-[var(--text-xs)] text-[var(--color-text-muted)]"
                >
                  To
                </label>
                <input
                  id={endDateId}
                  type="date"
                  value={dateRange.end}
                  disabled={disabled || loading}
                  onChange={(event) =>
                    onDateRangeChange({
                      start: dateRange.start,
                      end: event.target.value,
                    })
                  }
                  className="h-[var(--control-md)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-[var(--space-3)] flex items-baseline justify-between gap-[var(--space-3)]">
              <label
                htmlFor={amountMinId}
                className="text-[var(--text-sm)] font-[var(--weight-semibold)]"
              >
                Amount range
              </label>
              <span className="font-[var(--font-mono)] text-[var(--text-sm)] text-[var(--color-accent-600)]">
                {formatAmount(amountRange.min)} – {formatAmount(amountRange.max)}
              </span>
            </div>

            <div className="relative flex h-[var(--control-md)] items-center">
              <div className="absolute inset-x-0 h-[var(--space-1)] rounded-[var(--radius-full)] bg-[var(--color-neutral-200)]" />
              <input
                id={amountMinId}
                type="range"
                min={bounds.min}
                max={bounds.max}
                value={amountRange.min}
                disabled={disabled || loading}
                aria-label="Minimum transaction amount"
                onChange={(event) => updateMinAmount(Number(event.target.value))}
                className="relative z-10 h-[var(--control-md)] w-full cursor-pointer appearance-none bg-transparent accent-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
              <input
                id={amountMaxId}
                type="range"
                min={bounds.min}
                max={bounds.max}
                value={amountRange.max}
                disabled={disabled || loading}
                aria-label="Maximum transaction amount"
                onChange={(event) => updateMaxAmount(Number(event.target.value))}
                className="absolute z-20 h-[var(--control-md)] w-full cursor-pointer appearance-none bg-transparent accent-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
            </div>

            <div className="mt-[var(--space-1)] flex justify-between text-[var(--text-xs)] text-[var(--color-text-muted)]">
              <span>{formatAmount(bounds.min)}</span>
              <span>{formatAmount(bounds.max)}</span>
            </div>
          </div>
        </section>

        <section className="space-y-[var(--space-6)]" aria-label="Category and transaction type filters">
          <div>
            <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-semibold)]">
              Categories
            </span>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  id={categoryTriggerId}
                  type="button"
                  disabled={disabled || loading}
                  aria-label="Choose transaction categories"
                  className="flex h-[var(--control-md)] w-full items-center justify-between gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] text-left text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="truncate">
                    {selectedCategories.length > 0
                      ? selectedCategories.join(", ")
                      : "All categories"}
                  </span>
                  <span aria-hidden="true" className="text-[var(--color-text-muted)]">
                    ▾
                  </span>
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={8}
                  className="z-50 w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-2)] shadow-[var(--shadow-md)] focus:outline-none"
                >
                  <div className="space-y-[var(--space-1)]" role="group" aria-labelledby={categoryTriggerId}>
                    {categoryOptions.map((category) => {
                      const selected = selectedCategories.includes(category);

                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={selected}
                          disabled={disabled || loading}
                          onClick={() => toggleCategory(category)}
                          className="flex h-[var(--control-sm)] w-full items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] text-left text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex h-[var(--space-4)] w-[var(--space-4)] items-center justify-center rounded-[var(--radius-sm)] border",
                              selected
                                ? "border-[var(--color-accent-500)] bg-[var(--color-accent-500)] text-[var(--color-text-inverse)]"
                                : "border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
                            )}
                          >
                            {selected && "✓"}
                          </span>
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          <fieldset>
            <legend className="mb-[var(--space-2)] text-[var(--text-sm)] font-[var(--weight-semibold)]">
              Transaction type
            </legend>
            <div className="space-y-[var(--space-1)]">
              {(["all", "income", "expense"] as const).map((type) => (
                <label
                  key={type}
                  className="flex h-[var(--control-sm)] cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] text-[var(--text-sm)] capitalize transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-border-focus)] focus-within:ring-offset-2"
                >
                  <input
                    type="radio"
                    name={`${id}-transaction-type`}
                    value={type}
                    checked={transactionType === type}
                    disabled={disabled || loading}
                    onChange={(event) => onTransactionTypeChange(event.target.value)}
                    className="h-[var(--space-4)] w-[var(--space-4)] accent-[var(--color-accent-500)] disabled:pointer-events-none disabled:opacity-50"
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
    </div>
  );
}