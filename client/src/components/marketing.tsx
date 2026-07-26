import React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ds";

/*
 * Shared marketing section primitives.
 * These are the exact patterns used on the Landing page so that Features,
 * Agent, and other marketing routes render identical section/hero/feature UI.
 */

export function SectionHeader({
  label,
  title,
  subtitle,
  centered = false,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}) {
  return (
    <div className={`space-y-3 ${centered ? "text-center" : ""}`}>
      {label && (
        <div className={`${centered ? "flex justify-center" : ""}`}>
          <span className="text-[11px] font-semibold text-brand tracking-wide uppercase">
            {label}
          </span>
        </div>
      )}
      <h2
        className="text-[22px] sm:text-[26px] md:text-[30px] text-foreground font-semibold leading-[1.1] tracking-[-0.02em]"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-[14px] text-fg-muted font-medium leading-[1.65] max-w-[560px]"
          style={centered ? { margin: "0 auto" } : undefined}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export type FeatureVariant = "brand" | "amber" | "red" | "green" | "purple";

const variantColors: Record<FeatureVariant, string> = {
  brand: "text-sky-500",
  amber: "text-amber-500",
  red: "text-rose-500",
  green: "text-emerald-500",
  purple: "text-fuchsia-500",
};

export function FeatureIcon({
  icon: Icon,
  variant,
}: {
  icon: React.ElementType;
  variant: FeatureVariant;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
        "bg-black/[0.03]",
        variantColors[variant],
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  variant,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  variant: FeatureVariant;
}) {
  return (
    <div className="flex gap-4">
      <FeatureIcon icon={icon} variant={variant} />
      <div className="space-y-1.5">
        <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">
          {title}
        </h3>
        <p className="text-[13px] text-fg-muted leading-[1.65] font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}

export function MarketingHeroSection({
  eyebrowLabel,
  eyebrow,
  title,
  description,
}: {
  eyebrowLabel: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <section className="w-full pt-24 md:pt-28 pb-12 md:pb-16 hero-grain overflow-hidden">
      <div className="lds-marketing-section">
        <div className="max-w-xl">
          <div className="mb-7">
            <Eyebrow label={eyebrowLabel}>{eyebrow}</Eyebrow>
          </div>
          <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
            {title}
          </h1>
          <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

export function MarketingFeatureSection({
  label,
  title,
  subtitle,
  items,
  columns = 3,
}: {
  label: string;
  title: string;
  subtitle?: string;
  items: {
    icon: React.ElementType;
    title: string;
    description: string;
    variant: FeatureVariant;
  }[];
  columns?: 2 | 3;
}) {
  const gridCols =
    columns === 3
      ? "md:grid-cols-3 gap-x-8 md:gap-x-16 lg:gap-x-24"
      : "md:grid-cols-2 gap-x-8 md:gap-x-16";
  return (
    <section className="w-full py-14 md:py-20">
      <div className="lds-marketing-section">
        <div className="space-y-14">
          <SectionHeader label={label} title={title} subtitle={subtitle} />
          <div className={`grid ${gridCols} gap-y-12`}>
            {items.map(({ icon, title: itemTitle, description, variant }) => (
              <FeatureCard
                key={itemTitle}
                icon={icon}
                title={itemTitle}
                description={description}
                variant={variant}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}