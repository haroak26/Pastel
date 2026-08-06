/** Price summary card — the detail page's conversion moment. */
export default function PriceCard({ name = "", price = "", suffix = "", meta = [], cta = "Reserve", onAction = null, className = "" }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {price}
          <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
        </span>
        <span className="text-xs font-medium text-success">{name}</span>
      </div>
      <dl className="mt-4 space-y-2.5 border-t pt-4 text-sm">
        {(meta ?? []).slice(0, 4).map((row) => (
          <div key={row?.label} className="flex items-center justify-between">
            <dt className="text-muted-foreground">{row?.label}</dt>
            <dd className="font-medium tabular-nums">{row?.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => onAction?.()}
        className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.99]"
      >
        {cta}
      </button>
    </div>
  );
}
