import React from "react";

export default function Button({
  label = "Continue",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  ...props
}) {
  const sizeStyles = {
    sm: "h-[var(--control-sm)] px-3.5 text-xs font-semibold rounded-[var(--radius-sm)]",
    md: "h-[var(--control-md)] px-5 text-sm font-semibold rounded-[var(--radius-md)]",
    lg: "h-[var(--control-lg)] px-6 text-base font-semibold rounded-[var(--radius-lg)]",
  };

  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:brightness-105 active:brightness-95 border border-transparent",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-[var(--border)] active:opacity-90 border border-transparent",
    outline:
      "bg-background text-foreground border border-border hover:bg-secondary active:opacity-90",
    ghost:
      "bg-transparent text-foreground hover:bg-secondary active:opacity-80 border border-transparent",
    accent:
      "bg-accent text-accent-foreground hover:brightness-105 active:brightness-95 border border-transparent",
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-[family-name:var(--font-body)] tracking-tight transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 active:scale-[0.98] ${currentSize} ${currentVariant}`}
      {...props}
    >
      <span>{label}</span>
    </button>
  );
}