// FeatureGrid.tsx — Product feature card grid for showcasing Wavelength capabilities such as auto-categorization, challenges, and bank integration.
import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const featureGridVariants = cva(
  "grid w-full gap-[var(--space-6)] font-[var(--font-body)]",
  {
    variants: {
      columns: {
        3: "grid-cols-3",
        4: "grid-cols-4",
      },
      layout: {
        grid: "grid",
      },
    },
    defaultVariants: {
      columns: 3,
      layout: "grid",
    },
  }
);

export interface FeatureGridProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof featureGridVariants> {
  children: ReactNode;
}

export default function FeatureGrid({
  className,
  columns,
  layout,
  children,
  ...props
}: FeatureGridProps) {
  return (
    <div
      className={cn(featureGridVariants({ columns, layout }), className)}
      {...props}
    >
      {children}
    </div>
  );
}