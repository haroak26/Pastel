// InsightsTab.tsx — Navigation tab to insights with icon and label. Use in tab bars for switching between insights views.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const insightsTabVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] font-[var(--weight-medium)] text-sm transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      active: {
        true: "bg-[var(--color-accent-100)] text-[var(--color-accent-900)]",
        false: "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface InsightsTabProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof insightsTabVariants> {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export default function InsightsTab({
  className,
  icon,
  label,
  href,
  active = false,
  ...props
}: InsightsTabProps) {
  return (
    <a
      href={href}
      className={cn(insightsTabVariants({ active }), className)}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      {icon}
      {label}
    </a>
  );
}