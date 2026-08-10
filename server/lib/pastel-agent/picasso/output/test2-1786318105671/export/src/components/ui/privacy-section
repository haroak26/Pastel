// PrivacySection.tsx — Provides Wavelength privacy resources and a user-controlled data export action.
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const privacySectionVariants = cva(
  "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)]"
);

export interface PrivacySectionProps {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  onExportData?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function PrivacySection({
  privacyPolicyUrl,
  termsOfServiceUrl,
  onExportData,
  loading = false,
  disabled = false,
  className,
}: PrivacySectionProps) {
  const exportDisabled = disabled || loading || !onExportData;

  return (
    <section
      className={cn(privacySectionVariants(), className)}
      aria-label="Privacy and data controls"
    >
      <div className="border-b border-[var(--color-border-subtle)] p-[var(--space-6)]">
        <h2 className="font-[var(--font-display)] text-lg font-[var(--weight-semibold)]">
          Your data, your call
        </h2>
        <p className="mt-[var(--space-2)] max-w-2xl text-base text-[var(--color-text-secondary)]">
          Review how Wavelength handles your money data or take a copy of your
          information with you.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-3)] p-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="flex flex-wrap items-center gap-[var(--space-2)]"
          aria-label="Legal resources"
        >
          <a
            href={privacyPolicyUrl}
            className="inline-flex min-h-[var(--control-sm)] items-center rounded-[var(--radius-sm)] px-[var(--space-2)] text-base font-[var(--weight-medium)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-accent-600)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
          >
            Privacy policy
          </a>
          <a
            href={termsOfServiceUrl}
            className="inline-flex min-h-[var(--control-sm)] items-center rounded-[var(--radius-sm)] px-[var(--space-2)] text-base font-[var(--weight-medium)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-accent-600)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
          >
            Terms of service
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex h-[var(--control-md)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-[var(--space-4)] text-base font-[var(--weight-medium)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={onExportData}
          disabled={exportDisabled}
          aria-busy={loading}
          aria-label="Export Wavelength data"
        >
          {loading && (
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
              style={{ animationDuration: "var(--duration-slow)" }}
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
          Export my data
        </button>
      </div>
    </section>
  );
}