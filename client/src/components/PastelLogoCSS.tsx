import { cn } from "@/lib/utils";

type LogoVariant = "default" | "white" | "inverted";

export function PastelLogoCSS({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
  variant?: LogoVariant;
}) {
  return (
    <img
      src="/PastelIcon.svg"
      alt="Pastel"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function PastelLogoCSSMark({
  className,
  size,
}: {
  className?: string;
  variant?: LogoVariant;
  size?: number;
}) {
  const h = size ?? 20;
  return (
    <div className={cn("inline-flex items-center", className)}>
      <img
        src="/PastelLogo.svg"
        alt="Pastel"
        height={h}
        className="w-auto shrink-0"
      />
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
