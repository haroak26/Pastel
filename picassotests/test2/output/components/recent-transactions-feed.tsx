// RecentTransactionsFeed.tsx — Shows Wavelength’s latest money activity with running balances and a path to the full history.
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const feedVariants = cva(
  "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)]",
  {
    variants: {},
  }
);

const transactionRowVariants = cva(
  "flex min-h-[var(--control-lg)] w-full items-center gap-[var(--space-3)] border-b border-[var(--color-border-subtle)] py-[var(--space-3)] text-left transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] last:border-b-0",
  {
    variants: {
      interactive: {
        true:
          "cursor-pointer hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      interactive: false,
    },
  }
);

export interface RecentTransaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  balance: number;
}

export interface RecentTransactionsFeedProps
  extends React.HTMLAttributes<HTMLElement> {
  transactions: RecentTransaction[];
  currency: string;
  isLoading?: boolean;
  error?: string;
  onTransactionClick?: (transactionId: string) => void;
  onViewAll?: () => void;
}

function CategoryIcon({ category }: { category: string }) {
  return (
    <span
      className="flex h-[var(--control-md)] w-[var(--control-md)] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-50)] font-[var(--font-display)] text-[var(--color-accent-900)]"
      aria-label={category}
      title={category}
    >
      <span aria-hidden="true" className="text-[var(--text-sm)] font-[var(--weight-semibold)]">
        {category.trim().slice(0, 1).toUpperCase()}
      </span>
    </span>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
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
  );
}

export default function RecentTransactionsFeed({
  transactions,
  currency,
  isLoading = false,
  error,
  onTransactionClick,
  onViewAll,
  className,
  ...props
}: RecentTransactionsFeedProps) {
  const amountFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
      }),
    [currency]
  );

  const formatAmount = (amount: number, type: RecentTransaction["type"]) =>
    `${type === "income" ? "+" : "-"}${amountFormatter.format(Math.abs(amount))}`;

  const content = isLoading ? (
    <div
      className="flex min-h-[var(--control-lg)] items-center justify-center gap-[var(--space-2)] py-[var(--space-8)] text-[var(--color-text-secondary)]"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner />
      <span className="text-[var(--text-base)]">Loading recent transactions</span>
    </div>
  ) : error ? (
    <div
      className="border-b border-[var(--color-border-subtle)] px-[var(--space-4)] py-[var(--space-6)] text-[var(--color-danger-900)]"
      role="alert"
    >
      <p className="text-[var(--text-base)]">{error}</p>
    </div>
  ) : transactions.length === 0 ? (
    <div className="border-b border-[var(--color-border-subtle)] px-[var(--space-4)] py-[var(--space-6)] text-[var(--color-text-secondary)]">
      <p className="text-[var(--text-base)]">No recent transactions</p>
    </div>
  ) : (
    <div className="px-[var(--space-4)]" role="list" aria-label="Recent transactions">
      {transactions.map((transaction) => {
        const rowClassName = cn(
          transactionRowVariants({
            interactive: Boolean(onTransactionClick),
          })
        );

        const rowContent = (
          <>
            <CategoryIcon category={transaction.category} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[var(--text-base)] font-[var(--weight-medium)]">
                {transaction.merchant}
              </span>
              <span className="mt-[var(--space-1)] block truncate text-[var(--text-sm)] text-[var(--color-text-muted)]">
                {transaction.category} · {transaction.date}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span
                className={cn(
                  "block font-[var(--font-mono)] text-[var(--text-base)] font-[var(--weight-semibold)] tabular-nums",
                  transaction.type === "income"
                    ? "text-[var(--color-success-500)]"
                    : "text-[var(--color-text-primary)]"
                )}
              >
                {formatAmount(transaction.amount, transaction.type)}
              </span>
              <span className="mt-[var(--space-1)] block text-[var(--text-sm)] text-[var(--color-text-muted)]">
                {amountFormatter.format(transaction.balance)}
              </span>
            </span>
          </>
        );

        return onTransactionClick ? (
          <button
            key={transaction.id}
            type="button"
            className={rowClassName}
            onClick={() => onTransactionClick(transaction.id)}
            aria-label={`${transaction.merchant}, ${formatAmount(
              transaction.amount,
              transaction.type
            )}, balance ${amountFormatter.format(transaction.balance)}`}
          >
            {rowContent}
          </button>
        ) : (
          <div key={transaction.id} className={rowClassName} role="listitem">
            {rowContent}
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      className={cn(feedVariants(), className)}
      aria-busy={isLoading}
      {...props}
    >
      <div className="flex items-center justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] px-[var(--space-4)] py-[var(--space-4)]">
        <div>
          <h2 className="font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)]">
            Recent transactions
          </h2>
          <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Your latest money moves
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            className="min-h-[var(--control-sm)] shrink-0 rounded-[var(--radius-sm)] px-[var(--space-2)] text-[var(--text-sm)] font-[var(--weight-semibold)] text-[var(--color-accent-600)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-accent-50)] active:bg-[var(--color-accent-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            onClick={onViewAll}
            disabled={isLoading}
          >
            View all
          </button>
        )}
      </div>
      {content}
    </section>
  );
}