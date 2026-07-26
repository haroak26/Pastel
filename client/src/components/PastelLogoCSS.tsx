import { cn } from "@/lib/utils";

type LogoVariant = "default" | "white" | "inverted";

export function PastelLogoCSS({
  size = 28,
  className,
  variant = "default",
}: {
  size?: number;
  className?: string;
  variant?: LogoVariant;
}) {
  const fillColor = variant === "white" || variant === "inverted" ? "#ffffff" : "currentColor";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="none"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill={fillColor} />
      <path
        d="M10 22L16 9L22 22H10Z"
        fill={variant === "white" || variant === "inverted" ? "#7C3AED" : "white"}
        opacity="0.92"
      />
      <circle
        cx="16"
        cy="24"
        r="2.5"
        fill={variant === "white" || variant === "inverted" ? "#7C3AED" : "white"}
        opacity="0.92"
      />
    </svg>
  );
}

export function PastelLogoCSSMark({
  className,
  variant = "default",
  size,
}: {
  className?: string;
  variant?: LogoVariant;
  size?: number;
}) {
  const iconVariant = variant === "inverted" ? "white" : variant;
  const textColor =
    variant === "white" || variant === "inverted" ? "text-white" : "text-foreground";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <PastelLogoCSS size={size ?? 26} variant={iconVariant} />
      <span
        className={cn(
          "text-[17px] font-medium tracking-[-0.5px] leading-[26px] antialiased",
          textColor,
        )}
      >
        Pastel
      </span>
    </div>
  );
}

export function PastelLogoCSSDark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <PastelLogoCSS size={size} className={className} />;
}

export function PastelLogoCSSMarkDark({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return <PastelLogoCSSMark className={className} size={size} />;
}
