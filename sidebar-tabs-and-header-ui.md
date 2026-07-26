# Sidebar Tab UI & Header UI

## 1. Sidebar Types

File: `client/src/components/sidebar/types.ts`

```tsx
import type { ElementType } from 'react';

export type PrimarySection = {
  id: string;
  label: string;
  icon: ElementType;
  href: string;
  adminOnly?: boolean;
};

export type SubNavItem = {
  id: string;
  label: string;
  href: string;
  count?: number;
};

export type SectionConfig = {
  primary: PrimarySection;
  getSubItems: (counts: Record<string, number>) => SubNavItem[];
};
```

---

## 2. Primary Rail (Sidebar Tabs UI)

File: `client/src/components/sidebar/PrimaryRail.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { PrimarySection } from './types';
import {
  InboxIcon, Book03Icon, AiBrain01Icon,
  UserGroupIcon, Settings01Icon, UserIcon,
  CreditCardIcon, GridIcon, Logout01Icon,
} from 'hugeicons-react';
import { Route, GitCommit, ListChecks, Ticket, Globe } from 'lucide-react';
import { useUser, useLogout } from '@/hooks/use-user';
import { useWorkspace } from '@/contexts/workspace-context';

export const ALL_SECTIONS: PrimarySection[] = [
  { id: 'inbox',     label: 'Inbox',     icon: InboxIcon,    href: '/home/mail' },
  { id: 'tickets',   label: 'Tickets',   icon: Ticket,       href: '/home/tickets' },
  { id: 'knowledge', label: 'Knowledge Base', icon: Book03Icon,   href: '/home/knowledge' },
  { id: 'tasks',     label: 'Tasks',     icon: ListChecks,   href: '/home/tasks' },
  { id: 'roadmap',   label: 'Roadmap',   icon: Route,        href: '/home/roadmap' },
  { id: 'changelog', label: 'Changelog', icon: GitCommit,    href: '/home/changelog' },
];

export const ADMIN_SECTIONS: PrimarySection[] = [
  { id: 'agents',   label: 'Agents',   icon: AiBrain01Icon,   href: '/home/configure/agents', adminOnly: true },
  { id: 'team',     label: 'Team',     icon: UserGroupIcon,   href: '/workspace/team',         adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings01Icon,  href: '/workspace/settings',     adminOnly: true },
];

const ICON_SIZE = 15;

export function getActivePrimaryId(location: string): string {
  if (location.startsWith('/home/mail')) return 'inbox';
  if (location.startsWith('/home/tickets')) return 'tickets';
  if (location.startsWith('/home/review/human-review') || location.startsWith('/home/review/escalated')) return 'inbox';
  if (location.startsWith('/home/review/bug')) return 'bugs';
  if (location.startsWith('/home/review/feature')) return 'features';
  if (location.startsWith('/home/roadmap')) return 'roadmap';
  if (location.startsWith('/home/changelog')) return 'changelog';
  if (location.startsWith('/home/knowledge')) return 'knowledge';
  if (location.startsWith('/home/tasks')) return 'tasks';
  if (location.startsWith('/home/configure/agents')) return 'agents';
  if (location.startsWith('/workspace/team')) return 'team';
  if (location.startsWith('/portal')) return 'portal';
  if (location.startsWith('/workspace') || location.startsWith('/home/configure')) return 'settings';
  if (location.startsWith('/account')) return 'account';
  return 'inbox';
}

function TabIcon({ isActive, icon: Icon }: { isActive: boolean; icon: React.ElementType }) {
  return (
    <div className={cn(
      'group flex items-center justify-center h-[32px] w-[32px] rounded-[10px] transition-all cursor-pointer',
      isActive
        ? 'bg-[hsl(var(--surface-active))] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
        : 'hover:bg-[hsl(var(--surface-active))] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
    )}>
      <Icon
        size={ICON_SIZE}
        strokeWidth={isActive ? 2 : 1.5}
        className={cn(
          "transition-colors duration-100",
          isActive ? "text-foreground" : "text-fg-subtle group-hover:text-foreground"
        )}
      />
    </div>
  );
}

export function PrimaryRail({
  activeId,
  isAdmin,
}: {
  activeId: string;
  isAdmin: boolean;
}) {
  const [location] = useLocation();
  const { data: user } = useUser();
  const logout = useLogout();
  const { activeWorkspace } = useWorkspace();
  const currentActive = activeId || getActivePrimaryId(location);
  const [, navigate] = useLocation();

  const lowerSectionOrder = ['knowledge', 'changelog', 'roadmap', 'agents'];
  const lowerSectionIds = new Set(lowerSectionOrder);
  const primarySections = [...ALL_SECTIONS, ...(isAdmin ? ADMIN_SECTIONS : [])];
  const sections = primarySections.filter((section) => !lowerSectionIds.has(section.id));
  const lowerSections = lowerSectionOrder
    .map((id) => primarySections.find((section) => section.id === id))
    .filter((section): section is PrimarySection => Boolean(section));

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [accountMenuPos, setAccountMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [tooltipLabel, setTooltipLabel] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>();

  const showTooltip = (label: string, e: React.MouseEvent) => {
    clearTimeout(tooltipTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ top: rect.top + rect.height / 2 - 14, left: rect.right + 8 });
    setTooltipLabel(label);
  };

  const hideTooltip = () => {
    tooltipTimeout.current = setTimeout(() => {
      setTooltipLabel(null);
      setTooltipPos(null);
    }, 80);
  };

  useEffect(() => {
    if (!accountDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (accountDropdownOpen && accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountDropdownOpen]);

  const handleAccountClick = () => {
    if (accountRef.current) {
      const r = accountRef.current.getBoundingClientRect();
      setAccountMenuPos({ bottom: r.top - 8, left: r.left + r.width });
    }
    setAccountDropdownOpen(prev => !prev);
  };

  return (
    <div className="w-[52px] h-full min-h-0 bg-background border-r border-border flex flex-col items-center pt-3 pb-3 shrink-0 overflow-x-hidden overscroll-none">
      <Link href="/home/mail" className="mb-4 shrink-0 flex items-center justify-center w-[32px] h-[32px]">
        <svg viewBox="470 740 2300 1860" className="w-[32px] h-[32px] fill-[hsl(var(--brand))]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <path d="M 957.500 974.048 C 889.538 978.782, 827.135 1016.953, 790.371 1076.280 C 772.757 1104.703, 759.949 1145.131, 759.607 1173.387 L 759.500 1182.273 1189.330 1325.527 L 1619.000 1468.781 2048.670 1325.527 L 2478.500 1182.273 C 2478.051 1145.131, 2465.243 1104.703, 2447.629 1076.280 C 2410.865 1016.953, 2348.462 978.782, 2280.500 974.048 C 2190.000 973.700, 1900.000 973.500, 1619.000 973.400 C 1338.000 973.500, 1048.000 973.700, 957.500 974.048 M 759.572 1686.750 C 759.638 2011.126, 759.779 2040.546, 761.325 2052.500 C 769.222 2113.555, 790.832 2169.475, 825.098 2217.517 C 884.291 2300.508, 973.931 2353.631, 1076 2366.206 C 1091.469 2368.112, 2146.495 2368.115, 2162 2366.209 C 2334 2345.069, 2465.588 2207.461, 2477.943 2035.813 C 2479.254 2017.594, 2479.437 1334, 2478.130 1334 C 2477.652 1334, 2287.414 1397.323, 2055.380 1474.718 L 1633.500 1615.436 1619 1615.428 L 1604.500 1615.419 1182.746 1474.709 C 950.782 1397.319, 760.657 1334, 760.246 1334 C 759.836 1334, 759.532 1492.738, 759.572 1686.750 M 901.011 1793.750 C 901.669 2081.511, 901.611 2076.824, 904.674 2091.840 C 918.542 2159.818, 976.504 2212.433, 1045.799 2219.947 C 1059.553 2221.439, 2179.841 2221.422, 2193.377 2219.930 C 2263.046 2212.251, 2318.553 2161.435, 2334.757 2090.500 L 2337.042 2080.500 2337.329 1799.250 C 2337.486 1644.563, 2337.328 1518, 2336.978 1518 C 2336.627 1518, 2180.795 1573.350, 1990.685 1641 L 1645.031 1764 1619.000 1764 L 1594.135 1764 1248.482 1641 C 1058.374 1573.350, 902.279 1518, 901.605 1518 C 900.641 1518, 900.514 1576.499, 901.011 1793.750" fill-rule="evenodd" />
        </svg>
      </Link>

      <div className="flex-1 min-h-0 flex flex-col items-center gap-1 w-full px-2 overflow-y-auto scrollbar-none">
        {sections.map((section) => (
          <Link key={section.id} href={section.href}>
            <div onMouseEnter={(e) => showTooltip(section.label, e)} onMouseLeave={hideTooltip}>
              <TabIcon isActive={currentActive === section.id} icon={section.icon} />
            </div>
          </Link>
        ))}
        {activeWorkspace && (
          <Link href={`/portal/${activeWorkspace.id}`}>
            <div onMouseEnter={(e) => showTooltip('Customer Portal', e)} onMouseLeave={hideTooltip}>
              <TabIcon isActive={currentActive === 'portal'} icon={Globe} />
            </div>
          </Link>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center gap-1 w-full px-2 mt-auto pb-2 bg-background">
        {lowerSections.map((section) => (
          <Link key={section.id} href={section.href}>
            <div onMouseEnter={(e) => showTooltip(section.label, e)} onMouseLeave={hideTooltip}>
              <TabIcon isActive={currentActive === section.id} icon={section.icon} />
            </div>
          </Link>
        ))}
        <div className="w-full px-3">
          <div className="h-px bg-border/60" />
        </div>
        <div ref={accountRef} onClick={handleAccountClick} onMouseEnter={(e) => showTooltip('Account', e)} onMouseLeave={hideTooltip}>
          <TabIcon isActive={currentActive === 'account'} icon={UserIcon} />
        </div>
      </div>

      {tooltipLabel && tooltipPos && createPortal(
        <div
          className="fixed z-[9999] px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold whitespace-nowrap shadow-lg pointer-events-none"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          {tooltipLabel}
        </div>,
        document.body
      )}

      {accountDropdownOpen && accountMenuPos && createPortal(
        <div
          className="fixed z-50"
          style={{ bottom: window.innerHeight - accountMenuPos.bottom, left: accountMenuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="w-[190px] bg-background border border-border rounded-[12px] p-1.5 shadow-xl animate-in fade-in duration-150">
            <Link
              href="/account/profile"
              onClick={() => { setAccountDropdownOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-[hsl(var(--surface-hover)/0.6)] transition-all duration-100 ease-out"
            >
              <UserIcon size={16} />
              Profile
            </Link>
            <Link
              href="/account/billing"
              onClick={() => { setAccountDropdownOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-[hsl(var(--surface-hover)/0.6)] transition-all duration-100 ease-out"
            >
              <CreditCardIcon size={16} />
              Billing
            </Link>
            <Link
              href="/workspace/settings"
              onClick={() => { setAccountDropdownOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-[hsl(var(--surface-hover)/0.6)] transition-all duration-100 ease-out"
            >
              <GridIcon size={16} />
              Workspace
            </Link>
            <Link
              href="/account"
              onClick={() => { setAccountDropdownOpen(false); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-[hsl(var(--surface-hover)/0.6)] transition-all duration-100 ease-out"
            >
              <Settings01Icon size={16} />
              Account
            </Link>
            <div className="my-1 mx-1 h-px bg-border/60" />
            <button
              onClick={() => { setAccountDropdownOpen(false); logout.mutate(); }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-danger hover:bg-danger/5 transition-all duration-100 ease-out border-none bg-transparent cursor-pointer"
            >
              <Logout01Icon size={16} />
              Sign out
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
```

