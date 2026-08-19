import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const sizeStyles = {
    sm: "h-[var(--control-sm)] px-3 text-xs tracking-wider gap-1.5 rounded-[var(--radius-sm)]",
    md: "h-[var(--control-md)] px-4 text-xs sm:text-sm tracking-wider gap-2 rounded-[var(--radius-md)]",
    lg: "h-[var(--control-lg)] px-6 text-sm sm:text-base tracking-widest gap-2.5 rounded-[var(--radius-md)]",
  };

  const variantStyles = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold hover:brightness-110 active:brightness-95 border border-transparent shadow-[0_0_14px_rgba(206,242,2,0.18)]",
    secondary:
      "bg-[var(--card)] text-[var(--foreground)] font-medium border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] active:bg-[var(--background)]",
    destructive:
      "bg-[var(--destructive)] text-[var(--accent-foreground)] font-semibold hover:brightness-110 active:brightness-95 border border-transparent",
    ghost:
      "bg-transparent text-[var(--muted-foreground)] font-medium hover:text-[var(--foreground)] hover:bg-[var(--card)] border border-transparent",
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center font-['Archivo',sans-serif] uppercase select-none transition-all duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed ${currentSize} ${currentVariant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}