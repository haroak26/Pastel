// GoalCreationForm.tsx — Collects the details for a new Wavelength savings goal before setup continues.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const goalCreationFormVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] shadow-[var(--shadow-sm)]",
  {}
);

const buttonVariants = cva(
  "inline-flex h-[var(--control-md)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-900)]",
        secondary:
          "border border-[var(--color-border-default)] bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface GoalCreationFormProps
  extends VariantProps<typeof goalCreationFormVariants> {
  goalName: string;
  category: string;
  targetAmount: number;
  deadline: string;
  categories: Array<{ label: string; value: string }>;
  isLoading?: boolean;
  error?: string;
  onGoalNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onTargetAmountChange: (amount: number) => void;
  onDeadlineChange: (date: string) => void;
  onNext: () => void;
  onSkip?: () => void;
}

export default function GoalCreationForm({
  className,
  goalName,
  category,
  targetAmount,
  deadline,
  categories,
  isLoading = false,
  error,
  onGoalNameChange,
  onCategoryChange,
  onTargetAmountChange,
  onDeadlineChange,
  onNext,
  onSkip,
}: GoalCreationFormProps) {
  const errorId = "goal-creation-form-error";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNext();
  }

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    const amount = Number.parseFloat(event.target.value);
    onTargetAmountChange(
      Number.isFinite(amount) ? Math.round(amount * 100) : 0
    );
  }

  return (
    <form
      className={cn(goalCreationFormVariants(), className)}
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      noValidate
    >
      <div className="mb-[var(--space-6)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
        <p className="mb-[var(--space-2)] font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-semibold)] text-[var(--color-accent-500)]">
          New savings goal
        </p>
        <h2 className="font-[var(--font-display)] text-[var(--text-2xl)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
          Give this goal a finish line
        </h2>
        <p className="mt-[var(--space-2)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
          Name the thing you are saving for, then choose a target and date.
        </p>
      </div>

      <div className="space-y-[var(--space-4)]">
        <div>
          <label
            htmlFor="goal-name"
            className="mb-[var(--space-2)] block font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
          >
            Goal name
          </label>
          <input
            id="goal-name"
            name="goalName"
            type="text"
            value={goalName}
            onChange={(event) => onGoalNameChange(event.target.value)}
            disabled={isLoading}
            required
            autoComplete="off"
            className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-background)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-neutral-500)] focus-visible:border-[var(--color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="goal-category"
            className="mb-[var(--space-2)] block font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
          >
            Category
          </label>
          <select
            id="goal-category"
            name="category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            disabled={isLoading}
            required
            className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-background)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:border-[var(--color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
          >
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
          <div>
            <label
              htmlFor="goal-amount"
              className="mb-[var(--space-2)] block font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
            >
              Target amount
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-[var(--space-4)] top-1/2 -translate-y-1/2 font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-muted)]"
                aria-hidden="true"
              >
                $
              </span>
              <input
                id="goal-amount"
                name="targetAmount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={targetAmount > 0 ? (targetAmount / 100).toFixed(2) : ""}
                onChange={handleAmountChange}
                disabled={isLoading}
                required
                className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-background)] pl-[var(--space-8)] pr-[var(--space-4)] font-[var(--font-mono)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:border-[var(--color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="goal-deadline"
              className="mb-[var(--space-2)] block font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
            >
              Deadline
            </label>
            <input
              id="goal-deadline"
              name="deadline"
              type="date"
              value={deadline}
              onChange={(event) => onDeadlineChange(event.target.value)}
              disabled={isLoading}
              required
              className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-background)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:border-[var(--color-border-focus)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:border-[var(--color-accent-600)] disabled:pointer-events-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-3)] py-[var(--space-2)] font-[var(--font-body)] text-[var(--text-sm)] text-[var(--color-danger-900)]"
        >
          {error}
        </p>
      )}

      <div className="mt-[var(--space-6)] flex items-center justify-between gap-[var(--space-3)]">
        {onSkip ? (
          <button
            type="button"
            className={cn(buttonVariants({ variant: "ghost" }))}
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
          className={cn(buttonVariants({ variant: "primary" }))}
          disabled={isLoading}
          aria-busy={isLoading}
          aria-describedby={error ? errorId : undefined}
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
    </form>
  );
}