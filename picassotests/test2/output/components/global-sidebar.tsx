// GlobalSidebar.tsx — Persistent Wavelength navigation for switching between money views and accessing the current user profile.
import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const globalSidebarVariants = cva(
  "flex shrink-0 flex-col border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] font-[var(--font-body)] text-[var(--color-text-primary)] transition-[width,transform] duration-[var(--duration-base)] ease-[var(--easing-standard)]",
  {
    variants: {
      state: {
        expanded: "w-[calc(var(--space-24)*3)]",
        collapsed: "w-[var(--space-16)]",
      },
      layout: {
        desktop:
          "min-h-screen rounded-[var(--radius-lg)]",
        mobile:
          "w-full min-h-0 rounded-[var(--radius-lg)]",
      },
    },
    compoundVariants: [
      {
        state: "collapsed",
        layout: "mobile",
        className: "w-[var(--space-16)]",
      },
    ],
    defaultVariants: {
      state: "expanded",
      layout: "desktop",
    },
  }
);

export interface GlobalSidebarProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof globalSidebarVariants> {
  logoSrc: string;
  appTitle: string;
  navigationItems: Array<{
    label: string;
    href: string;
    icon: ReactNode;
  }>;
  currentPath: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  isCollapsed?: boolean;
  onNavigate?: (path: string) => void;
  onToggleCollapse?: () => void;
  loading?: boolean;
}

export default function GlobalSidebar({
  className,
  state,
  layout = "desktop",
  logoSrc,
  appTitle,
  navigationItems,
  currentPath,
  user,
  isCollapsed,
  onNavigate,
  onToggleCollapse,
  loading = false,
  ...props
}: GlobalSidebarProps) {
  const resolvedState = isCollapsed ?? state === "collapsed" ? "collapsed" : "expanded";
  const collapsed = resolvedState === "collapsed";

  return (
    <aside
      className={cn(
        globalSidebarVariants({
          state: resolvedState,
          layout,
        }),
        className
      )}
      aria-busy={loading}
      {...props}
    >
      <div className="flex items-center justify-between gap-[var(--space-3)] border-b border-[var(--color-border-subtle)] p-[var(--space-4)]">
        <a
          href="/"
          aria-label={appTitle}
          className={cn(
            "flex min-w-0 items-center gap-[var(--space-3)] rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
            collapsed && "justify-center"
          )}
        >
          <img
            src={logoSrc}
            alt=""
            className="h-[var(--control-md)] w-[var(--control-md)] shrink-0 rounded-[var(--radius-sm)] object-contain"
          />
          {!collapsed && (
            <span className="truncate font-[var(--font-display)] text-[length:var(--text-lg)] font-[var(--weight-semibold)]">
              {appTitle}
            </span>
          )}
        </a>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            disabled={loading}
            aria-label={collapsed ? `Expand ${appTitle} navigation` : `Collapse ${appTitle} navigation`}
            aria-expanded={!collapsed}
            className={cn(
              "inline-flex h-[var(--control-sm)] w-[var(--control-sm)] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              collapsed && "rotate-180"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-[var(--space-4)] w-[var(--space-4)]"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      <nav
        aria-label={`${appTitle} main navigation`}
        className="flex flex-1 flex-col gap-[var(--space-2)] p-[var(--space-3)]"
      >
        {loading && (
          <div
            className={cn(
              "flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]",
              collapsed && "justify-center px-[var(--space-2)]"
            )}
            role="status"
            aria-label="Loading navigation"
          >
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-75"
              />
            </svg>
            {!collapsed && <span>Updating views</span>}
          </div>
        )}

        {navigationItems.map((item) => {
          const isActive = currentPath === item.href;

          return (
            <button
              key={item.href}
              type="button"
              disabled={loading}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "group flex h-[var(--control-lg)] items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] text-left text-[length:var(--text-base)] font-[var(--weight-medium)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive &&
                  "border-l-2 border-[var(--color-accent-500)] bg-[var(--color-accent-50)] pl-[var(--space-2)] text-[var(--color-text-primary)]",
                collapsed && "justify-center px-[var(--space-2)]",
                isActive && collapsed && "pl-[var(--space-2)]"
              )}
            >
              <span
                className={cn(
                  "flex h-[var(--space-6)] w-[var(--space-6)] shrink-0 items-center justify-center text-[var(--color-text-muted)]",
                  isActive && "text-[var(--color-accent-500)]"
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border-subtle)] p-[var(--space-3)]">
        <div
          className={cn(
            "flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] p-[var(--space-2)]",
            collapsed && "justify-center"
          )}
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-[var(--control-md)] w-[var(--control-md)] shrink-0 rounded-[var(--radius-full)] object-cover"
          />
          {!collapsed && (
            <span className="min-w-0 truncate text-[length:var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-primary)]">
              {user.name}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}