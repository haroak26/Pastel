// OnboardingHeader.tsx — Introduces each budgeting setup step with progress context, a clear headline, and supporting guidance.
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const onboardingHeaderVariants = cva(
  "flex w-full flex-col gap-[var(--space-6)] rounded-[var(--radius-xl)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)]",
  {
    variants: {},
  }
);

export interface OnboardingHeaderProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof onboardingHeaderVariants> {
  currentStep: number;
  totalSteps: number;
  headline: string;
  subheading: string;
  loading?: boolean;
}

export default function OnboardingHeader({
  className,
  currentStep,
  totalSteps,
  headline,
  subheading,
  loading = false,
  ...props
}: OnboardingHeaderProps) {
  const progress = totalSteps > 0
    ? Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100)
    : 0;

  return (
    <header
      className={cn(onboardingHeaderVariants(), className)}
      aria-busy={loading}
      {...props}
    >
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <span className="font-[var(--font-mono)] text-[var(--text-sm)] font-[var(--weight-medium)] tabular-nums text-[var(--color-text-secondary)]">
          Step {currentStep} of {totalSteps}
        </span>

        {loading && (
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
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
      </div>

      <div
        className="h-[var(--space-2)] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-neutral-100)]"
        role="progressbar"
        aria-label={`Onboarding progress: step ${currentStep} of ${totalSteps}`}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
      >
        <div
          className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent-500)] transition-[width] duration-[var(--duration-slow)] ease-[var(--easing-standard)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex max-w-[var(--space-24)] flex-col gap-[var(--space-2)]">
        <h1 className="font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--weight-bold)] leading-[1.2] tracking-[-0.02em] text-[var(--color-text-primary)]">
          {headline}
        </h1>
        <p className="font-[var(--font-body)] text-[var(--text-base)] font-[var(--weight-regular)] leading-[1.5] text-[var(--color-text-secondary)]">
          {subheading}
        </p>
      </div>
    </header>
  );
}