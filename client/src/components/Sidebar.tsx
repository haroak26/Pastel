import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  UserGroupIcon, UserIcon,
  CreditCardIcon, GridIcon, InboxIcon,
  GroupLayersIcon, Image01Icon, ArrowLeft01Icon,
} from 'hugeicons-react';
import { Shield, BarChart3, AlertTriangle, UserPlus } from 'lucide-react';

type Tab = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
};

const MAIN_TABS: Tab[] = [
  { id: 'design',      label: 'Design',      icon: GridIcon,         href: '/home' },
  { id: 'projects',    label: 'Projects',    icon: InboxIcon,        href: '/home/projects' },
  { id: 'components',  label: 'Components',  icon: GroupLayersIcon,  href: '/home/components' },
  { id: 'assets',      label: 'Assets',      icon: Image01Icon,      href: '/home/assets' },
];

const TEAM_TABS: Tab[] = [
  { id: 'manage',  label: 'Manage',  icon: UserGroupIcon, href: '/workspace/team' },
  { id: 'invite',  label: 'Invite',  icon: UserPlus,      href: '/workspace/team/invite' },
];

const ACCOUNT_TABS: Tab[] = [
  { id: 'account-profile',  label: 'Profile',         href: '/account/profile',       icon: UserIcon },
  { id: 'account-security', label: 'Security & Auth',  href: '/account/security-auth', icon: Shield },
  { id: 'account-billing',  label: 'Billing',          href: '/account/billing',       icon: CreditCardIcon },
  { id: 'account-credits',  label: 'Credits',          href: '/account/credits',       icon: CreditCardIcon },
  { id: 'account-usage',    label: 'Usage',            href: '/account/usage',         icon: BarChart3 },
  { id: 'account-actions',  label: 'Danger Zone',      href: '/account/actions',       icon: AlertTriangle },
];

function useActiveTab(): string {
  const [location] = useLocation();
  if (location === '/home' || location.startsWith('/home/design')) return 'design';
  if (location.startsWith('/home/projects')) return 'projects';
  if (location.startsWith('/home/components')) return 'components';
  if (location.startsWith('/home/assets')) return 'assets';
  if (location.startsWith('/workspace/team/invite')) return 'invite';
  if (location.startsWith('/workspace/team')) return 'manage';
  if (location.startsWith('/workspace')) return 'manage';
  if (location.startsWith('/account/profile')) return 'account-profile';
  if (location.startsWith('/account/security-auth')) return 'account-security';
  if (location.startsWith('/account/billing')) return 'account-billing';
  if (location.startsWith('/account/credits')) return 'account-credits';
  if (location.startsWith('/account/usage')) return 'account-usage';
  if (location.startsWith('/account/actions')) return 'account-actions';
  if (location.startsWith('/account')) return 'account-profile';
  return 'design';
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-4 mb-3 mt-3 first:mt-0">
      <span className="text-[10px] font-semibold text-fg-faint uppercase tracking-wider">{children}</span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

function TabRow({ tabs, activeTab, onNavigate }: { tabs: Tab[]; activeTab: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <Link key={tab.id} href={tab.href} onClick={onNavigate}>
            <div
              className={cn(
                'flex items-center gap-[6px] h-[32px] px-[12px] rounded-[10px] text-[14px] font-medium cursor-pointer select-none transition-all duration-100',
                isActive
                  ? 'bg-surface-hover text-foreground'
                  : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'
              )}
            >
              {Icon && (
                <Icon
                  size={15}
                  strokeWidth={1.5}
                  className={cn("shrink-0", isActive ? "text-foreground" : "text-fg-muted")}
                />
              )}
              <span className="leading-snug">{tab.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarContent({ location: _location, onNavigate, collapsed }: { location: string; onNavigate?: () => void; collapsed?: boolean }) {
  const activeTab = useActiveTab();
  const isAccountPage = activeTab.startsWith('account-');

  if (collapsed) return null;

  return (
    <div className="h-full bg-background border-r border-border flex flex-col overflow-hidden">
      {/* Logo area */}
      <Link
        href="/home"
        className="shrink-0 flex items-center gap-2.5 px-4 h-[52px] text-brand border-b border-border"
      >
        {isAccountPage ? (
          <ArrowLeft01Icon size={18} className="text-fg-muted" />
        ) : (
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="currentColor" />
            <path d="M10 22L16 9L22 22H10Z" fill="white" opacity="0.92" />
            <circle cx="16" cy="24" r="2.5" fill="white" opacity="0.92" />
          </svg>
        )}
        <span className="text-[15px] font-semibold text-foreground">
          {isAccountPage ? 'Account' : 'Pastel'}
        </span>
      </Link>

      {/* Navigation tabs */}
      <div className="flex-1 overflow-y-auto scrollbar-none pt-5 flex flex-col">
        {isAccountPage ? (
          <div className="flex-1 flex flex-col">
            <SectionHeader>Account</SectionHeader>
            <TabRow tabs={ACCOUNT_TABS} activeTab={activeTab} onNavigate={onNavigate} />
            <div className="flex-1" />
            <div className="px-4 py-2">
              <Link href="/home/design" onClick={onNavigate}>
                <div className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[10px] text-[14px] font-medium cursor-pointer select-none transition-all duration-100 text-fg-muted hover:text-foreground hover:bg-surface-hover">
                  <GridIcon size={15} strokeWidth={1.5} className="shrink-0 text-fg-muted" />
                  <span className="leading-snug">Back to home</span>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-1">
              <SectionHeader>Main</SectionHeader>
              <TabRow tabs={MAIN_TABS} activeTab={activeTab} onNavigate={onNavigate} />
            </div>
            <div className="space-y-1 mt-5">
              <SectionHeader>Team</SectionHeader>
              <TabRow tabs={TEAM_TABS} activeTab={activeTab} onNavigate={onNavigate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
