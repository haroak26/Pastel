// WelcomeHero.tsx — Brand-led introduction with a focused Wavelength CTA. Use at the entry point of the budgeting experience.
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const welcomeHeroVariants = cva(
  "w-full rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-12)] shadow-[var(--shadow-sm)]"
);

const welcomeCtaVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-accent-500)] px-[var(--space-6)] font-[var(--font-body)] text-[var(--weight-medium)] text-[var(--color-text-inverse)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
);

export interface WelcomeHeroProps
  extends React.HTMLAttributes<HTMLElement> {
  logoSrc: string;
  headline: string;
  subheading: string;
  ctaLabel: string;
  onCTA: () => void;
  loading?: boolean;
}

export default function WelcomeHero({
  logoSrc,
  headline,
  subheading,
  ctaLabel,
  onCTA,
  loading = false,
  className,
  ...props
}: WelcomeHeroProps) {
  return (
    <section
      className={cn(welcomeHeroVariants(), className)}
      aria-labelledby="welcome-hero-headline"
      {...props}
    >
      <div className="flex max-w-full flex-col items-start gap-[var(--space-8)]">
        <img
          src={logoSrc}
          alt="Wavelength"
          className="h-[var(--space-8)] w-auto object-contain"
        />

        <div className="flex max-w-full flex-col items-start gap-[var(--space-3)]">
          <h1
            id="welcome-hero-headline"
            className="font-[var(--font-display)] text-[var(--text-5xl)] font-[var(--weight-bold)] tracking-[-0.02em] text-[var(--color-text-primary)]"
          >
            {headline}
          </h1>
          <p className="max-w-full font-[var(--font-body)] text-[var(--text-lg)] font-[var(--weight-regular)] text-[var(--color-text-secondary)]">
            {subheading}
          </p>
        </div>

        <button
          type="button"
          className={cn(
            welcomeCtaVariants(),
            "h-[var(--control-lg)]"
          )}
          onClick={onCTA}
          disabled={loading}
          aria-busy={loading}
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
      </div>
    </section>
  );
}