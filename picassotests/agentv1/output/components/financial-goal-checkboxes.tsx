// FinancialGoalCheckboxes.tsx — Select multiple money goals such as saving, spending less, or investing. Use in onboarding and financial planning forms.
import { useId } from "react";
import { cva } from "class-variance-authority";
import * as Checkbox from "@radix-ui/react-checkbox";
import { cn } from "../lib/cn";

const financialGoalCheckboxVariants = cva(
  "group flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-4)] font-[var(--font-body)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-within:ring-2 focus-within:ring-[var(--color-border-focus)] focus-within:ring-offset-2",
  {
    variants: {},
  }
);

export interface FinancialGoalCheckboxesProps {
  goals: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  selectedGoals?: string[];
  onChange?: (selectedIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export default function FinancialGoalCheckboxes({
  goals,
  selectedGoals = [],
  onChange,
  disabled = false,
  className,
}: FinancialGoalCheckboxesProps) {
  const idPrefix = useId();

  const handleChange = (goalId: string, checked: boolean) => {
    if (!onChange) {
      return;
    }

    const nextSelectedGoals = checked
      ? Array.from(new Set([...selectedGoals, goalId]))
      : selectedGoals.filter((selectedId) => selectedId !== goalId);

    onChange(nextSelectedGoals);
  };

  return (
    <fieldset
      className={cn(
        "flex flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] bg-[var(--color-surface-background)]",
        className
      )}
      disabled={disabled}
      aria-label="Financial goals"
    >
      {goals.map((goal) => {
        const checkboxId = `${idPrefix}-${goal.id}`;
        const descriptionId = `${checkboxId}-description`;
        const checked = selectedGoals.includes(goal.id);

        return (
          <label
            key={goal.id}
            htmlFor={checkboxId}
            data-selected={checked}
            className={cn(
              financialGoalCheckboxVariants(),
              checked &&
                "border-[var(--color-accent-500)] bg-[var(--color-accent-50)]",
              disabled &&
                "pointer-events-none opacity-50"
            )}
          >
            <Checkbox.Root
              id={checkboxId}
              checked={checked}
              onCheckedChange={(value) =>
                handleChange(goal.id, value === true)
              }
              disabled={disabled}
              aria-describedby={
                goal.description ? descriptionId : undefined
              }
              className={cn(
                "mt-[var(--space-1)] flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-inverse)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-600)] hover:bg-[var(--color-accent-50)] active:bg-[var(--color-accent-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:border-[var(--color-accent-500)] data-[state=checked]:bg-[var(--color-accent-500)] h-[var(--control-sm)] w-[var(--control-sm)]"
              )}
            >
              <Checkbox.Indicator>
                <svg
                  className="h-[var(--space-4)] w-[var(--space-4)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </Checkbox.Indicator>
            </Checkbox.Root>

            <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
              <span className="font-[var(--font-body)] text-[length:var(--text-base)] font-[var(--weight-semibold)] leading-[24px] text-[var(--color-text-primary)]">
                {goal.label}
              </span>
              {goal.description && (
                <span
                  id={descriptionId}
                  className="font-[var(--font-body)] text-[length:var(--text-sm)] font-[var(--weight-regular)] leading-[20px] text-[var(--color-text-secondary)]"
                >
                  {goal.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}