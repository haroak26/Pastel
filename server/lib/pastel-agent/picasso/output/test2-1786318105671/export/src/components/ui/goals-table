// GoalsTable.tsx — Displays savings goals with progress, deadlines, sorting, and row actions. Use in the Wavelength goals view.
import { useMemo, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const goalsTableVariants = cva(
  "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)]",
  {
    variants: {
      density: {
        compact: "[&_th]:py-[var(--space-2)] [&_td]:py-[var(--space-2)]",
        comfortable: "[&_th]:py-[var(--space-3)] [&_td]:py-[var(--space-4)]",
      },
      sortBy: {
        name: "",
        progress: "",
        deadline: "",
      },
    },
    defaultVariants: {
      density: "comfortable",
      sortBy: "name",
    },
  }
);

const actionButtonVariants = cva(
  "inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        default: "",
        danger:
          "hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)] active:bg-[var(--color-danger-50)]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

export interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  progress: number;
}

export interface GoalsTableProps
  extends VariantProps<typeof goalsTableVariants> {
  goals: Goal[];
  currency: string;
  isLoading?: boolean;
  error?: string;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  onViewDetails?: (goalId: string) => void;
}

function CategoryIcon({ category }: { category: string }) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("travel")) {
    return <span aria-hidden="true">✈</span>;
  }

  if (
    normalizedCategory.includes("home") ||
    normalizedCategory.includes("rent")
  ) {
    return <span aria-hidden="true">⌂</span>;
  }

  if (
    normalizedCategory.includes("education") ||
    normalizedCategory.includes("school")
  ) {
    return <span aria-hidden="true">▣</span>;
  }

  if (
    normalizedCategory.includes("tech") ||
    normalizedCategory.includes("phone")
  ) {
    return <span aria-hidden="true">▯</span>;
  }

  return <span aria-hidden="true">✦</span>;
}

function MoreIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "h-4 w-4 transition-transform duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
        expanded && "rotate-180"
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 animate-spin text-[var(--color-accent-500)]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export default function GoalsTable({
  goals,
  currency,
  isLoading = false,
  error,
  density,
  sortBy,
  onEdit,
  onDelete,
  onViewDetails,
}: GoalsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  );

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "deadline") {
        return (
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
      }
      return a.name.localeCompare(b.name);
    });
  }, [goals, sortBy]);

  return (
    <section
      className={cn(goalsTableVariants({ density, sortBy }))}
      aria-busy={isLoading}
      aria-label="Savings goals"
    >
      <div className="flex items-center justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] bg-[var(--color-neutral-50)] px-[var(--space-4)] py-[var(--space-3)]">
        <div>
          <h2 className="font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)]">
            Savings goals
          </h2>
          <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            Keep your next milestone in sight.
          </p>
        </div>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-accent-50)] px-[var(--space-3)] py-[var(--space-1)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-accent-900)]">
          {goals.length} goals
        </span>
      </div>

      {error ? (
        <div
          className="border-b border-[var(--color-border-subtle)] bg-[var(--color-danger-50)] px-[var(--space-4)] py-[var(--space-4)] text-[var(--text-base)] text-[var(--color-danger-900)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="border-b border-[var(--color-border-subtle)] text-left">
            <tr>
              <th
                className="px-[var(--space-4)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                scope="col"
              >
                Goal
              </th>
              <th
                className="px-[var(--space-3)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                scope="col"
              >
                Target
              </th>
              <th
                className="px-[var(--space-3)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                scope="col"
              >
                Saved
              </th>
              <th
                className="w-[24%] px-[var(--space-3)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                scope="col"
              >
                Progress
              </th>
              <th
                className="px-[var(--space-3)] text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]"
                scope="col"
              >
                Deadline
              </th>
              <th className="w-[var(--control-lg)] px-[var(--space-4)]" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {isLoading ? (
              <tr>
                <td
                  className="px-[var(--space-4)] py-[var(--space-8)]"
                  colSpan={6}
                >
                  <div className="flex items-center gap-[var(--space-3)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    <Spinner />
                    Loading your goals
                  </div>
                </td>
              </tr>
            ) : sortedGoals.length === 0 ? (
              <tr>
                <td
                  className="px-[var(--space-4)] py-[var(--space-8)] text-[var(--text-base)] text-[var(--color-text-secondary)]"
                  colSpan={6}
                >
                  No savings goals yet. Add one to give your next win a target.
                </td>
              </tr>
            ) : (
              sortedGoals.map((goal) => {
                const progress = Math.min(100, Math.max(0, goal.progress));
                const menuOpen = openMenuId === goal.id;

                return (
                  <tr
                    className="transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-50)]"
                    key={goal.id}
                  >
                    <td className="px-[var(--space-4)]">
                      <div className="flex items-center gap-[var(--space-3)]">
                        <span
                          className="flex h-[var(--control-sm)] w-[var(--control-sm)] shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-50)] font-[var(--font-display)] text-[var(--text-base)] text-[var(--color-accent-900)]"
                          title={goal.category}
                        >
                          <CategoryIcon category={goal.category} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-[var(--font-display)] text-[var(--text-base)] font-[var(--weight-semibold)]">
                            {goal.name}
                          </p>
                          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                            {goal.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-sm)] tabular-nums">
                      {formatter.format(goal.targetAmount)}
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-sm)] tabular-nums">
                      {formatter.format(goal.currentAmount)}
                    </td>
                    <td className="px-[var(--space-3)]">
                      <div className="flex items-center gap-[var(--space-3)]">
                        <div
                          aria-label={`${progress}% complete`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={progress}
                          className="h-[var(--space-2)] flex-1 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-neutral-200)]"
                          role="progressbar"
                        >
                          <div
                            className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent-500)] transition-[width] duration-[var(--duration-base)] ease-[var(--easing-standard)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="w-[var(--space-8)] text-right font-[var(--font-mono)] text-[var(--text-xs)] tabular-nums text-[var(--color-text-secondary)]">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-[var(--space-3)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                      <time dateTime={goal.deadline}>{goal.deadline}</time>
                    </td>
                    <td className="relative px-[var(--space-4)]">
                      <button
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        aria-label={`Actions for ${goal.name}`}
                        className={cn(actionButtonVariants())}
                        onClick={() =>
                          setOpenMenuId(menuOpen ? null : goal.id)
                        }
                        type="button"
                      >
                        <MoreIcon />
                      </button>

                      {menuOpen ? (
                        <div
                          className="absolute right-[var(--space-4)] top-[calc(100%-var(--space-2))] z-10 w-40 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-1)] shadow-[var(--shadow-md)]"
                          role="menu"
                        >
                          <button
                            className="flex h-[var(--control-sm)] w-full items-center rounded-[var(--radius-sm)] px-[var(--space-2)] text-left text-[var(--text-sm)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            disabled={!onViewDetails}
                            onClick={() => {
                              onViewDetails?.(goal.id);
                              setOpenMenuId(null);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            View details
                          </button>
                          <button
                            className="flex h-[var(--control-sm)] w-full items-center rounded-[var(--radius-sm)] px-[var(--space-2)] text-left text-[var(--text-sm)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                            disabled={!onEdit}
                            onClick={() => {
                              onEdit?.(goal.id);
                              setOpenMenuId(null);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            Edit goal
                          </button>
                          <button
                            className={cn(
                              "flex h-[var(--control-sm)] w-full items-center rounded-[var(--radius-sm)] px-[var(--space-2)] text-left text-[var(--text-sm)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)] active:bg-[var(--color-danger-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                              !onDelete && "pointer-events-none opacity-50"
                            )}
                            disabled={!onDelete}
                            onClick={() => {
                              onDelete?.(goal.id);
                              setOpenMenuId(null);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            Delete goal
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}