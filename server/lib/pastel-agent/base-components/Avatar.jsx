export default function Avatar({ name, initials, hue = 210, size = 36, className = "" }) {
  // Token-only tint: the chart palette mixed into the card surface — no raw
  // hex/HSL, so the avatar always matches the theme (v9 token discipline).
  const n = (((hue % 6) + 6) % 6) + 1;
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.34),
        backgroundColor: `color-mix(in srgb, var(--chart-${n}) 28%, var(--card))`,
        color: "var(--card-foreground)",
      }}
      title={name}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
