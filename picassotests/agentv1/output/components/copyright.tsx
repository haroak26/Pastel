// Copyright.tsx — Displays a concise copyright notice and company information. Use in product footers and legal areas.
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const copyrightVariants = cva(
  "inline-flex items-center gap-[var(--space-1)] font-[var(--font-body)] text-sm font-[var(--weight-regular)] text-[var(--color-text-muted)]"
);

export interface CopyrightProps {
  year?: number;
  company: string;
  className?: string;
}

export default function Copyright({
  year,
  company,
  className,
}: CopyrightProps) {
  const displayYear = year ?? new Date().getFullYear();

  return (
    <small className={cn(copyrightVariants(), className)}>
      <span aria-hidden="true">©</span>
      <span>
        {displayYear} {company}
      </span>
    </small>
  );
}