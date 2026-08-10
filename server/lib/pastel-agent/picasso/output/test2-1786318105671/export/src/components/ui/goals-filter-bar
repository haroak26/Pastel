// GoalsFilterBar.tsx — Filter goals by progress state while keeping each option’s count visible. Use above goal lists and progress views.
import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const goalsFilterBarVariants = cva(
  "flex items-center gap-[var(--space-2)] font-[var(--font-body)] text-[var(--color-text-secondary)]",
  {
    variants: {
      layout: {
        tabs: [
          "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]",
          "bg-[var(--color-surface-raised)] p-[var(--space-1)]",
        ].join(" "),
        buttons: "border-b border-[var(--color-border-subtle)]",
      },
    },
    defaultVariants: {
      layout: "tabs",
    },
  }
);

const filterTriggerVariants = cva(
  [
    "group inline-flex items-center justify-center gap-[var(--space-2)]",
    "font-[var(--weight-medium)]",
    "transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      layout: {
        tabs: [
          "h-[var(--control-md)] rounded-[var(--radius-md)] px-[var(--space-4)]",
          "hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
          "data-[state=active]:bg-[var(--color-accent-50)] data-[state=active]:text-[var(--color-accent-900)]",
        ].join(" "),
        buttons: [
          "h-[var(--control-md)] border-b-2 border-transparent px-[var(--space-3)]",
          "hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)]",
          "active:bg-[var(--color-neutral-100)]",
          "data-[state=active]:border-[var(--color-accent-500)] data-[state=active]:text-[var(--color-accent-600)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      layout: "tabs",
    },
  }
);

const filterCountVariants = cva(
  [
    "inline-flex min-w-[var(--space-6)] items-center justify-center rounded-[var(--radius-full)]",
    "px-[var(--space-2)] font-[var(--weight-semibold)] tabular-nums",
  ].join(" "),
  {
    variants: {
      layout: {
        tabs: [
          "bg-[var(--color-neutral-100)] text-[var(--color-text-muted)]",
          "group-data-[state=active]:bg-[var(--color-accent-100)] group-data-[state=active]:text-[var(--color-accent-900)]",
        ].join(" "),
        buttons: [
          "bg-[var(--color-neutral-50)] text-[var(--color-text-muted)]",
          "group-data-[state=active]:bg-[var(--color-accent-50)] group-data-[state=active]:text-[var(--color-accent-900)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      layout: "tabs",
    },
  }
);

export interface GoalsFilterBarProps
  extends VariantProps<typeof goalsFilterBarVariants> {
  filters: Array<{
    label: string;
    value: string;
    count: number;
  }>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  loading?: boolean;
  className?: string;
  "aria-label"?: string;
}

export default function GoalsFilterBar({
  filters,
  activeFilter,
  onFilterChange,
  layout = "tabs",
  loading = false,
  className,
  "aria-label": ariaLabel = "Filter goals",
}: GoalsFilterBarProps) {
  return (
    <Tabs.Root
      value={activeFilter}
      onValueChange={onFilterChange}
      aria-busy={loading}
      className={cn(goalsFilterBarVariants({ layout }), className)}
    >
      <Tabs.List
        aria-label={ariaLabel}
        className="flex items-center gap-[var(--space-1)]"
      >
        {loading && (
          <span
            className="ml-[var(--space-2)] inline-flex"
            aria-label="Loading filters"
          >
            <svg
              className="h-[var(--space-4)] w-[var(--space-4)] animate-spin text-[var(--color-accent-500)]"
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

        {filters.map((filter) => (
          <Tabs.Trigger
            key={filter.value}
            value={filter.value}
            disabled={loading}
            className={cn(filterTriggerVariants({ layout }))}
            style={{ font: "var(--text-sm)", fontFamily: "var(--font-body)" }}
          >
            <span>{filter.label}</span>
            <span
              className={cn(
                filterCountVariants({ layout }),
                "[font:var(--text-xs)]"
              )}
            >
              {filter.count}
            </span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}