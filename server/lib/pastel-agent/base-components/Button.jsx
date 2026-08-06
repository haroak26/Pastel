import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
  ghost: "text-card-foreground hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
};

// V11: control heights come from the theme's rhythm tokens (32/40/48px) —
// never raw off-grid heights (36px/44px), which break the 8px-grid law and
// fight the company's radius/rhythm rules.
const SIZES = {
  sm: "h-[var(--control-sm)] rounded-[var(--radius-md)] px-3 text-sm",
  md: "h-[var(--control-md)] rounded-[var(--radius-md)] px-[var(--control-pad-x)] text-sm",
  lg: "h-[var(--control-lg)] rounded-[var(--radius-md)] px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
