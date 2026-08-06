const VARIANTS = {
  default: "bg-primary text-primary-foreground hover:bg-primary",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-card text-card-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  muted: "bg-muted text-muted-foreground",
};

export default function Badge({ variant = "default", dot = false, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${VARIANTS[variant]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
