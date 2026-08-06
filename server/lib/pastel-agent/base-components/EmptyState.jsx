import Button from "./Button.jsx";

export default function EmptyState({ icon, title, body, action }) {
  const IconComp = icon;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {IconComp && (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <IconComp size={22} />
        </span>
      )}
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
