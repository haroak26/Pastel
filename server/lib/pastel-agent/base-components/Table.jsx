export function Table({ className = "", ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = "", ...props }) {
  return <thead className={`[&_tr]:border-b ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />;
}

export function TableRow({ className = "", ...props }) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = "", ...props }) {
  return <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />;
}

export default Table;