---

## 3. Icon + Text Tab Row (SubItemRow)

File: `client/src/components/sidebar/SecondaryPanel.tsx`

```tsx
type SubItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  iconColor?: string;
};

function SubItemRow({ item, location }: { item: SubItem; location: string }) {
  const forceActiveId = useForceActive();
  const active = isActive(location, item.href) || forceActiveId === item.id;
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <div
        className={cn(
          'flex items-center gap-[8px] h-[32px] px-3 rounded-[12px] transition-all duration-100 ease-out cursor-pointer select-none',
          active
            ? 'bg-[hsl(var(--surface-active))] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
            : 'hover:bg-[hsl(var(--surface-active))]'
        )}
      >
        {Icon && (
          <Icon
            size={15}
            strokeWidth={active ? 1.75 : 1.5}
            className={cn("shrink-0 leading-none transition-colors duration-100", active ? "text-foreground" : "text-fg-muted")}
            style={item.iconColor ? { color: item.iconColor } : undefined}
          />
        )}
        <span
          className={cn(
            'font-medium text-[14px] truncate flex-1 leading-snug transition-colors duration-100',
            active ? 'text-foreground' : 'text-fg-muted'
          )}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 mb-2">
      <span className="lds-section-label shrink-0 text-[11px] font-semibold text-brand tracking-wider uppercase">{children}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}
```

