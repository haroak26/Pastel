// Logo.tsx — Wavelength brand mark and app name for authenticated navigation. Use wherever users need a consistent path back to home or the dashboard.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const logoVariants = cva(
  "inline-flex items-center rounded-[var(--radius-md)] font-[var(--font-display)] font-[var(--weight-bold)] text-[var(--color-text-primary)] transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-[var(--control-sm)] gap-[var(--space-2)] text-[var(--text-sm)]",
        md: "h-[var(--control-md)] gap-[var(--space-2)] text-[var(--text-lg)]",
        lg: "h-[var(--control-lg)] gap-[var(--space-3)] text-[var(--text-xl)]",
      },
      variant: {
        full: "",
        icon: "aspect-square w-[var(--control-md)] justify-center",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "full",
    },
  }
);

export interface LogoProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof logoVariants> {
  href?: string;
}

function LogoMark({ size }: { size: LogoProps["size"] }) {
  return (
    <svg
      className={cn(
        "shrink-0 text-[var(--color-accent-500)]",
        size === "sm" && "h-[var(--control-sm)] w-[var(--control-sm)]",
        size === "md" && "h-[var(--control-md)] w-[var(--control-md)]",
        size === "lg" && "h-[var(--control-lg)] w-[var(--control-lg)]"
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 17.5C11.5 17.5 11.5 30.5 16 30.5C20.5 30.5 20.5 17.5 25 17.5C29.5 17.5 29.5 30.5 34 30.5C37.5 30.5 39.5 23.5 41 20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M7 30.5C11.5 30.5 11.5 17.5 16 17.5"
        stroke="var(--color-accent-900)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  className,
  size = "md",
  variant = "full",
  href,
  "aria-label": ariaLabel,
  ...props
}: LogoProps) {
  const content = (
    <>
      <LogoMark size={size} />
      {variant === "full" && <span>Wavelength</span>}
    </>
  );

  const classes = cn(logoVariants({ size, variant }), className);

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        aria-label={ariaLabel ?? (variant === "icon" ? "Wavelength home" : undefined)}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={classes}
      aria-label={ariaLabel ?? (variant === "icon" ? "Wavelength" : undefined)}
      {...props}
    >
      {content}
    </span>
  );
}