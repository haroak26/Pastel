import { Bell, Search } from "lucide-react";
import Input from "./Input.jsx";
import Avatar from "./Avatar.jsx";

export default function Topbar({ title, subtitle, search = false, actions, user, onSearch }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95">
      <div className="pastel-frame flex h-14 items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {search && (
          <label className="relative hidden w-56 md:block">
            <span className="sr-only">Search</span>
            <Input
              icon={Search}
              placeholder="Search…"
              className="w-full"
              onChange={onSearch}
            />
          </label>
        )}
        {actions}
        {user && (
          <>
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              aria-label="Notifications"
            >
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            <span className="ml-1 flex items-center gap-2 border-l pl-3">
              <Avatar name={user.name} initials={user.initials} hue={user.hue} size={30} />
              <span className="hidden text-sm font-medium xl:block">{user.name}</span>
            </span>
          </>
        )}
      </div>
      </div>
    </header>
  );
}
