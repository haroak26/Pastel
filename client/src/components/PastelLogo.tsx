import { cn } from "@/lib/utils";
import {
  PastelLogoCSS,
  PastelLogoCSSMark,
  PastelLogoCSSDark,
  PastelLogoCSSMarkDark,
} from "@/components/PastelLogoCSS";

export { PastelLogoCSS, PastelLogoCSSMark, PastelLogoCSSDark, PastelLogoCSSMarkDark };

interface PastelLogoProps {
  size?: number;
  className?: string;
}

export function PastelLogo({ size = 20, className }: PastelLogoProps) {
  return <PastelLogoCSS size={size} className={className} />;
}

interface PastelLogoMarkProps {
  className?: string;
  variant?: "default" | "white" | "inverted";
}

export function PastelLogoMark({ className, variant = "default" }: PastelLogoMarkProps) {
  return <PastelLogoCSSMark className={className} variant={variant} />;
}

export function PastelLogoDark({ size = 20, className }: { size?: number; className?: string }) {
  return <PastelLogoCSS size={size} className={className} />;
}

export function PastelLogoMarkDark({ className, size }: { className?: string; size?: number }) {
  return <PastelLogoCSSMarkDark className={className} size={size} />;
}
