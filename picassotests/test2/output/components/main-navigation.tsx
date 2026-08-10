// MainNavigation.tsx — Wavelength route navigation for switching between core money-management views.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { cn } from "../lib/cn";

const navigationVariants = cva(
  "font-[var(--font-body)]",
  {
    variants: {
      layout: {
        sidebar: "w-full",
        topbar: "w-full",
      },
      orientation: {
        vertical: "flex flex-col",
        horizontal: "flex flex-row items-center",
      },
    },
    defaultVariants: {
      layout: "sidebar",
      orientation: "vertical",
    },
  }
);

const navigationListVariants = cva(
  "flex",
  {
    variants: {
      orientation: {
        vertical:
          "w-full flex-col gap-[var(--space-1)] border-l border-[var(--color-border-subtle)] pl-[var(--space-2)]",
        horizontal:
          "items-center gap-[var(--space-1)] overflow-x-auto border-b border-[var(--color-border-subtle)]",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

const navigationLinkVariants = cva(
  "group relative inline-flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] font-[var(--font-body)] font-[var(--weight-medium)] text-[length:var(--text-base)] text-[var(--color-text-secondary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      layout: {
        sidebar: "min-h-[var(--control-md)] w-full px-[var(--space-3)]",
        topbar: "min-h-[var(--control-md)] px-[var(--space-3)]",
      },
      orientation: {
        vertical:
          "hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] data-[active=true]:border-l-2 data-[active=true]:border-[var(--color-accent-500)] data-[active=true]:bg-[var(--color-accent-50)] data-[active=true]:text-[var(--color-text-primary)]",
        horizontal:
          "hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] data-[active=true]:border-b-2 data-[active=true]:border-[var(--color-accent-500)] data-[active=true]:text-[var(--color-text-primary)]",
      },
    },
    defaultVariants: {
      layout: "sidebar",
      orientation: "vertical",
    },
  }
);

export interface MainNavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface MainNavigationProps
  extends VariantProps<typeof navigationVariants> {
  items: MainNavigationItem[];
  currentPath: string;
  onNavigate?: (path: string) => void;
  loading?: boolean;
  className?: string;
}

export default function MainNavigation({
  items,
  currentPath,
  onNavigate,
  layout,
  orientation,
  loading = false,
  className,
}: MainNavigationProps) {
  return (
    <NavigationMenu.Root
      className={cn(
        navigationVariants({ layout, orientation }),
        loading && "pointer-events-none opacity-50",
        className
      )}
      orientation={orientation ?? "vertical"}
      aria-busy={loading}
    >
      {loading && (
        <span
          className="mb-[var(--space-2)] inline-flex h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
          role="status"
          aria-label="Loading navigation"
        >
          <svg
            className="h-full w-full"
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
        </span>
      )}

      <NavigationMenu.List
        className={cn(navigationListVariants({ orientation }))}
      >
        {items.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/" && currentPath.startsWith(`${item.href}/`));

          return (
            <NavigationMenu.Item key={item.href}>
              <NavigationMenu.Link
                asChild
                active={isActive}
                className={cn(navigationLinkVariants({ layout, orientation }))}
              >
                <a
                  href={item.href}
                  data-active={isActive}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onNavigate?.(item.href)}
                >
                  <span
                    className="inline-flex h-[var(--space-4)] w-[var(--space-4)] shrink-0 items-center justify-center"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}