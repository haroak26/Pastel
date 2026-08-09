// HeroIllustration.tsx — Personality-forward visual asset for hero sections; use for static or motion-based product illustrations.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const heroIllustrationVariants = cva(
  "relative isolate overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] transition-[transform,opacity] duration-[var(--duration-base)] ease-[var(--easing-standard)]",
  {
    variants: {
      type: {
        static: "hover:opacity-95 active:opacity-90",
        animated:
          "motion-safe:animate-[pulse_var(--duration-slow)_var(--easing-standard)_infinite] hover:scale-[1.01] active:scale-[0.99]",
      },
    },
    defaultVariants: {
      type: "static",
    },
  }
);

export interface HeroIllustrationProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof heroIllustrationVariants> {
  src: string;
  alt: string;
  animated?: boolean;
  loading?: boolean;
}

export default function HeroIllustration({
  className,
  type,
  src,
  alt,
  animated = false,
  loading = false,
  ...props
}: HeroIllustrationProps) {
  const illustrationType = animated ? "animated" : type;

  return (
    <figure
      className={cn(heroIllustrationVariants({ type: illustrationType }), className)}
      aria-busy={loading}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className="block h-auto w-full object-cover"
        decoding="async"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-raised)]">
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
        </div>
      )}
    </figure>
  );
}