**Styling breakdown for `SubItemRow` (individual icon+text tab):**

| Property | Inactive | Active |
|---|---|---|
| **Layout** | `flex items-center gap-[8px] h-[32px] px-3` | same |
| **Border radius** | `rounded-[12px]` | `rounded-[12px]` |
| **Background** | transparent, `hover:bg-[hsl(var(--surface-active))]` | `bg-[hsl(var(--surface-active))]` |
| **Border** | none | `1px solid black/0.06` |
| **Shadow** | none | `0 1px 2px rgba(0,0,0,0.04)` |
| **Icon size** | `15` | `15` |
| **Icon stroke** | `1.5` | `1.75` |
| **Icon color** | `text-fg-muted` (or `item.iconColor`) | `text-foreground` (or `item.iconColor`) |
| **Text size** | `text-[14px] font-medium` | same |
| **Text color** | `text-fg-muted` | `text-foreground` |
| **Transition** | `all duration-100 ease-out` | same |

**Usage example:**
```tsx
<SubItemRow
  item={{
    id: 'tickets-open',
    label: 'Open',
    href: '/home/tickets/open',
    icon: OpenIcon,
    iconColor: '#eab308'
  }}
  location={location}
/>
```

---

## 4. Header UI (PageHeader) & Page Shell

File: `client/src/components/ds/layout.tsx`

