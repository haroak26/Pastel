// FeatureCard.tsx — Highlights a Wavelength feature with an icon, title, and concise explanation. Use for product feature summaries.
import type { HTMLAttributes, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const featureCardVariants = cva(
  "group flex items-start gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:border-[var(--color-accent-500)] hover:bg-[var(--color-neutral-50)]"
);

export interface FeatureCardProps extends HTMLAttributes<HTMLElement> {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({
  className,
  icon,
  title,
  description,
  ...props
}: FeatureCardProps) {
  return (
    <article
      className={cn(featureCardVariants(), className)}
      {...props}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-50)] p-[var(--space-3)] text-[var(--color-accent-600)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] group-hover:bg-[var(--color-accent-100)]"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="font-[var(--font-display)] text-[var(--text-lg)] font-[var(--weight-semibold)] leading-[var(--text-lg)] text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-[var(--space-2)] font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-regular)] leading-[var(--text-sm)] text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
    </article>
  );
}