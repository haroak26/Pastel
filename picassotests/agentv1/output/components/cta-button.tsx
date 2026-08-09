// CTAButton.tsx — Primary call-to-action button directing to sign-up. Use for conversion-focused actions, form submission, and key user flows in Wavelength.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const ctaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)]",
        secondary:
          "bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)] border border-[var(--color-border-default)]",
      },
      size: {
        sm: "h-[var(--control-sm)] px-3 text-sm",
        md: "h-[var(--control-md)] px-4 text-base",
        lg: "h-[var(--control-lg)] px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface CTAButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ctaButtonVariants> {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function CTAButton({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  href,
  onClick,
  ...props
}: CTAButtonProps) {
  const isDisabled = disabled || loading;

  if (href) {
    return (
      <a
        href={isDisabled ? undefined : href}
        className={cn(ctaButtonVariants({ variant, size }), className)}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
          } else if (onClick) {
            onClick();
          }
        }}
        style={{ pointerEvents: isDisabled ? "none" : "auto", opacity: isDisabled ? 0.5 : 1 }}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </a>
    );
  }

  return (
    <button
      className={cn(ctaButtonVariants({ variant, size }), className)}
      disabled={isDisabled}
      aria-busy={loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}