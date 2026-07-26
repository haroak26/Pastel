import React, { createContext, useContext } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { UserIcon, CreditCardIcon } from 'hugeicons-react';
import { Users, Settings } from 'lucide-react';

const ForceActiveContext = createContext<string | null>(null);
function useForceActive() { return useContext(ForceActiveContext); }

type SubItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  iconColor?: string;
};

function isActive(location: string, href: string): boolean {
  if (href === '/home') return location === '/home';
  return location === href;
}

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

function DesignPanel() {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-[2px]">
      <SectionLabel>Canvas</SectionLabel>
      <SubItemRow item={{ id: 'design', label: 'Design', href: '/home/design' }} location={location} />
      <div className="h-2" />
      <SectionLabel>Projects</SectionLabel>
      <SubItemRow item={{ id: 'projects', label: 'All Projects', href: '/home/projects' }} location={location} />
    </div>
  );
}

function ProjectsPanel() {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-[2px]">
      <SectionLabel>Projects</SectionLabel>
      <SubItemRow item={{ id: 'projects-all', label: 'All Projects', href: '/home/projects' }} location={location} />
    </div>
  );
}

function TeamPanel() {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-[2px]">
      <SectionLabel>People</SectionLabel>
      <SubItemRow item={{ id: 'team-members', label: 'Members', href: '/workspace/team', icon: Users }} location={location} />
    </div>
  );
}

function SettingsPanel() {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-[2px]">
      <SectionLabel>Workspace</SectionLabel>
      <SubItemRow item={{ id: 'ws-settings', label: 'Settings', href: '/workspace/settings', icon: Settings }} location={location} />
      <SubItemRow item={{ id: 'ws-team', label: 'Team', href: '/workspace/team', icon: Users }} location={location} />
    </div>
  );
}

function AccountPanel() {
  const [location] = useLocation();
  return (
    <div className="flex flex-col gap-[2px]">
      <SectionLabel>Account</SectionLabel>
      <SubItemRow item={{ id: 'account-profile', label: 'Profile', href: '/account/profile', icon: UserIcon }} location={location} />
      <SubItemRow item={{ id: 'account-security', label: 'Security & Auth', href: '/account/security-auth' }} location={location} />
      <SubItemRow item={{ id: 'account-billing', label: 'Billing', href: '/account/billing', icon: CreditCardIcon }} location={location} />
      <SubItemRow item={{ id: 'account-usage', label: 'Usage', href: '/account/usage' }} location={location} />
      <SubItemRow item={{ id: 'account-actions', label: 'Danger Zone', href: '/account/actions' }} location={location} />
    </div>
  );
}

const PANELS: Record<string, React.FC> = {
  design: DesignPanel,
  projects: ProjectsPanel,
  team: TeamPanel,
  settings: SettingsPanel,
  account: AccountPanel,
};

export function SecondaryPanel({ activeSectionId, forceActiveId }: { activeSectionId: string; forceActiveId?: string }) {
  const Panel = PANELS[activeSectionId];
  if (!Panel) return null;

  return (
    <ForceActiveContext.Provider value={forceActiveId ?? null}>
      <div className="flex-1 h-full bg-background flex flex-col overflow-hidden">
        <div key={activeSectionId} className="flex-1 overflow-y-auto scrollbar-none p-[8px_9px] pt-4 animate-in fade-in duration-150">
          <Panel />
        </div>
      </div>
    </ForceActiveContext.Provider>
  );
}
