// PageHeader.tsx — Introduces a page section with its title, supporting context, and an optional primary action.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import Button from "./Button";

const pageHeaderVariants = cva(
  "flex items-start justify-between gap-[var(--space-6)] font-[var(--font-body)]",
  {
    variants: {
      size: {
        sm: "pb-[var(--space-4)]",
        md: "pb-[var(--space-6)]",
        lg: "pb-[var(--space-8)]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const pageHeaderTitleVariants = cva(
  "font-[var(--font-display)] font-[var(--weight-semibold)] tracking-[-0.02em] text-[var(--color-text-primary)]",
  {
    variants: {
      size: {
        sm: "text-[var(--text-xl)]",
        md: "text-[var(--text-2xl)]",
        lg: "text-[var(--text-3xl)]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageHeaderVariants> {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
}

export default function PageHeader({
  className,
  size,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionLoading = false,
  actionDisabled = false,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(pageHeaderVariants({ size }), className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h1 className={cn(pageHeaderTitleVariants({ size }))}>{title}</h1>
        {subtitle && (
          <p className="mt-[var(--space-2)] max-w-[var(--space-24)] font-[var(--font-body)] text-[var(--text-base)] font-[var(--weight-regular)] text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button
          type="button"
          variant="primary"
          size={size === "lg" ? "lg" : "md"}
          onClick={onAction}
          loading={actionLoading}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      )}
    </header>
  );
}