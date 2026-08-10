// StreakBanner.tsx — Displays a user’s current on-budget streak and the next reward milestone. Use on dashboard spending summaries and goals views.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const streakBannerVariants = cva(
  "relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:border-[var(--color-border-default)]",
  {
    variants: {
      size: {
        sm: "p-[var(--space-4)]",
        md: "p-[var(--space-6)]",
        lg: "p-[var(--space-8)]",
      },
      emphasis: {
        default: "border-l-[var(--space-1)] border-l-[var(--color-accent-500)]",
        milestone:
          "border-l-[var(--space-1)] border-l-[var(--color-success-500)] bg-[var(--color-success-50)]",
      },
    },
    defaultVariants: {
      size: "md",
      emphasis: "default",
    },
  }
);

export interface StreakBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakBannerVariants> {
  currentStreak: number;
  nextMilestone: number;
  daysUntilMilestone: number;
  isLoading?: boolean;
}

export default function StreakBanner({
  className,
  size,
  emphasis,
  currentStreak,
  nextMilestone,
  daysUntilMilestone,
  isLoading = false,
  ...props
}: StreakBannerProps) {
  const isLarge = size === "lg";
  const dayLabel = daysUntilMilestone === 1 ? "day" : "days";

  return (
    <div
      className={cn(
        streakBannerVariants({ size, emphasis }),
        isLoading && "opacity-75",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
      {...props}
    >
      <div className="flex items-start justify-between gap-[var(--space-4)]">
        <div className="min-w-0">
          <div className="mb-[var(--space-3)] flex items-center gap-[var(--space-2)]">
            <svg
              className="h-[var(--space-6)] w-[var(--space-6)] shrink-0 text-[var(--color-accent-500)]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M13.4 2.2c.3 3.1-.8 5-2.1 6.3-1-1.1-1.2-2.5-1-3.8-3.2 2.1-5.1 5-5.1 8.4 0 4.8 3.8 8.7 8.8 8.7s8.8-3.9 8.8-8.7c0-3.2-1.7-6.5-5.4-9.2.1 2.1-.4 3.6-1.4 4.8-.1-2.1-1.1-4.4-2.6-6.5Zm.6 16.8c-1.9 0-3.4-1.5-3.4-3.4 0-1.1.5-2.1 1.5-3 .2 1 .8 1.7 1.4 2.2.7-.8 1-1.7.9-2.8 1.7 1.1 2.5 2.3 2.5 3.7 0 1.8-1.3 3.3-2.9 3.3Z" />
            </svg>
            <span className="text-[var(--text-sm)] font-[var(--weight-semibold)] text-[var(--color-text-secondary)]">
              Spending streak
            </span>
          </div>

          {isLoading ? (
            <div
              className="flex h-[var(--control-lg)] items-center"
              aria-label="Loading spending streak"
            >
              <svg
                className="h-[var(--space-6)] w-[var(--space-6)] animate-[spin_var(--duration-slow)_linear_infinite] text-[var(--color-text-muted)]"
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
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8V1C5.9 1 1 5.9 1 12h3Z"
                />
              </svg>
            </div>
          ) : (
            <p
              className={cn(
                "font-[var(--font-display)] font-[var(--weight-bold)] tabular-nums leading-none",
                isLarge
                  ? "text-[var(--text-4xl)]"
                  : size === "sm"
                    ? "text-[var(--text-2xl)]"
                    : "text-[var(--text-3xl)]"
              )}
            >
              {currentStreak}{" "}
              <span className="font-[var(--font-body)] text-[var(--text-lg)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                {currentStreak === 1 ? "day" : "days"} on budget
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] px-[var(--space-3)] py-[var(--space-2)] text-right">
          <p className="text-[var(--text-xs)] font-[var(--weight-semibold)] text-[var(--color-text-muted)]">
            Next milestone
          </p>
          <p className="mt-[var(--space-1)] font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] tabular-nums">
            {nextMilestone} days
          </p>
        </div>
      </div>

      <div className="mt-[var(--space-6)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]">
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          {isLoading ? (
            "Updating your streak"
          ) : (
            <>
              Keep going — {daysUntilMilestone} {dayLabel} until your next streak reward.
            </>
          )}
        </p>
      </div>
    </div>
  );
}