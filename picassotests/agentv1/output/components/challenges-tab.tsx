// ChallengesTab.tsx — Navigation tab to challenges with icon and label. Use in tab navigation to switch between sections like Challenges, Spending, Goals, etc.
import { cn } from "../lib/cn";

export interface ChallengesTabProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export default function ChallengesTab({
  icon,
  label,
  href,
  active = false,
  className,
  ...props
}: ChallengesTabProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] font-[var(--weight-medium)] text-sm transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
        active
          ? "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center w-5 h-5" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </a>
  );
}