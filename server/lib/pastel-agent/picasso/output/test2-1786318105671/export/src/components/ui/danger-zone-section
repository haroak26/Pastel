// DangerZoneSection.tsx — Provides Wavelength account exit and deletion actions with a clear confirmation step.
import { useState, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const dangerZoneActionVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-[var(--font-body)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        neutral:
          "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
        danger:
          "bg-[var(--color-danger-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-danger-900)] active:bg-[var(--color-danger-900)]",
      },
      size: {
        md: "h-[var(--control-md)] px-[var(--space-4)] text-base",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
);

interface DangerZoneActionProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dangerZoneActionVariants> {
  loading?: boolean;
}

function DangerZoneAction({
  className,
  tone,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: DangerZoneActionProps) {
  return (
    <button
      className={cn(
        dangerZoneActionVariants({ tone, size }),
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
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
      {children}
    </button>
  );
}

export interface DangerZoneSectionProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function DangerZoneSection({
  onLogout,
  onDeleteAccount,
}: DangerZoneSectionProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDeleteAccount() {
    setIsDeleting(true);
    onDeleteAccount();
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  }

  return (
    <section
      aria-labelledby="danger-zone-heading"
      className="rounded-[var(--radius-lg)] border border-[var(--color-danger-500)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)]"
    >
      <div className="border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
        <p className="mb-[var(--space-2)] font-[var(--font-mono)] text-sm font-[var(--weight-medium)] text-[var(--color-danger-500)]">
          Account controls
        </p>
        <h2
          id="danger-zone-heading"
          className="font-[var(--font-display)] text-xl font-[var(--weight-semibold)] text-[var(--color-text-primary)]"
        >
          Leave Wavelength
        </h2>
        <p className="mt-[var(--space-2)] text-base text-[var(--color-text-secondary)]">
          Sign out for now, or permanently remove your budget history, goals,
          and streak progress.
        </p>
      </div>

      <div className="flex flex-col gap-[var(--space-4)] pt-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-[var(--font-display)] text-base font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
            Sign out
          </h3>
          <p className="mt-[var(--space-1)] text-base text-[var(--color-text-secondary)]">
            End this session on the current device.
          </p>
        </div>
        <DangerZoneAction type="button" onClick={onLogout}>
          Sign out
        </DangerZoneAction>
      </div>

      <div className="mt-[var(--space-4)] flex flex-col gap-[var(--space-4)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-[var(--font-display)] text-base font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
            Delete account
          </h3>
          <p className="mt-[var(--space-1)] text-base text-[var(--color-text-secondary)]">
            Permanently erase your Wavelength data. This cannot be undone.
          </p>
        </div>
        <DangerZoneAction
          type="button"
          tone="danger"
          onClick={() => setIsDeleteDialogOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isDeleteDialogOpen}
        >
          Delete account
        </DangerZoneAction>
      </div>

      {isDeleteDialogOpen && (
        <dialog
          open
          aria-labelledby="delete-account-dialog-heading"
          aria-describedby="delete-account-dialog-description"
          className="mt-[var(--space-6)] w-full rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-md)]"
        >
          <h3
            id="delete-account-dialog-heading"
            className="font-[var(--font-display)] text-xl font-[var(--weight-semibold)]"
          >
            Delete your Wavelength account?
          </h3>
          <p
            id="delete-account-dialog-description"
            className="mt-[var(--space-3)] text-base text-[var(--color-text-secondary)]"
          >
            Your budgets, spending breakdowns, savings goals, and streak
            rewards will be erased permanently.
          </p>

          <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] sm:flex-row sm:justify-end">
            <DangerZoneAction
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              aria-label="Cancel account deletion"
            >
              Keep my account
            </DangerZoneAction>
            <DangerZoneAction
              type="button"
              tone="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              aria-label="Confirm permanent account deletion"
            >
              Permanently delete
            </DangerZoneAction>
          </div>
        </dialog>
      )}
    </section>
  );
}