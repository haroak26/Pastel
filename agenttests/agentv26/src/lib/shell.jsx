// Generated shell — the app's only navigation chrome + icon map.
// The NavAdapter prop contract is LOCKED: nav / activeId / onNavigate come
// from deterministic run state, brand / user from DATA. Screens mount
// <NavAdapter nav="sidebar" activeId="home" onNavigate={setActive}> around
// their body — they never build their own chrome.
import { Settings as SettingsIcon, AlertCircle, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronDown, Clock, CreditCard, Download, Edit, FileText, Filter, Heart, Home, Image, LineChart, List, Mail, MapPin, MoreHorizontal, Play, Plus, Search, Star, TrendingUp, Users, Zap } from "lucide-react";
import { DATA } from "../data.js";

export function IconOf({ name, className = "h-4 w-4" }) {
  const icons = {
    home: <Home className={className} />,
    list: <List className={className} />,
    chart: <LineChart className={className} />,
    settings: <SettingsIcon className={className} />,
    users: <Users className={className} />,
    bell: <Bell className={className} />,
    search: <Search className={className} />,
    plus: <Plus className={className} />,
    download: <Download className={className} />,
    filter: <Filter className={className} />,
    arrowRight: <ArrowRight className={className} />,
    mail: <Mail className={className} />,
    alert: <AlertCircle className={className} />,
    file: <FileText className={className} />,
    edit: <Edit className={className} />,
    check: <CheckCircle2 className={className} />,
    zap: <Zap className={className} />,
    card: <CreditCard className={className} />,
    trendingUp: <TrendingUp className={className} />,
    play: <Play className={className} />,
    heart: <Heart className={className} />,
    mapPin: <MapPin className={className} />,
    star: <Star className={className} />,
    clock: <Clock className={className} />,
    image: <Image className={className} />,
    more: <MoreHorizontal className={className} />,
    chevronDown: <ChevronDown className={className} />,
    calendarDays: <CalendarDays className={className} />,
  };
  return icons[name] ?? null;
}

export function NavAdapter({ nav, activeId, onNavigate, children }) {
  const hasSidebar = nav === "sidebar" || nav === "sidebar+topbar";
  const hasTopbar = nav === "topbar" || nav === "sidebar+topbar";
  if (!hasSidebar && !hasTopbar) return <>{children}</>;
  const brand = DATA.brand.name;
  const user = DATA.user;

  const topbarInner = hasTopbar ? (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">{brand.slice(0, 1)}</span>
      <span className="hidden truncate font-semibold sm:inline" style={{ fontFamily: "var(--font-display)" }}>{brand}</span>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-2">
        <span aria-label={user.name} className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>{user.initials}</span>
        <span className="hidden text-sm font-medium md:inline">{user.name}</span>
      </div>
    </header>
  ) : null;

  if (!hasSidebar) {
    return (
      <>
        {topbarInner}
        <main className="w-full min-w-0">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <span className="flex h-16 items-center gap-2 px-6" aria-hidden="true">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground">{brand.slice(0, 1)}</span>
          <span className="truncate font-semibold" style={{ fontFamily: "var(--font-display)" }}>{brand}</span>
        </span>
        <nav className="mt-2 flex-1 space-y-1 px-4" aria-label="Primary navigation">
          {DATA.nav.map((item) => {
            const current = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={current ? "page" : undefined}
                className={"flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " + (current ? "bg-muted/50 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground")}
              >
                <IconOf name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <span aria-label={user.name} className="flex h-[var(--control-sm)] w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>{user.initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {topbarInner}
        <main className="w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
