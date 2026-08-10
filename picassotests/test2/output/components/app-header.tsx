// AppHeader.tsx — Wavelength’s primary app header with branding, notifications, and the current user menu.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/cn";

const appHeaderVariants = cva(
  "flex w-full items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-[var(--space-4)] font-[var(--font-body)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
  {
    variants: {
      layout: {
        desktop: "min-h-[var(--control-lg)] py-[var(--space-2)]",
        mobile: "min-h-[var(--control-lg)] py-[var(--space-2)]",
      },
    },
    defaultVariants: {
      layout: "desktop",
    },
  }
);

export interface AppHeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof appHeaderVariants> {
  logoSrc: string;
  appTitle: string;
  userAvatar: string;
  userName: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onAvatarMenuOpen?: () => void;
  loading?: boolean;
}

export default function AppHeader({
  className,
  layout,
  logoSrc,
  appTitle,
  userAvatar,
  userName,
  notificationCount = 0,
  onNotificationClick,
  onAvatarMenuOpen,
  loading = false,
  ...props
}: AppHeaderProps) {
  const hasNotifications = notificationCount > 0;
  const notificationLabel = hasNotifications
    ? `${notificationCount} unread notifications`
    : "Open notifications";

  return (
    <header
      className={cn(appHeaderVariants({ layout }), className)}
      aria-busy={loading}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-[var(--space-3)]">
        <img
          src={logoSrc}
          alt={`${appTitle} logo`}
          className="h-[var(--control-lg)] w-[var(--control-lg)] shrink-0 rounded-[var(--radius-md)] object-contain"
        />
        <span className="truncate font-[var(--font-display)] text-lg font-[var(--weight-semibold)] text-[var(--color-text-primary)]">
          {appTitle}
        </span>
      </div>

      <div className="flex items-center gap-[var(--space-2)]">
        <button
          type="button"
          className="relative inline-flex h-[var(--control-md)] w-[var(--control-md)] items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          onClick={onNotificationClick}
          disabled={loading}
          aria-label={notificationLabel}
          aria-busy={loading}
        >
          {loading ? (
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="2"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          )}

          {hasNotifications && !loading && (
            <span
              className="absolute right-0 top-0 flex min-h-[var(--space-3)] min-w-[var(--space-3)] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-500)] px-[var(--space-1)] font-[var(--font-body)] text-xs font-[var(--weight-semibold)] text-[var(--color-text-inverse)]"
              aria-hidden="true"
            >
              {notificationCount}
            </span>
          )}
        </button>

        <DropdownMenu.Root
          onOpenChange={(open) => {
            if (open) {
              onAvatarMenuOpen?.();
            }
          }}
        >
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-[var(--control-md)] items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-1)] text-left transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={loading}
              aria-label={`Open account menu for ${userName}`}
              aria-busy={loading}
            >
              <img
                src={userAvatar}
                alt=""
                className="h-[var(--control-md)] w-[var(--control-md)] rounded-[var(--radius-full)] border border-[var(--color-border-default)] object-cover"
              />
              <span className="hidden max-w-[var(--space-24)] truncate text-sm font-[var(--weight-medium)] text-[var(--color-text-primary)] sm:inline">
                {userName}
              </span>
              <svg
                className="hidden h-[var(--space-4)] w-[var(--space-4)] text-[var(--color-text-muted)] sm:block"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-max min-w-[var(--space-24)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-[var(--space-2)] font-[var(--font-body)] shadow-[var(--shadow-md)]"
            >
              <DropdownMenu.Label className="px-[var(--space-2)] py-[var(--space-2)] text-sm font-[var(--weight-medium)] text-[var(--color-text-primary)]">
                {userName}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-[var(--space-1)] h-px bg-[var(--color-border-subtle)]" />
              <DropdownMenu.Item className="cursor-pointer rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-2)] text-sm text-[var(--color-text-secondary)] outline-none transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-neutral-100)] focus-visible:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)]">
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item className="cursor-pointer rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-2)] text-sm text-[var(--color-text-secondary)] outline-none transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] focus-visible:bg-[var(--color-neutral-100)] focus-visible:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)]">
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}