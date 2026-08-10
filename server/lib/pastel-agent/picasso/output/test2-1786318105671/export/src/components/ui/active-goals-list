// ActiveGoalsList.tsx — Displays active Wavelength savings goals with sortable progress, deadlines, and current balances.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const activeGoalsListVariants = cva(
  "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)]",
  {
    variants: {
      sortBy: {
        progress: "",
        deadline: "",
        name: "",
      },
      sortOrder: {
        asc: "",
        desc: "",
      },
    },
    defaultVariants: {
      sortBy: "progress",
      sortOrder: "desc",
    },
  }
);

export interface ActiveGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

export interface ActiveGoalsListProps
  extends VariantProps<typeof activeGoalsListVariants> {
  goals: ActiveGoal[];
  currency: string;
  isLoading?: boolean;
  error?: string;
  onGoalClick?: (goalId: string) => void;
  onSort?: (sortBy: string, sortOrder: string) => void;
  className?: string;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeadline(deadline: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(deadline));
}

function getDaysRemaining(deadline: string) {
  const today = new Date();
  const endDate = new Date(deadline);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / millisecondsPerDay)
  );
}

export default function ActiveGoalsList({
  goals,
  currency,
  isLoading = false,
  error,
  onGoalClick,
  onSort,
  sortBy = "progress",
  sortOrder = "desc",
  className,
}: ActiveGoalsListProps) {
  const sortedGoals = React.useMemo(() => {
    return [...goals].sort((firstGoal, secondGoal) => {
      const firstProgress =
        firstGoal.targetAmount > 0
          ? firstGoal.currentAmount / firstGoal.targetAmount
          : 0;
      const secondProgress =
        secondGoal.targetAmount > 0
          ? secondGoal.currentAmount / secondGoal.targetAmount
          : 0;

      let comparison = 0;

      if (sortBy === "name") {
        comparison = firstGoal.name.localeCompare(secondGoal.name);
      } else if (sortBy === "deadline") {
        comparison =
          new Date(firstGoal.deadline).getTime() -
          new Date(secondGoal.deadline).getTime();
      } else {
        comparison = firstProgress - secondProgress;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [goals, sortBy, sortOrder]);

  const handleSort = (nextSortBy: "progress" | "deadline" | "name") => {
    if (!onSort) return;

    const nextSortOrder =
      sortBy === nextSortBy && sortOrder === "asc" ? "desc" : "asc";

    onSort(nextSortBy, nextSortOrder);
  };

  const renderSortButton = (
    label: string,
    value: "progress" | "deadline" | "name"
  ) => {
    const isActive = sortBy === value;

    return (
      <button
        type="button"
        className={cn(
          "inline-flex h-[var(--control-sm)] items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] px-[var(--space-2)] font-[var(--font-body)] text-[length:var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive && "text-[var(--color-text-primary)]"
        )}
        onClick={() => handleSort(value)}
        disabled={!onSort}
        aria-label={`Sort goals by ${label.toLowerCase()} ${
          isActive && sortOrder === "asc" ? "descending" : "ascending"
        }`}
      >
        <span>{label}</span>
        {isActive && (
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)]"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            {sortOrder === "asc" ? (
              <path
                d="M8 12V4M5 7l3-3 3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M8 4v8m3-3-3 3-3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        )}
      </button>
    );
  };

  return (
    <section
      className={cn(
        activeGoalsListVariants({ sortBy, sortOrder }),
        className
      )}
      aria-busy={isLoading}
      aria-labelledby="active-goals-heading"
    >
      <div className="flex items-end justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] px-[var(--space-6)] py-[var(--space-4)]">
        <div>
          <h2
            id="active-goals-heading"
            className="font-[var(--font-display)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]"
          >
            Active savings goals
          </h2>
          <p className="mt-[var(--space-1)] font-[var(--font-body)] text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Keep an eye on what your next money milestone needs.
          </p>
        </div>
        <span className="font-[var(--font-mono)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
          {goals.length} {goals.length === 1 ? "goal" : "goals"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-12)] text-[var(--color-text-secondary)]">
          <svg
            className="h-[var(--space-6)] w-[var(--space-6)] animate-spin"
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
          <span className="font-[var(--font-body)] text-[length:var(--text-base)]">
            Loading active goals
          </span>
        </div>
      ) : error ? (
        <div
          className="border-l-[var(--space-1)] border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-6)] py-[var(--space-6)] font-[var(--font-body)] text-[length:var(--text-base)] text-[var(--color-danger-900)]"
          role="alert"
        >
          {error}
        </div>
      ) : sortedGoals.length === 0 ? (
        <div className="px-[var(--space-6)] py-[var(--space-12)]">
          <p className="font-[var(--font-display)] text-[length:var(--text-lg)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
            No active goals yet
          </p>
          <p className="mt-[var(--space-2)] max-w-[var(--space-24)] font-[var(--font-body)] text-[length:var(--text-base)] text-[var(--color-text-secondary)]">
            Your next savings target will show up here once you create one.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Active savings goals with progress and deadlines
            </caption>
            <thead className="bg-[var(--color-neutral-50)]">
              <tr>
                <th
                  scope="col"
                  className="px-[var(--space-6)] py-[var(--space-3)] font-[var(--font-body)] text-[length:var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                  aria-sort={sortBy === "name" ? sortOrder : "none"}
                >
                  {renderSortButton("Goal", "name")}
                </th>
                <th
                  scope="col"
                  className="px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-body)] text-[length:var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                >
                  Saved
                </th>
                <th
                  scope="col"
                  className="min-w-[var(--space-24)] px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-body)] text-[length:var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                  aria-sort={sortBy === "progress" ? sortOrder : "none"}
                >
                  {renderSortButton("Progress", "progress")}
                </th>
                <th
                  scope="col"
                  className="px-[var(--space-6)] py-[var(--space-3)] font-[var(--font-body)] text-[length:var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                  aria-sort={sortBy === "deadline" ? sortOrder : "none"}
                >
                  {renderSortButton("Deadline", "deadline")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {sortedGoals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.max(
                    0,
                    goal.targetAmount > 0
                      ? (goal.currentAmount / goal.targetAmount) * 100
                      : 0
                  )
                );
                const daysRemaining = getDaysRemaining(goal.deadline);

                return (
                  <tr
                    key={goal.id}
                    className={cn(
                      onGoalClick &&
                        "cursor-pointer transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-border-focus)]"
                    )}
                    onClick={() => onGoalClick?.(goal.id)}
                    onKeyDown={(event) => {
                      if (
                        onGoalClick &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        onGoalClick(goal.id);
                      }
                    }}
                    tabIndex={onGoalClick ? 0 : undefined}
                    role={onGoalClick ? "button" : undefined}
                    aria-label={
                      onGoalClick ? `Open savings goal ${goal.name}` : undefined
                    }
                  >
                    <th
                      scope="row"
                      className="px-[var(--space-6)] py-[var(--space-4)]"
                    >
                      <div className="font-[var(--font-body)] text-[length:var(--text-base)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
                        {goal.name}
                      </div>
                      <div className="mt-[var(--space-1)] font-[var(--font-body)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                        {goal.category}
                      </div>
                    </th>
                    <td className="whitespace-nowrap px-[var(--space-4)] py-[var(--space-4)] align-middle">
                      <div className="font-[var(--font-mono)] text-[length:var(--text-base)] font-[var(--weight-medium)] tabular-nums text-[var(--color-text-primary)]">
                        {formatAmount(goal.currentAmount, currency)}
                      </div>
                      <div className="mt-[var(--space-1)] font-[var(--font-body)] text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                        of {formatAmount(goal.targetAmount, currency)}
                      </div>
                    </td>
                    <td className="min-w-[var(--space-24)] px-[var(--space-4)] py-[var(--space-4)] align-middle">
                      <div className="flex items-center gap-[var(--space-3)]">
                        <div
                          className="h-[var(--space-2)] min-w-[var(--space-12)] flex-1 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-neutral-200)]"
                          role="progressbar"
                          aria-label={`${goal.name} progress`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(progress)}
                        >
                          <div
                            className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent-500)] transition-[width] duration-[var(--duration-base)] ease-[var(--easing-standard)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="w-[var(--space-8)] font-[var(--font-mono)] text-[length:var(--text-sm)] font-[var(--weight-medium)] tabular-nums text-[var(--color-text-primary)]">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-6)] py-[var(--space-4)] align-middle">
                      <div className="font-[var(--font-body)] text-[length:var(--text-base)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                        {formatDeadline(goal.deadline)}
                      </div>
                      <div className="mt-[var(--space-1)] font-[var(--font-body)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                        {daysRemaining}{" "}
                        {daysRemaining === 1 ? "day" : "days"} left
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}