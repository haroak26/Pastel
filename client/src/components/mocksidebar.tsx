import React from "react";
import { cn } from "@/lib/utils";
import {
  Inbox, Star, Send, Archive, Trash2,
  Ticket, Clock, CircleCheck, User,
  Settings, Sparkles, Zap, ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { PastelLogoCSS } from "./PastelLogoCSS";
import { OpenIcon, InProgressIcon, ResolvedIcon, ClosedIcon, EscalatedIcon, HumanReviewIcon } from "@/pages/TicketsOpen";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  iconColor?: string;
};

const MAIL_ITEMS: NavItem[] = [
  { id: 'inbox', label: 'Inbox', href: '/home/mail', icon: Inbox },
  { id: 'inbox-starred', label: 'Starred', href: '/home/mail/starred', icon: Star },
  { id: 'inbox-sent', label: 'Sent', href: '/home/mail/sent', icon: Send },
  { id: 'inbox-archive', label: 'Archive', href: '/home/mail/archive', icon: Archive },
  { id: 'inbox-trash', label: 'Trash', href: '/home/mail/trash', icon: Trash2 },
];

const TICKET_ITEMS: NavItem[] = [
  { id: 'tickets-all', label: 'All Tickets', href: '/home/tickets', icon: Ticket },
  { id: 'tickets-my', label: 'My Tickets', href: '/home/tickets/my', icon: User },
];

const STATUS_ITEMS: NavItem[] = [
  { id: 'tickets-open', label: 'Open', href: '/home/tickets/open', icon: OpenIcon, iconColor: '#eab308' },
  { id: 'tickets-in-progress', label: 'In Progress', href: '/home/tickets/in-progress', icon: InProgressIcon, iconColor: '#f97316' },
  { id: 'tickets-resolved', label: 'Resolved', href: '/home/tickets/resolved', icon: ResolvedIcon, iconColor: '#22c55e' },
  { id: 'tickets-closed', label: 'Closed', href: '/home/tickets/closed', icon: ClosedIcon, iconColor: '#6b7280' },
];

const REVIEW_ITEMS: NavItem[] = [
  { id: 'reviews-human-review', label: 'Human Review', href: '/home/review/human-review', icon: HumanReviewIcon, iconColor: '#4682B4' },
  { id: 'reviews-escalated', label: 'Escalated', href: '/home/review/escalated', icon: EscalatedIcon, iconColor: '#dc2626' },
];

const ASSIGNMENT_ITEMS: NavItem[] = [
  { id: 'assignment-rules', label: 'Rules', href: '/workspace/assignment-rules', icon: Zap },
];

const CONFIGURE_ITEMS: NavItem[] = [
  { id: 'inbox-settings', label: 'Settings', href: '/home/configure/settings', icon: Settings },
  { id: 'agents', label: 'Agents', href: '/home/configure/agents', icon: Sparkles },
];

const mockSpace = {
  id: "1",
  name: "Pastel Support",
  emailAddress: "support@getlatte.app",
  senderAvatar: null,
  unreadCount: 4,
};

function Badge({ count, color }: { count: number; color?: string }) {
  if (color) {
    return (
      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[6px] text-[10px] font-semibold bg-white border mock-sidebar-badge-colored" style={{ borderColor: color, color }}>
        {count}
      </span>
    );
  }
  return (
    <span className="lds-badge-sm text-[11px] bg-brand/10 text-brand mock-sidebar-badge">{count}</span>
  );
}

function SidebarItem({ item, isActive, count }: { item: NavItem; isActive: boolean; count?: number }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        'flex items-center gap-[8px] h-[32px] px-3 rounded-[12px] transition-all duration-100 ease-out cursor-pointer select-none border',
        isActive
          ? 'bg-[hsl(var(--surface-active))] border-[hsl(var(--border-subtle))]'
          : 'border-transparent hover:bg-[hsl(var(--surface-active))] hover:border-[hsl(var(--border-subtle)/0.5)]'
      )}
    >
      {Icon && (
        <Icon
          size={15}
          strokeWidth={isActive ? 1.75 : 1.5}
          className={cn("shrink-0 leading-none transition-colors duration-100 mock-sidebar-icon", !item.iconColor && (isActive ? "text-foreground" : "text-fg-subtle"))}
          style={item.iconColor ? { color: item.iconColor } : undefined}
        />
      )}
      <span
        className={cn(
          'font-medium text-[14px] truncate flex-1 leading-snug transition-colors duration-100 inline-flex items-center',
          isActive ? 'text-foreground' : 'text-fg-muted'
        )}
      >
        {item.label}
      </span>
      {count !== undefined && count > 0 && <Badge count={count} />}
    </div>
  );
}

function Section({ title, items, counts, activeId }: { title: string; items: NavItem[]; counts?: Record<string, number>; activeId?: string }) {
  return (
    <div className="mb-[14px]">
      <div className="flex items-center gap-1.5 px-2 mb-2">
        <span className="lds-section-label shrink-0">{title}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="flex flex-col gap-[2px]">
        {items.map(item => (
          <SidebarItem key={item.id} item={item} isActive={item.id === activeId} count={counts?.[item.id]} />
        ))}
      </div>
    </div>
  );
}

function SpaceSelectorMock() {
  return (
    <div className="p-2.5">
      <div className="flex items-center gap-3 w-full min-h-[52px] pl-2 py-2 pr-3 rounded-[12px] border border-transparent">
        <div className="w-8 h-8 rounded-[6px] bg-brand mock-sidebar-brand flex items-center justify-center shrink-0">
          <PastelLogoCSS size={14} variant="white" />
        </div>
        <div className="min-w-0 text-left">
          <div className="text-[15px] font-semibold text-foreground truncate leading-tight">{mockSpace.name}</div>
          <div className="text-[12px] text-fg-faint truncate leading-tight">{mockSpace.emailAddress.split('@')[0]}@</div>
        </div>
        <ChevronsUpDown size={14} strokeWidth={1.5} className="text-fg-muted shrink-0 ml-auto" />
      </div>
    </div>
  );
}

export function MockSidebar() {
  return (
    <div className="w-[200px] min-w-[200px] h-full bg-background flex flex-col font-sans">
      <SpaceSelectorMock />

      <div className="p-[8px_9px] flex flex-col">
        <Section title="MAIL" items={MAIL_ITEMS} activeId="inbox" />

        <Section title="TICKETS" items={TICKET_ITEMS} />
        <Section title="STATUS" items={STATUS_ITEMS} counts={{ 'tickets-open': 3, 'tickets-in-progress': 7, 'tickets-resolved': 12, 'tickets-closed': 8 }} />

        <Section title="REVIEWS" items={REVIEW_ITEMS} counts={{ 'reviews-human-review': 5, 'reviews-escalated': 2 }} />

        <Section title="ASSIGNMENT" items={ASSIGNMENT_ITEMS} />
        <Section title="CONFIGURE" items={CONFIGURE_ITEMS} />
      </div>
    </div>
  );
}