```tsx
import React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/button";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/* ──────────────────────────────────────────────────────────────────────────
   1) IN-APP PAGE SHELL
   Every dashboard/app page renders inside <AppLayout>; then the body is:
     <AppPage>
       <AppTopbar title="Open Tickets" actions={...} />
       <AppBody>  (or <AppBodyPadded>)
         ...content
       </AppBody>
     </AppPage>
   ────────────────────────────────────────────────────────────────────────── */

export function AppPage({ className, ...props }: DivProps) {
  return (
    <div
      {...props}
      className={cn("flex h-full min-h-0 flex-col bg-background page-enter", className)}
    />
  );
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ElementType;
  iconColor?: string;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, iconColor, actions, leading, className }: PageHeaderProps) {
  return (
    <header className={cn("lds-app-topbar", className)}>
      <div className="lds-app-topbar-row">
        <div className="flex min-w-0 items-center">
          <div className="flex min-w-0 items-center gap-2 flex-1">
            {leading}
            <span className="lds-app-title truncate">{title}</span>
            {subtitle && (
              <span className="text-[12.5px] text-fg-subtle truncate">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </div>
      <div className="lds-app-topbar-divider" />
    </header>
  );
}

/** @deprecated — use PageHeader instead */
export const AppTopbar = PageHeader;

export function AppBody({ className, ...props }: DivProps) {
  return (
    <div
      {...props}
      className={cn("flex-1 min-h-0 overflow-y-auto overflow-x-hidden", className)}
    />
  );
}

export function AppBodyPadded({ className, children, ...props }: DivProps) {
  return (
    <AppBody {...props} className={className}>
      <div className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-8">
        {children}
      </div>
    </AppBody>
  );
}

export function AppBodyNarrow({ className, children, ...props }: DivProps) {
  return (
    <AppBody {...props} className={className}>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {children}
      </div>
    </AppBody>
  );
}
```

---

## 5. Radix UI Tabs (Generic Tabs Component)

File: `client/src/components/ui/tabs.tsx`

```tsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-md border border-amber-border bg-amber-muted p-1 text-fg-muted",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[9px] px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-transparent hover:bg-amber-muted hover:text-amber hover:border-amber-border data-[state=active]:bg-amber-muted data-[state=active]:text-amber data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-amber-border [&_svg]:pointer-events-none [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

---

## Usage

### Page Shell Pattern
```tsx
import { AppPage, PageHeader, AppBodyPadded } from '@/components/ds/layout';

function MyPage() {
  return (
    <AppPage>
      <PageHeader title="My Page" actions={<Button>Action</Button>} />
      <AppBodyPadded>
        <p>Content here</p>
      </AppBodyPadded>
    </AppPage>
  );
}
```

### Sidebar Usage
```tsx
import { PrimaryRail, getActivePrimaryId } from '@/components/sidebar/PrimaryRail';

function AppLayout() {
  const [location] = useLocation();
  const activeId = getActivePrimaryId(location);
  return <PrimaryRail activeId={activeId} isAdmin={true} />;
}
```

### Radix Tabs Usage
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function MyTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  );
}
```
