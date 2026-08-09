// ProfileTab.tsx — Navigation tab to profile with icon and label. Use in tab navigation bars to switch between profile sections.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import React from "react";

const profileTabVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] font-[var(--weight-medium)] text-sm transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      active: {
        true: "bg-[var(--color-accent-100)] text-[var(--color-accent-600)] border-b-2 border-[var(--color-accent-500)]",
        false:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface ProfileTabProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof profileTabVariants> {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export default function ProfileTab({
  className,
  active = false,
  icon,
  label,
  href,
  ...props
}: ProfileTabProps) {
  return (
    <a
      href={href}
      className={cn(profileTabVariants({ active }), className)}
      aria-current={active ? "page" : undefined}
      {...props}
    >
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <span>{label}</span>
    </a>
  );
}