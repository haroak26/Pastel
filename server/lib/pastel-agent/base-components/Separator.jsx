export function Separator({ orientation = "horizontal", className = "" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={`shrink-0 bg-border ${orientation === "horizontal" ? "h-px w-full" : "h-full w-px"} ${className}`}
    />
  );
}

export default Separator;
