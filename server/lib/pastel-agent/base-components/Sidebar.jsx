import { LogOut } from "lucide-react";
import Avatar from "./Avatar.jsx";
import Badge from "./Badge.jsx";

export default function Sidebar({ brand, nav = [], user, activeId, onNavigate, iconOf }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {brand.slice(0, 2).toUpperCase()}
        </span>
        <span className="truncate text-base font-semibold tracking-tight">{brand}</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Primary">
        {nav.map((item) => {
          const active = item.id === activeId;
          const IconComp = iconOf?.(item.icon);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {IconComp}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && <Badge variant={active ? "secondary" : "muted"}>{item.badge}</Badge>}
            </button>
          );
        })}
      </nav>
      <div className="border-t p-3">
        {user && (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Avatar name={user.name} initials={user.initials} hue={user.hue} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.role}</p>
            </div>
            <LogOut size={15} className="text-muted-foreground" />
          </div>
        )}
      </div>
    </aside>
  );
}
