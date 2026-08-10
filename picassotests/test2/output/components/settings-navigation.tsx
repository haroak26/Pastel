// SettingsNavigation.tsx — Secondary navigation for Wavelength account settings sections. Use beside settings content to switch between personal finance preferences.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { cn } from "../lib/cn";

const settingsNavigationVariants = cva(
  "font-[var(--font-body)]",
  {
    variants: {
      layout: {
        vertical: "flex w-full flex-col gap-[var(--space-1)]",
        horizontal:
          "flex w-full flex-row flex-wrap items-center gap-[var(--space-1)]",
      },
    },
    defaultVariants: {
      layout: "vertical",
    },
  }
);

const settingsNavigationItemVariants = cva(
  "group inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-transparent font-[var(--font-body)] font-[var(--weight-medium)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      layout: {
        vertical:
          "min-h-[var(--control-md)] w-full px-[var(--space-3)] text-left",
        horizontal:
          "min-h-[var(--control-sm)] px-[var(--space-3)] text-[var(--text-sm)]",
      },
      active: {
        true: "border-[var(--color-accent-100)] bg-[var(--color-accent-50)] text-[var(--color-accent-900)]",
        false: "",
      },
    },
    defaultVariants: {
      layout: "vertical",
      active: false,
    },
  }
);

export interface SettingsNavigationItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface SettingsNavigationProps
  extends VariantProps<typeof settingsNavigationVariants> {
  items: SettingsNavigationItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  loading?: boolean;
  className?: string;
}

export default function SettingsNavigation({
  items,
  activeSection,
  onSectionChange,
  layout = "vertical",
  loading = false,
  className,
}: SettingsNavigationProps) {
  return (
    <NavigationMenu.Root
      className={cn(settingsNavigationVariants({ layout }), className)}
      orientation={layout === "horizontal" ? "horizontal" : "vertical"}
      aria-label="Settings navigation"
      aria-busy={loading}
    >
      <NavigationMenu.List
        className={cn(
          "flex",
          layout === "vertical"
            ? "w-full flex-col gap-[var(--space-1)]"
            : "flex-row flex-wrap items-center gap-[var(--space-1)]"
        )}
      >
        {items.map((item) => {
          const isActive = item.value === activeSection;

          return (
            <NavigationMenu.Item key={item.value}>
              <NavigationMenu.Link
                href={`#${item.value}`}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={loading ? true : undefined}
                tabIndex={loading ? -1 : undefined}
                className={cn(
                  settingsNavigationItemVariants({
                    layout,
                    active: isActive,
                  }),
                  loading && "pointer-events-none opacity-50"
                )}
                onSelect={(event) => {
                  event.preventDefault();

                  if (!loading) {
                    onSectionChange(item.value);
                  }
                }}
              >
                {loading ? (
                  <svg
                    className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 animate-spin"
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
                ) : item.icon ? (
                  <span
                    className="flex h-[var(--space-4)] w-[var(--space-4)] shrink-0 items-center justify-center"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}