// UserMenu.tsx — Profile dropdown for account actions. Use in authenticated navigation areas where users need profile, settings, and logout actions.
import * as React from "react";
import { cva } from "class-variance-authority";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/cn";

const userMenuVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-[var(--weight-medium)] text-[var(--color-text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] disabled:pointer-events-none disabled:opacity-50"
);

export interface UserMenuProps {
  userName: string;
  avatar?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
  loading?: boolean;
  className?: string;
}

function UserIcon() {
  return (
    <svg
      className="h-[var(--space-4)] w-[var(--space-4)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-[var(--space-4)] w-[var(--space-4)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2A2 2 0 0 0 5.8 18l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.6 12H1.3a2 2 0 1 1 0-4h.2A2 2 0 0 0 3 4.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.2.4V.2a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0 1.4 3.4h.3a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 3.4Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-[var(--space-4)] w-[var(--space-4)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
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
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function UserMenu({
  userName,
  avatar,
  onProfile,
  onSettings,
  onLogout,
  loading = false,
  className,
}: UserMenuProps) {
  const initials = userName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            userMenuVariants(),
            "h-[var(--control-md)] px-[var(--space-2)]",
            className
          )}
          disabled={loading}
          aria-busy={loading}
          aria-label={`Open account menu for ${userName}`}
        >
          {loading ? (
            <LoadingSpinner />
          ) : avatar ? (
            <img
              src={avatar}
              alt=""
              className="h-[var(--space-6)] w-[var(--space-6)] rounded-[var(--radius-full)] object-cover"
            />
          ) : (
            <span
              className="inline-flex h-[var(--space-6)] w-[var(--space-6)] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-100)] font-[var(--weight-semibold)] text-xs text-[var(--color-accent-900)]"
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
          <span className="max-w-[var(--space-24)] truncate text-sm">
            {userName}
          </span>
          <svg
            className="h-[var(--space-4)] w-[var(--space-4)] text-[var(--color-text-muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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
          className="z-50 min-w-[var(--space-24)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-2)] text-[var(--color-text-primary)] shadow-[var(--shadow-md)]"
        >
          <DropdownMenu.Label className="px-[var(--space-3)] py-[var(--space-2)] text-xs font-[var(--weight-semibold)] text-[var(--color-text-muted)]">
            {userName}
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-[var(--space-1)] h-px bg-[var(--color-border-subtle)]" />

          <DropdownMenu.Item
            className="flex h-[var(--control-sm)] cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] text-sm outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 data-[highlighted]:bg-[var(--color-neutral-100)]"
            onSelect={() => onProfile?.()}
          >
            <UserIcon />
            <span>Profile</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex h-[var(--control-sm)] cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] text-sm outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 data-[highlighted]:bg-[var(--color-neutral-100)]"
            onSelect={() => onSettings?.()}
          >
            <SettingsIcon />
            <span>Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-[var(--space-1)] h-px bg-[var(--color-border-subtle)]" />

          <DropdownMenu.Item
            className="flex h-[var(--control-sm)] cursor-pointer items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] text-sm text-[var(--color-danger-500)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-danger-50)] active:bg-[var(--color-danger-50)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 data-[highlighted]:bg-[var(--color-danger-50)]"
            onSelect={onLogout}
          >
            <LogoutIcon />
            <span>Log out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}