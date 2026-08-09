// TransactionsTab.tsx — Navigation tab to transactions with icon and label. Use in tab navigation groups for switching between account views and transaction lists.
import { cn } from "../lib/cn";

export interface TransactionsTabProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export default function TransactionsTab({
  icon,
  label,
  href,
  active = false,
  className,
  ...props
}: TransactionsTabProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] font-[var(--weight-medium)] text-sm transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
        active
          ? "bg-[var(--color-accent-50)] text-[var(--color-accent-600)] border-b-2 border-[var(--color-accent-500)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <span>{label}</span>
    </a>
  );
}