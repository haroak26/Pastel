// ProgressIndicator.tsx — Shows onboarding progress across dots, bars, or numbered steps. Use to orient users within a multi-step flow.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const progressIndicatorVariants = cva(
  "flex w-full items-center font-[var(--font-body)]",
  {
    variants: {
      style: {
        dots: "gap-[var(--space-2)]",
        bars: "gap-[var(--space-2)]",
        numbered: "gap-[var(--space-2)]",
      },
    },
    defaultVariants: {
      style: "dots",
    },
  }
);

export interface ProgressIndicatorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
    VariantProps<typeof progressIndicatorVariants> {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({
  className,
  style: indicatorStyle = "dots",
  currentStep,
  totalSteps,
  ...props
}: ProgressIndicatorProps) {
  const safeTotalSteps = Math.max(1, totalSteps);
  const safeCurrentStep = Math.min(
    Math.max(1, currentStep),
    safeTotalSteps
  );

  return (
    <div
      {...props}
      className={cn(
        progressIndicatorVariants({ style: indicatorStyle }),
        className
      )}
      role="progressbar"
      aria-label={`Step ${safeCurrentStep} of ${safeTotalSteps}`}
      aria-valuemin={1}
      aria-valuemax={safeTotalSteps}
      aria-valuenow={safeCurrentStep}
    >
      {Array.from({ length: safeTotalSteps }, (_, index) => {
        const step = index + 1;
        const isCompleted = step < safeCurrentStep;
        const isCurrent = step === safeCurrentStep;

        if (indicatorStyle === "bars") {
          return (
            <span
              key={step}
              className={cn(
                "h-[var(--space-2)] min-w-0 flex-1 rounded-[var(--radius-full)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
                isCompleted &&
                  "bg-[var(--color-success-500)]",
                isCurrent &&
                  "bg-[var(--color-accent-500)]",
                !isCompleted &&
                  !isCurrent &&
                  "bg-[var(--color-neutral-200)]"
              )}
              aria-hidden="true"
            />
          );
        }

        if (indicatorStyle === "numbered") {
          return (
            <span
              key={step}
              className={cn(
                "inline-flex h-[var(--control-sm)] min-w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-full)] border font-[var(--weight-semibold)] tabular-nums transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
                isCompleted &&
                  "border-[var(--color-success-500)] bg-[var(--color-success-500)] text-[var(--color-text-inverse)]",
                isCurrent &&
                  "border-[var(--color-accent-500)] bg-[var(--color-accent-500)] text-[var(--color-text-inverse)]",
                !isCompleted &&
                  !isCurrent &&
                  "border-[var(--color-border-default)] bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]"
              )}
              style={{ font: "var(--text-sm)" }}
              aria-hidden="true"
            >
              {step}
            </span>
          );
        }

        return (
          <span
            key={step}
            className={cn(
              "size-[var(--space-2)] rounded-[var(--radius-full)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
              isCompleted && "bg-[var(--color-success-500)]",
              isCurrent && "bg-[var(--color-accent-500)]",
              !isCompleted &&
                !isCurrent &&
                "border border-[var(--color-border-default)] bg-[var(--color-neutral-100)]"
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}