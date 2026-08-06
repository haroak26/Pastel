export default function PageHeader({ overline, title, description, actions, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 pb-6 ${className}`}>
      <div className="min-w-0">
        {overline && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{overline}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
