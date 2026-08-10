// CompletionHero.tsx — Celebrates onboarding completion and gives users a clear path into their Wavelength dashboard.
import type { ButtonHTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const completionHeroVariants = cva(
  "mx-auto flex w-full max-w-2xl flex-col items-start gap-[var(--space-8)] rounded-[var(--radius-xl)] bg-[var(--color-surface-raised)] p-[var(--space-8)] text-left shadow-[var(--shadow-sm)] sm:p-[var(--space-12)]"
);

const completionButtonVariants = cva(
  "inline-flex h-[var(--control-lg)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-accent-500)] px-[var(--space-6)] font-[var(--font-body)] text-base font-[var(--weight-medium)] text-[var(--color-text-inverse)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
);

export interface CompletionHeroProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  headline: string;
  subheading: string;
  ctaLabel: string;
  onCTA: () => void;
  loading?: boolean;
}

export default function CompletionHero({
  headline,
  subheading,
  ctaLabel,
  onCTA,
  loading = false,
  disabled,
  className,
  ...buttonProps
}: CompletionHeroProps) {
  return (
    <section
      className={cn(completionHeroVariants(), className)}
      aria-labelledby="completion-hero-headline"
    >
      <div
        className="flex h-[var(--control-lg)] w-[var(--control-lg)] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-50)]"
        aria-hidden="true"
      >
        <svg
          className="h-[var(--space-6)] w-[var(--space-6)] text-[var(--color-accent-500)]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12.5L9.5 17L19 7.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex max-w-xl flex-col gap-[var(--space-3)]">
        <h1
          id="completion-hero-headline"
          className="font-[var(--font-display)] text-3xl font-[var(--weight-semibold)] leading-tight text-[var(--color-text-primary)] sm:text-4xl"
        >
          {headline}
        </h1>
        <p className="font-[var(--font-body)] text-base font-[var(--weight-regular)] leading-6 text-[var(--color-text-secondary)]">
          {subheading}
        </p>
      </div>

      <button
        type="button"
        className={completionButtonVariants()}
        onClick={onCTA}
        disabled={disabled || loading}
        aria-busy={loading}
        {...buttonProps}
      >
        {loading && (
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
        {ctaLabel}
      </button>
    </section>
  );
}