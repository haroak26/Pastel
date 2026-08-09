// NextButton.tsx — Button to proceed to next onboarding step. Use in onboarding flows to advance between steps.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const nextButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-[var(--weight-medium)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        md: "h-[var(--control-md)] px-4 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface NextButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof nextButtonVariants> {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function NextButton({
  className,
  size,
  onClick,
  disabled = false,
  loading = false,
  children = "Next",
  ...props
}: NextButtonProps) {
  return (
    <button
      className={cn(
        nextButtonVariants({ size }),
        "bg-[var(--color-accent-500)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)]",
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
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