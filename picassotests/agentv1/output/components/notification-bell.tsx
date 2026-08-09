// NotificationBell.tsx — Icon button with unread notification count badge. Use in headers/navbars to trigger notification panel or drawer.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const notificationBellVariants = cva(
  "relative inline-flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-[var(--control-sm)] w-[var(--control-sm)]",
        md: "h-[var(--control-md)] w-[var(--control-md)]",
        lg: "h-[var(--control-lg)] w-[var(--control-lg)]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const badgeVariants = cva(
  "absolute inline-flex items-center justify-center min-w-5 h-5 rounded-[var(--radius-full)] text-xs font-[var(--weight-bold)] bg-[var(--color-danger-500)] text-[var(--color-text-inverse)]",
  {
    variants: {
      position: {
        "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      },
    },
    defaultVariants: {
      position: "top-right",
    },
  }
);

export interface NotificationBellProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof notificationBellVariants> {
  unreadCount?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

export default function NotificationBell({
  className,
  size = "md",
  unreadCount,
  onClick,
  ariaLabel = "Notifications",
  disabled,
  ...props
}: NotificationBellProps) {
  const showBadge = unreadCount && unreadCount > 0;

  return (
    <button
      className={cn(notificationBellVariants({ size }), className)}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      type="button"
      {...props}
    >
      <svg
        className="h-5 w-5 text-[var(--color-text-primary)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {showBadge && (
        <span className={cn(badgeVariants({ position: "top-right" }))}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}