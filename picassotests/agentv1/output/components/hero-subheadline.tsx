// HeroSubheadline.tsx — Supporting copy that frames Wavelength’s playful budgeting experience beneath a hero headline.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const heroSubheadlineVariants = cva(
  "font-[var(--font-body)] text-[var(--text-lg)] font-[var(--weight-regular)]",
  {
    variants: {
      emphasis: {
        default: "text-[var(--color-text-secondary)]",
        muted: "text-[var(--color-text-muted)]",
      },
    },
    defaultVariants: {
      emphasis: "default",
    },
  }
);

export interface HeroSubheadlineProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, "children">,
    VariantProps<typeof heroSubheadlineVariants> {
  children: ReactNode;
}

export default function HeroSubheadline({
  className,
  emphasis,
  children,
  ...props
}: HeroSubheadlineProps) {
  return (
    <p
      className={cn(heroSubheadlineVariants({ emphasis }), className)}
      {...props}
    >
      {children}
    </p>
  );
}