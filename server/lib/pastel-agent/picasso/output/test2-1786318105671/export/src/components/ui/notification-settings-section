// NotificationSettingsSection.tsx — Preference controls for Wavelength notification alerts and summaries. Use in account or settings screens.
import * as React from "react";
import { cva } from "class-variance-authority";
import * as Switch from "@radix-ui/react-switch";
import { cn } from "../lib/cn";

const switchVariants = cva(
  "relative inline-flex w-[var(--space-12)] h-[var(--control-sm)] shrink-0 cursor-pointer items-center rounded-[var(--radius-full)] border transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:bg-[var(--color-accent-500)] data-[state=checked]:border-[var(--color-accent-500)] data-[state=unchecked]:bg-[var(--color-neutral-200)] data-[state=unchecked]:border-[var(--color-border-default)] data-[state=checked]:hover:bg-[var(--color-accent-600)] data-[state=unchecked]:hover:bg-[var(--color-neutral-300)]",
  {
    variants: {
      state: {
        on: "data-[state=checked]:bg-[var(--color-accent-500)]",
        off: "data-[state=unchecked]:bg-[var(--color-neutral-200)]",
      },
    },
    defaultVariants: {
      state: "off",
    },
  }
);

export interface NotificationSettingsSectionProps {
  settings: {
    budgetAlerts: boolean;
    goalMilestones: boolean;
    streakReminders: boolean;
    weeklySummary: boolean;
  };
  isLoading?: boolean;
  error?: string;
  onSettingChange: (setting: string, enabled: boolean) => void;
}

export default function NotificationSettingsSection({
  settings,
  isLoading = false,
  error,
  onSettingChange,
}: NotificationSettingsSectionProps) {
  const notificationSettings = [
    {
      key: "budgetAlerts",
      label: "Budget alerts",
      description: "Get a nudge when you’re close to a spending limit.",
      enabled: settings.budgetAlerts,
    },
    {
      key: "goalMilestones",
      label: "Goal milestones",
      description: "Celebrate progress when you hit a savings checkpoint.",
      enabled: settings.goalMilestones,
    },
    {
      key: "streakReminders",
      label: "Streak reminders",
      description: "Keep your budgeting streak going with timely reminders.",
      enabled: settings.streakReminders,
    },
    {
      key: "weeklySummary",
      label: "Weekly summary email",
      description: "See your spending, saving, and streak progress each week.",
      enabled: settings.weeklySummary,
    },
  ];

  return (
    <section
      aria-labelledby="notification-settings-heading"
      className="w-full max-w-[var(--space-24)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)]"
    >
      <div className="flex items-start justify-between gap-[var(--space-4)] border-b border-[var(--color-border-subtle)] p-[var(--space-6)]">
        <div className="max-w-[var(--space-16)]">
          <h2
            id="notification-settings-heading"
            className="font-[var(--font-display)] text-[length:var(--text-xl)] font-[var(--weight-semibold)] leading-[1.4] text-[var(--color-text-primary)]"
          >
            Notification settings
          </h2>
          <p className="mt-[var(--space-2)] font-[var(--font-body)] text-[length:var(--text-base)] font-[var(--weight-regular)] leading-[1.5] text-[var(--color-text-secondary)]">
            Choose which Wavelength moments should reach you.
          </p>
        </div>

        {isLoading && (
          <div
            className="flex shrink-0 items-center gap-[var(--space-2)] font-[var(--font-body)] text-[length:var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-muted)]"
            aria-live="polite"
          >
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Saving
          </div>
        )}
      </div>

      <div className="divide-y divide-[var(--color-border-subtle)]">
        {notificationSettings.map((notification) => (
          <div
            key={notification.key}
            className="flex min-h-[var(--control-lg)] items-center justify-between gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-4)]"
          >
            <div className="min-w-0">
              <p className="font-[var(--font-body)] text-[length:var(--text-base)] font-[var(--weight-medium)] leading-[1.5] text-[var(--color-text-primary)]">
                {notification.label}
              </p>
              <p className="mt-[var(--space-1)] font-[var(--font-body)] text-[length:var(--text-sm)] font-[var(--weight-regular)] leading-[1.45] text-[var(--color-text-secondary)]">
                {notification.description}
              </p>
            </div>

            <Switch.Root
              checked={notification.enabled}
              onCheckedChange={(enabled) =>
                onSettingChange(notification.key, enabled)
              }
              disabled={isLoading}
              aria-label={notification.label}
              aria-busy={isLoading}
              className={cn(
                switchVariants({
                  state: notification.enabled ? "on" : "off",
                })
              )}
            >
              <Switch.Thumb className="block h-[var(--space-4)] w-[var(--space-4)] translate-x-[var(--space-1)] rounded-[var(--radius-full)] bg-[var(--color-surface-raised)] transition-transform duration-[var(--duration-fast)] ease-[var(--easing-standard)] data-[state=checked]:translate-x-[var(--space-6)]" />
            </Switch.Root>
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="border-t border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-6)] py-[var(--space-3)] font-[var(--font-body)] text-[length:var(--text-sm)] font-[var(--weight-medium)] leading-[1.45] text-[var(--color-danger-900)]"
        >
          {error}
        </p>
      )}
    </section>
  );
}