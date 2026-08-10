// TransactionDetailModal.tsx — Edit a Wavelength transaction’s details, receipt, and actions. Use when reviewing or correcting a recorded purchase.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/cn";

const transactionDetailModalVariants = cva(
  "w-[calc(100%-var(--space-8))] max-w-[var(--space-24)] rounded-[var(--radius-xl)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-xl)] outline-none"
);

export interface TransactionDetail {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  receiptUrl?: string;
}

export interface TransactionDetailModalProps
  extends VariantProps<typeof transactionDetailModalVariants> {
  isOpen: boolean;
  transaction: TransactionDetail;
  currency: string;
  isLoading?: boolean;
  error?: string;
  onSave: (updatedTransaction: TransactionDetail) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  currency,
  isLoading = false,
  error,
  onSave,
  onDelete,
  onCancel,
  className,
}: TransactionDetailModalProps) {
  const [merchant, setMerchant] = React.useState(transaction.merchant);
  const [amount, setAmount] = React.useState(String(transaction.amount));
  const [category, setCategory] = React.useState(transaction.category);
  const [date, setDate] = React.useState(transaction.date);
  const [description, setDescription] = React.useState(transaction.description);
  const [receiptUrl, setReceiptUrl] = React.useState(transaction.receiptUrl);

  React.useEffect(() => {
    setMerchant(transaction.merchant);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setDate(transaction.date);
    setDescription(transaction.description);
    setReceiptUrl(transaction.receiptUrl);
  }, [transaction]);

  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(Number(amount) || 0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      id: transaction.id,
      merchant: merchant.trim(),
      amount: Number(amount),
      category: category.trim(),
      date,
      description: description.trim(),
      ...(receiptUrl ? { receiptUrl } : {}),
    });
  }

  function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setReceiptUrl(URL.createObjectURL(file));
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onCancel();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--color-neutral-950)]/50 transition-opacity duration-[var(--duration-base)] ease-[var(--easing-standard)]" />
        <Dialog.Content
          className={cn(
            transactionDetailModalVariants(),
            "fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-var(--space-8))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-[var(--space-6)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]",
            className
          )}
          aria-describedby={error ? "transaction-detail-error" : undefined}
        >
          <div className="flex items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] pb-[var(--space-4)]">
            <div>
              <Dialog.Title className="font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)] tracking-[-0.02em]">
                Edit transaction
              </Dialog.Title>
              <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                Keep this purchase aligned with your spending plan.
              </p>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isLoading}
                aria-label="Close transaction details"
                className="inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-[var(--space-4)] w-[var(--space-4)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-[var(--space-6)]">
            {error && (
              <div
                id="transaction-detail-error"
                role="alert"
                className="mb-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-sm)] text-[var(--color-danger-900)]"
              >
                {error}
              </div>
            )}

            <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Merchant
                </span>
                <input
                  id="transaction-merchant"
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>

              <label>
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Amount
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-[var(--space-3)] flex items-center font-[var(--font-mono)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
                    {currency}
                  </span>
                  <input
                    id="transaction-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={isLoading}
                    required
                    aria-label={`Amount in ${currency}`}
                    className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] pl-[var(--space-12)] pr-[var(--space-3)] font-[var(--font-mono)] text-[var(--text-base)] tabular-nums text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  />
                </div>
                <span className="mt-[var(--space-1)] block font-[var(--font-mono)] text-[var(--text-xs)] tabular-nums text-[var(--color-text-muted)]">
                  {formattedAmount}
                </span>
              </label>

              <label>
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Category
                </span>
                <input
                  id="transaction-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>

              <label>
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Date
                </span>
                <input
                  id="transaction-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-[var(--control-lg)] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Description
                </span>
                <textarea
                  id="transaction-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={isLoading}
                  rows={3}
                  className="min-h-[var(--space-24)] w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-[var(--space-2)] block text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                  Receipt
                </span>
                <label className="flex min-h-[var(--control-lg)] cursor-pointer items-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-default)] px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] hover:border-[var(--color-accent-500)] hover:bg-[var(--color-accent-50)] active:bg-[var(--color-accent-100)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-border-focus)] focus-within:ring-offset-2">
                  <svg viewBox="0 0 24 24" className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 text-[var(--color-accent-500)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                  </svg>
                  <span>{receiptUrl ? "Replace attached receipt" : "Attach receipt"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptChange}
                    disabled={isLoading}
                    className="sr-only"
                  />
                </label>
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-[var(--space-2)] inline-flex min-h-[var(--control-sm)] items-center rounded-[var(--radius-sm)] text-[var(--text-sm)] text-[var(--color-accent-600)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-accent-900)] active:text-[var(--color-accent-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
                  >
                    View attached receipt
                  </a>
                )}
              </div>
            </div>

            <div className="mt-[var(--space-6)] flex flex-col-reverse gap-[var(--space-3)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="inline-flex h-[var(--control-md)] items-center justify-center rounded-[var(--radius-md)] px-[var(--space-3)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-danger-500)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-900)] active:bg-[var(--color-danger-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Delete transaction
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-[var(--space-3)]">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="h-[var(--control-md)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-[var(--space-4)] text-[var(--text-base)] font-[var(--weight-medium)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="inline-flex h-[var(--control-md)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-accent-500)] px-[var(--space-4)] text-[var(--text-base)] font-[var(--weight-medium)] text-[var(--color-text-inverse)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isLoading && (
                    <svg className="h-[var(--space-4)] w-[var(--space-4)] animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  )}
                  {isLoading ? "Saving transaction" : "Save transaction"}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}