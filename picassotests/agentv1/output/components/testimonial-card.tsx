// TestimonialCard.tsx — A photo-led customer testimonial with quote and attribution. Use in social proof sections and trust-building surfaces.
import { cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const testimonialCardVariants = cva(
  "flex flex-col gap-[var(--space-6)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] shadow-[var(--shadow-sm)]"
);

export interface TestimonialCardProps
  extends HTMLAttributes<HTMLElement> {
  avatar: string;
  quote: string;
  name: string;
  role?: string;
}

export default function TestimonialCard({
  avatar,
  quote,
  name,
  role,
  className,
  ...props
}: TestimonialCardProps) {
  return (
    <article
      className={cn(testimonialCardVariants(), className)}
      {...props}
    >
      <blockquote className="text-[var(--text-lg)] font-[var(--weight-medium)] leading-[var(--text-lg)] text-[var(--color-text-primary)]">
        {quote}
      </blockquote>

      <div className="flex items-center gap-[var(--space-3)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]">
        <img
          src={avatar}
          alt={name}
          className="h-[var(--control-lg)] w-[var(--control-lg)] rounded-[var(--radius-full)] object-cover"
        />

        <div className="min-w-0">
          <cite className="block truncate font-[var(--font-display)] text-[var(--text-base)] font-[var(--weight-semibold)] not-italic text-[var(--color-text-primary)]">
            {name}
          </cite>
          {role && (
            <p className="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-text-muted)]">
              {role}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}