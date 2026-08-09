// HeroHeadline.tsx — Bold, playful headline for introducing Wavelength’s core value proposition.
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const heroHeadlineVariants = cva(
  "font-[var(--font-display)] font-[var(--weight-bold)] text-[var(--text-4xl)] text-[var(--color-text-primary)]"
);

export interface HeroHeadlineProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof heroHeadlineVariants> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
}

export default function HeroHeadline({
  as = "h1",
  className,
  children,
  ...props
}: HeroHeadlineProps) {
  const Heading = as;

  return (
    <Heading
      className={cn(heroHeadlineVariants(), className)}
      {...props}
    >
      {children}
    </Heading>
  );
}