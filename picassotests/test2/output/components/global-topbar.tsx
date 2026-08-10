// GlobalTopbar.tsx — Fixed app navigation for Wavelength screens, keeping identity, notifications, and account access visible.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, LoaderCircle } from "lucide-react";
import { cn } from "../lib/cn";

const topbarVariants = cva(
  "flex h-[var(--space-16)] w-full items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-[var(--space-4)] font-[var(--font-body)] shadow-[var(--shadow-sm)]"
);

export interface GlobalTopbarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof topbarVariants> {
  logoSrc: string;
  appTitle: string;
  notificationCount?: number;
  userAvatar: string;
  userName: string;
  onNotificationClick?: () => void;
  onAvatarMenuOpen?: () => void;
  loading?: boolean;
}

export default function GlobalTopbar({
  className,
  logoSrc,
  appTitle,
  notificationCount,
  userAvatar,
  userName,
  onNotificationClick,
  onAvatarMenuOpen,
  loading = false,
  ...props
}: GlobalTopbarProps) {
  const handleAvatarMenuChange = (open: boolean) => {
    if (open) {
      onAvatarMenuOpen?.();
    }
  };

  return (
    <header
      className={cn(topbarVariants(), className)}
      aria-busy={loading}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-[var(--space-3)]">
        <img
          src={logoSrc}
          alt={`${appTitle} logo`}
          className="h-[var(--space-8)] w-[var(--space-8)] rounded-[var(--radius-md)] object-cover"
        />
        <span className="truncate font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
          {appTitle}
        </span>
      </div>

      <div className="flex items-center gap-[var(--space-2)]">
        <button
          type="button"
          className="relative inline-flex h-[var(--control-md)] w-[var(--control-md)] items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={onNotificationClick}
          disabled={loading}
          aria-label={
            notificationCount && notificationCount > 0
              ? `${notificationCount} unread notifications`
              : "Notifications"
          }
          aria-busy={loading}
        >
          {loading ? (
            <LoaderCircle
              className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Bell
              className="h-[var(--space-4)] w-[var(--space-4)]"
              aria-hidden="true"
            />
          )}

          {notificationCount !== undefined && notificationCount > 0 && !loading && (
            <span
              className="absolute right-[-var(--space-1)] top-[-var(--space-1)] inline-flex min-h-[var(--space-4)] min-w-[var(--space-4)] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-500)] px-[var(--space-1)] font-[var(--font-mono)] text-[var(--text-xs)] font-[var(--weight-semibold)] leading-none text-[var(--color-text-inverse)]"
              aria-hidden="true"
            >
              {notificationCount}
            </span>
          )}
        </button>

        <DropdownMenu.Root onOpenChange={handleAvatarMenuChange}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="group inline-flex h-[var(--control-md)] items-center gap-[var(--space-2)] rounded-[var(--radius-full)] pl-[var(--space-1)] pr-[var(--space-2)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={loading}
              aria-label={`Open account menu for ${userName}`}
              aria-busy={loading}
            >
              <img
                src={userAvatar}
                alt={userName}
                className="h-[var(--control-sm)] w-[var(--control-sm)] rounded-[var(--radius-full)] object-cover"
              />
              <ChevronDown
                className="h-[var(--space-4)] w-[var(--space-4)] text-[var(--color-text-muted)] transition-transform duration-[var(--duration-fast)] group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[var(--space-24)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-2)] font-[var(--font-body)] shadow-[var(--shadow-md)]"
            >
              <DropdownMenu.Label className="px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                {userName}
              </DropdownMenu.Label>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}