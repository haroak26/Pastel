// WelcomeHeading.tsx — Friendly personalized greeting and onboarding title. Use at the start of a welcome or onboarding flow.
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/cn";

const welcomeHeadingVariants = cva(
  "flex flex-col items-start gap-[var(--space-2)] font-[var(--font-body)]"
);

export interface WelcomeHeadingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  userName?: string;
}

export default function WelcomeHeading({
  className,
  children,
  userName,
  ...props
}: WelcomeHeadingProps) {
  return (
    <div
      className={cn(welcomeHeadingVariants(), className)}
      {...props}
    >
      <p className="font-[var(--font-body)] text-[var(--text-sm)] font-[var(--weight-semibold)] text-[var(--color-accent-500)]">
        Hello{userName ? `, ${userName}` : ""}
      </p>
      <h1 className="font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--weight-bold)] text-[var(--color-text-primary)]">
        {children}
      </h1>
    </div>
  );
}