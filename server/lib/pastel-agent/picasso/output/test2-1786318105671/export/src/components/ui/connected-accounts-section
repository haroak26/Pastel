// ConnectedAccountsSection.tsx — Displays linked bank accounts and payment methods with connection status and account management actions.
import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const connectedAccountsVariants = cva(
  "w-full rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] shadow-[var(--shadow-sm)]",
  {}
);

const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-600)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
      size: {
        sm: "h-[var(--control-sm)] px-[var(--space-3)] text-[var(--text-sm)]",
        md: "h-[var(--control-md)] px-[var(--space-4)] text-[var(--text-base)]",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  }
);

interface AccountActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  loading?: boolean;
}

function AccountActionButton({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: AccountActionButtonProps) {
  return (
    <button
      className={cn(actionButtonVariants({ variant, size }), className)}
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

export interface ConnectedAccount {
  id: string;
  name: string;
  type: string;
  lastFour: string;
  connected: boolean;
}

export interface ConnectedAccountsSectionProps
  extends VariantProps<typeof connectedAccountsVariants> {
  accounts: ConnectedAccount[];
  isLoading?: boolean;
  error?: string;
  onAddAccount?: () => void;
  onDisconnect?: (accountId: string) => void;
}

export default function ConnectedAccountsSection({
  accounts,
  isLoading = false,
  error,
  onAddAccount,
  onDisconnect,
}: ConnectedAccountsSectionProps) {
  return (
    <section
      className={cn(connectedAccountsVariants())}
      aria-busy={isLoading}
      aria-labelledby="connected-accounts-heading"
    >
      <div className="flex flex-col gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] p-[var(--space-6)] sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[var(--space-24)]">
          <p className="mb-[var(--space-2)] font-[var(--font-mono)] text-[var(--text-xs)] font-[var(--weight-medium)] tracking-[var(--space-1)] text-[var(--color-accent-600)]">
            MONEY SOURCES
          </p>
          <h2
            id="connected-accounts-heading"
            className="font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]"
          >
            Connected accounts
          </h2>
          <p className="mt-[var(--space-2)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
            Keep your balances and spending streaks in sync.
          </p>
        </div>

        <AccountActionButton
          type="button"
          variant="primary"
          size="md"
          onClick={onAddAccount}
          disabled={!onAddAccount || isLoading}
        >
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Account
        </AccountActionButton>
      </div>

      {error && (
        <div
          className="border-b border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-6)] py-[var(--space-4)] text-[var(--text-base)] text-[var(--color-danger-900)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div
          className="flex items-center gap-[var(--space-3)] p-[var(--space-6)] text-[var(--text-base)] text-[var(--color-text-secondary)]"
          role="status"
        >
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
          Updating your money sources
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-[var(--space-6)]">
          <p className="font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
            No accounts connected yet
          </p>
          <p className="mt-[var(--space-2)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
            Add a bank account or payment method to start tracking your spending.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border-subtle)]">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex flex-col gap-[var(--space-4)] p-[var(--space-6)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-[var(--space-3)]">
                  <h3 className="truncate font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
                    {account.name}
                  </h3>
                  <span
                    className={cn(
                      "rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-1)] text-[var(--text-xs)] font-[var(--weight-medium)]",
                      account.connected
                        ? "bg-[var(--color-success-50)] text-[var(--color-success-900)]"
                        : "bg-[var(--color-warning-50)] text-[var(--color-warning-900)]"
                    )}
                  >
                    {account.connected ? "Connected" : "Needs attention"}
                  </span>
                </div>
                <p className="mt-[var(--space-1)] text-[var(--text-base)] text-[var(--color-text-secondary)]">
                  {account.type} ·•••• {account.lastFour}
                </p>
              </div>

              <AccountActionButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDisconnect?.(account.id)}
                disabled={!account.connected || !onDisconnect}
                aria-label={`Disconnect ${account.name}`}
                className="self-start sm:self-auto"
              >
                Disconnect
              </AccountActionButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}