// GoalDetailModal.tsx — Modal for reviewing and updating a Wavelength savings goal. Use when a goal needs focused edits without leaving the goals view.
import { useEffect, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const modalContentVariants = cva(
  "w-[calc(100%-var(--space-8))] max-h-[calc(100vh-var(--space-8))] overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-xl)] outline-none sm:w-full",
  {}
);

const actionButtonVariants = cva(
  "inline-flex h-[var(--control-md)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-900)]",
        secondary:
          "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

interface Goal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description: string;
}

export interface GoalDetailModalProps {
  isOpen: boolean;
  goal: Goal;
  currency: string;
  isLoading?: boolean;
  error?: string;
  onSave: (updatedGoal: Goal) => void;
  onCancel: () => void;
}

export default function GoalDetailModal({
  isOpen,
  goal,
  currency,
  isLoading = false,
  error,
  onSave,
  onCancel,
}: GoalDetailModalProps) {
  const [form, setForm] = useState<Goal>(goal);

  useEffect(() => {
    setForm(goal);
  }, [goal]);

  const updateField = <K extends keyof Goal>(field: K, value: Goal[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(form);
  };

  const formattedCurrentAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(form.currentAmount);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onCancel();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--color-neutral-950)]/50 transition-opacity duration-[var(--duration-base)] ease-[var(--easing-standard)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Content
          className={cn(
            modalContentVariants(),
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
          )}
          aria-describedby="goal-detail-description"
        >
          <div className="flex items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] px-[var(--space-6)] py-[var(--space-4)]">
            <div>
              <Dialog.Title className="font-[var(--font-display)] text-[var(--text-2xl)] font-[var(--weight-semibold)] tracking-[-0.02em]">
                Edit goal
              </Dialog.Title>
              <Dialog.Description
                id="goal-detail-description"
                className="mt-[var(--space-1)] text-[var(--text-base)] text-[var(--color-text-secondary)]"
              >
                Keep the details current so your savings plan stays on track.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Close goal details"
                className="inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <svg
                  className="h-[var(--space-4)] w-[var(--space-4)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-[var(--space-6)] px-[var(--space-6)] py-[var(--space-6)]">
              <div className="rounded-[var(--radius-lg)] bg-[var(--color-accent-50)] p-[var(--space-4)]">
                <p className="text-[var(--text-xs)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                  Saved so far
                </p>
                <p className="mt-[var(--space-1)] font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--weight-semibold)] tabular-nums text-[var(--color-accent-900)]">
                  {formattedCurrentAmount}
                </p>
              </div>

              <div className="space-y-[var(--space-4)]">
                <div>
                  <label
                    htmlFor="goal-name"
                    className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                  >
                    Goal name
                  </label>
                  <input
                    id="goal-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    disabled={isLoading}
                    required
                    className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  />
                </div>

                <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="goal-target-amount"
                      className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                    >
                      Target amount
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 font-[var(--font-mono)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
                        {currency}
                      </span>
                      <input
                        id="goal-target-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.targetAmount}
                        onChange={(event) =>
                          updateField("targetAmount", Number(event.target.value))
                        }
                        disabled={isLoading}
                        required
                        className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pl-[var(--space-12)] pr-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="goal-current-amount"
                      className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                    >
                      Current savings
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 font-[var(--font-mono)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
                        {currency}
                      </span>
                      <input
                        id="goal-current-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.currentAmount}
                        onChange={(event) =>
                          updateField("currentAmount", Number(event.target.value))
                        }
                        disabled={isLoading}
                        required
                        className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pl-[var(--space-12)] pr-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="goal-deadline"
                      className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                    >
                      Deadline
                    </label>
                    <input
                      id="goal-deadline"
                      type="date"
                      value={form.deadline}
                      onChange={(event) => updateField("deadline", event.target.value)}
                      disabled={isLoading}
                      required
                      className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-3)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="goal-category"
                      className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                    >
                      Category
                    </label>
                    <input
                      id="goal-category"
                      type="text"
                      value={form.category}
                      onChange={(event) => updateField("category", event.target.value)}
                      disabled={isLoading}
                      required
                      className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="goal-description"
                    className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]"
                  >
                    Description
                  </label>
                  <textarea
                    id="goal-description"
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    disabled={isLoading}
                    rows={4}
                    className="min-h-[var(--space-24)] w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-body)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] active:border-[var(--color-accent-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-danger-900)]"
                  >
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--color-border-subtle)] px-[var(--space-6)] py-[var(--space-4)] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className={cn(actionButtonVariants({ variant: "secondary" }))}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className={cn(actionButtonVariants({ variant: "primary" }))}
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
                {isLoading ? "Saving goal…" : "Save changes"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}