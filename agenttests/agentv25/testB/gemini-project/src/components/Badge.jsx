import React from "react";
import { Activity, Flame, ShieldAlert, CheckCircle2, ChevronRight, Zap } from "lucide-react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: "volt" | "success" | "warning" | "destructive" | "neutral" | string;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  showIcon?: boolean;
}

const variantStyles: Record<string, { container: string; dot: string; icon: React.ElementType }> = {
  volt: {
    container:
      "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-extrabold shadow-[0_0_12px_rgba(206,242,2,0.22)]",
    dot: "bg-[var(--primary-foreground)]",
    icon: Zap,
  },
  success: {
    container:
      "bg-[var(--card)] text-[var(--success)] border-[var(--success)]/40 hover:border-[var(--success)]/70",
    dot: "bg-[var(--success)]",
    icon: CheckCircle2,
  },
  warning: {
    container:
      "bg-[var(--card)] text-[var(--warning)] border-[var(--warning)]/40 hover:border-[var(--warning)]/70",
    dot: "bg-[var(--warning)]",
    icon: Flame,
  },
  destructive: {
    container:
      "bg-[var(--card)] text-[var(--destructive)] border-[var(--destructive)]/40 hover:border-[var(--destructive)]/70",
    dot: "bg-[var(--destructive)]",
    icon: ShieldAlert,
  },
  neutral: {
    container:
      "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]",
    dot: "bg-[var(--muted-foreground)]",
    icon: Activity,
  },
};

const sizeStyles: Record<string, { container: string; text: string; iconSize: number }> = {
  sm: {
    container: "h-5 px-1.5 gap-1 rounded-[var(--radius-sm)]",
    text: "text-[10px] tracking-wider",
    iconSize: 10,
  },
  md: {
    container: "h-6 px-2.5 gap-1.5 rounded-[var(--radius-sm)]",
    text: "text-[11px] tracking-wide",
    iconSize: 12,
  },
  lg: {
    container: "h-7 px-3 gap-2 rounded-[var(--radius-md)]",
    text: "text-[12px] tracking-wide",
    iconSize: 14,
  },
};

export default function Badge({
  label = "TARGET MET",
  variant = "volt",
  size = "md",
  dot = true,
  showIcon = false,
  className = "",
  ...props
}: BadgeProps) {
  const currentVariant = variantStyles[variant] || variantStyles.neutral;
  const currentSize = sizeStyles[size] || sizeStyles.md;
  const IconComponent = currentVariant.icon;

  return (
    <span
      role="status"
      className={`inline-flex items-center justify-center font-[family-name:var(--font-display)] uppercase select-none border transition-all duration-150 tabular-nums ${currentVariant.container} ${currentSize.container} ${currentSize.text} ${className}`}
      {...props}
    >
      {showIcon ? (
        <IconComponent
          size={currentSize.iconSize}
          strokeWidth={2.5}
          className="shrink-0 animate-in fade-in duration-200"
          aria-hidden="true"
        />
      ) : dot ? (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot}`}
          aria-hidden="true"
        />
      ) : null}
      
      <span className="font-bold leading-none translate-y-[0.5px]">
        {label}
      </span>
    </span>
  );
}