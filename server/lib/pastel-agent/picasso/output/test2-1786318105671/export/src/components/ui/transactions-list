// TransactionsList.tsx — Grouped transaction history for reviewing spending and income. Use on Wavelength dashboard and budget activity views.
import { useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const transactionsListVariants = cva(
  "w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)]"
);

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  description: string;
}

export interface TransactionsListProps {
  transactions: Transaction[];
  currency: string;
  isLoading?: boolean;
  error?: string;
  onTransactionClick?: (transactionId: string) => void;
  onEdit?: (transactionId: string) => void;
  onDelete?: (transactionId: string) => void;
}

function getDateGroup(dateValue: string): string {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfYesterday = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday && date < startOfToday) return "Yesterday";

  const startOfWeek = new Date(startOfToday);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));

  if (date >= startOfWeek) return "This week";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTransactionDate(dateValue: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function formatAmount(amount: number, currency: string, type: Transaction["type"]) {
  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(Math.abs(amount));

  return `${type === "income" ? "+" : "-"}${formattedAmount}`;
}

export default function TransactionsList({
  transactions,
  currency,
  isLoading = false,
  error,
  onTransactionClick,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    transactions.forEach((transaction) => {
      const group = getDateGroup(transaction.date);
      const currentGroup = groups.get(group) ?? [];
      groups.set(group, [...currentGroup, transaction]);
    });

    return Array.from(groups.entries());
  }, [transactions]);

  if (isLoading) {
    return (
      <section
        className={cn(transactionsListVariants())}
        aria-busy="true"
        aria-label="Loading transactions"
      >
        <div className="flex items-center gap-[var(--space-3)] border-b border-[var(--color-border-subtle)] px-[var(--space-4)] py-[var(--space-4)]">
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
          <span className="text-sm text-[var(--color-text-secondary)]">
            Loading transactions
          </span>
        </div>

        <div className="divide-y divide-[var(--color-border-subtle)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)]"
              aria-hidden="true"
            >
              <div className="h-[var(--space-8)] w-[var(--space-8)] rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]" />
              <div className="flex-1 space-y-[var(--space-2)]">
                <div className="h-[var(--space-3)] w-2/5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-100)]" />
                <div className="h-[var(--space-3)] w-1/3 rounded-[var(--radius-sm)] bg-[var(--color-neutral-100)]" />
              </div>
              <div className="h-[var(--space-3)] w-1/5 rounded-[var(--radius-sm)] bg-[var(--color-neutral-100)]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={cn(transactionsListVariants())}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-[var(--space-3)] bg-[var(--color-danger-50)] px-[var(--space-4)] py-[var(--space-4)]">
          <span
            className="flex h-[var(--space-6)] w-[var(--space-6)] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-danger-500)] font-[var(--font-display)] text-sm font-[var(--weight-semibold)] text-[var(--color-text-inverse)]"
            aria-hidden="true"
          >
            !
          </span>
          <div>
            <p className="font-[var(--weight-semibold)] text-[var(--color-danger-900)]">
              Transactions could not load
            </p>
            <p className="mt-[var(--space-1)] text-sm text-[var(--color-danger-900)]">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (transactions.length === 0) {
    return (
      <section
        className={cn(transactionsListVariants())}
        aria-label="Transactions"
      >
        <div className="px-[var(--space-6)] py-[var(--space-8)]">
          <p className="font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)]">
            No transactions yet
          </p>
          <p className="mt-[var(--space-2)] max-w-[32rem] text-base text-[var(--color-text-secondary)]">
            Your spending and income will show up here as you track them.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(transactionsListVariants())}
      aria-label="Transactions"
      aria-busy="false"
    >
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {groupedTransactions.map(([group, groupTransactions]) => (
          <div key={group}>
            <h2 className="border-b border-[var(--color-border-subtle)] bg-[var(--color-neutral-50)] px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-display)] text-sm font-[var(--weight-semibold)] text-[var(--color-text-secondary)]">
              {group}
            </h2>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {groupTransactions.map((transaction) => {
                const isIncome = transaction.type === "income";

                return (
                  <div
                    key={transaction.id}
                    className="group relative flex items-center gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-50)]"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-[var(--space-3)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:translate-y-[var(--space-1)] disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => onTransactionClick?.(transaction.id)}
                      disabled={!onTransactionClick}
                      aria-label={`View ${transaction.merchant} transaction`}
                    >
                      <span
                        className="flex h-[var(--space-8)] w-[var(--space-8)] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-50)] font-[var(--font-display)] text-sm font-[var(--weight-semibold)] text-[var(--color-accent-900)]"
                        title={transaction.category}
                        aria-hidden="true"
                      >
                        {transaction.category.slice(0, 1).toUpperCase()}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-[var(--weight-medium)]">
                          {transaction.merchant}
                        </span>
                        <span className="mt-[var(--space-1)] block truncate text-sm text-[var(--color-text-muted)]">
                          {transaction.category} · {formatTransactionDate(transaction.date)}
                        </span>
                        <span className="sr-only">{transaction.description}</span>
                      </span>
                    </button>

                    <span
                      className={cn(
                        "shrink-0 font-[var(--font-mono)] text-base font-[var(--weight-semibold)] tabular-nums",
                        isIncome
                          ? "text-[var(--color-success-500)]"
                          : "text-[var(--color-danger-500)]"
                      )}
                    >
                      {formatAmount(transaction.amount, currency, transaction.type)}
                    </span>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        className="flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:bg-[var(--color-neutral-200)] disabled:pointer-events-none disabled:opacity-50"
                        onClick={() =>
                          setOpenMenuId((currentId) =>
                            currentId === transaction.id ? null : transaction.id
                          )
                        }
                        aria-label={`More actions for ${transaction.merchant}`}
                        aria-expanded={openMenuId === transaction.id}
                        disabled={!onEdit && !onDelete}
                      >
                        <span aria-hidden="true" className="text-lg leading-none">
                          ···
                        </span>
                      </button>

                      {openMenuId === transaction.id && (
                        <div className="absolute right-0 top-[calc(100%+var(--space-2))] z-10 min-w-[8rem] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-1)] shadow-[var(--shadow-sm)]">
                          {onEdit && (
                            <button
                              type="button"
                              className="flex h-[var(--control-sm)] w-full items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-left text-sm text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:bg-[var(--color-neutral-200)] disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => {
                                onEdit(transaction.id);
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="flex h-[var(--control-sm)] w-full items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-left text-sm text-[var(--color-danger-500)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-danger-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:bg-[var(--color-danger-50)] disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => {
                                onDelete(transaction.id);
                                setOpenMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}