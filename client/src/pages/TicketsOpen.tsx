import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { ArrowUpRight, CheckCircle2, Clock, Bug, Lightbulb, Inbox, UserCheck, AlertTriangle, Search, ChevronDown, X, Check, Trash2, User, Tags, Filter, ChevronsUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, PillFilter, TagPicker, Dropdown, EmptyState, ListSkeleton, ContentPanel, type TagPickerTag } from "@/components/ds";
import { Button } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { useSpace } from '@/contexts/space-context';
import { useUser } from '@/hooks/use-user';

export type Ticket = {
  id: number;
  userId: number;
  ticketId: string;
  publicId: number | null;
  inboxId: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string | null;
  status: string;
  subStatus?: string | null;
  threadId: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_OPTIONS: { value: 'bug' | 'feature-request' | 'improvement'; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'bug', label: 'Bug', icon: Bug, color: '#DC2B2B' },
  { value: 'feature-request', label: 'Feature Request', icon: Lightbulb, color: '#8b5cf6' },
  { value: 'improvement', label: 'Improvement', icon: ArrowUpRight, color: '#06b6d4' },
];

export const TICKET_STATUSES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  'open': { label: 'Open', icon: Inbox, color: '#E78A13' },
  'in_progress': { label: 'In Progress', icon: Inbox, color: '#4682B4' },
  'resolved': { label: 'Resolved', icon: CheckCircle2, color: '#1F9D69' },
  'closed': { label: 'Closed', icon: Inbox, color: '#6B6F76' },
};

const STATUS_TITLE: Record<string, string> = {
  'open': 'Open Tickets',
  'in_progress': 'In Progress',
  'resolved': 'Resolved Tickets',
  'closed': 'Closed Tickets',
};

const STATUS_EMPTY: Record<string, { title: string; desc: string }> = {
  'open': { title: 'No open tickets', desc: 'New tickets will appear here when customers email your support inbox.' },
  'in_progress': { title: 'No tickets in progress', desc: 'Active conversations with customers will appear here.' },
  'resolved': { title: 'No resolved tickets yet', desc: 'Once you resolve tickets they\'ll stay here for reporting and reference.' },
  'closed': { title: 'No closed tickets', desc: 'Tickets that have been closed will appear here.' },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfD) / 86400000);
  if (diffDays <= 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Status icon SVGs ─────────────────────────────────────────────────

export function OpenIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function InProgressIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7.5 A4.5 4.5 0 0 0 12 16.5 L12 12 Z" fill="currentColor" />
    </svg>
  );
}

export function ResolvedIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M8 12.5l2.5 2.5 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EscalatedIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M12 7v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.5" fill="white" />
    </svg>
  );
}

export function HumanReviewIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="12" cy="8.5" r="3" fill="white" />
      <path d="M5 22c0-4.5 3.1-7.5 7-7.5s7 3 7 7.5" fill="white" />
    </svg>
  );
}

export function ClosedIcon({ size = 22, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Ticket Row ───────────────────────────────────────────────────────────

function TicketRow({ ticket, isActive, onClick, selected, onToggleSelect, onStatusChange, showBulk }: {
  ticket: Ticket;
  isActive: boolean;
  onClick: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  onStatusChange?: (status: string) => void;
  showBulk?: boolean;
}) {
  const queryClient = useQueryClient();
  const { activeSpaceId } = useSpace();
  const statusInfo = TICKET_STATUSES[ticket.status] ?? TICKET_STATUSES['open'];
  const sender = ticket.fromName || ticket.fromEmail;
  const time = formatTime(ticket.createdAt);
  const [statusOpen, setStatusOpen] = useState(false);

  const subStatusLabels: Record<string, string> = {
    waiting_on_customer: 'Waiting on Customer',
    waiting_on_support: 'Waiting on Support',
  };
  const subLabel = ticket.subStatus ? subStatusLabels[ticket.subStatus] : null;

  const statusIcon = () => {
    switch (ticket.status) {
      case 'open': return <OpenIcon />;
      case 'in_progress': return <InProgressIcon />;
      case 'resolved': return <ResolvedIcon />;
      case 'closed': return <ClosedIcon />;
      default: return <OpenIcon />;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', activeSpaceId] });
    } catch {}
    setStatusOpen(false);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-4 sm:px-6 py-3.5 cursor-pointer transition-colors duration-100 border-b border-border/60',
        'hover:bg-surface-active',
        isActive && 'bg-surface-active',
      )}
    >
      {showBulk && (
        <div className="shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-border accent-brand cursor-pointer"
          />
        </div>
      )}

      {/* Status icon — clickable for inline status change */}
      <div className="shrink-0 relative" style={{ color: statusInfo.color }} onClick={e => { e.stopPropagation(); setStatusOpen(!statusOpen); }}>
        {statusIcon()}
        {statusOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-background border border-border rounded-[12px] p-1 min-w-[140px] shadow-lg" onClick={e => e.stopPropagation()}>
            {Object.entries(TICKET_STATUSES).map(([key, s]) => (
              <button
                key={key}
                onClick={async () => {
                  if (key !== ticket.status) {
                    if (onStatusChange) onStatusChange(key);
                    else await handleStatusChange(key);
                  }
                  setStatusOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-left text-[12px] font-medium transition-colors bg-none border-none cursor-pointer',
                  key === ticket.status ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'
                )}
              >
                <span style={{ color: s.color }}><s.icon size={14} /></span>
                {s.label}
                {key === ticket.status && <Check size={12} className="ml-auto text-brand" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title — click to navigate */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <span className="text-[13px] font-medium text-foreground truncate block leading-tight">
          {ticket.subject}
        </span>
      </div>

      <div className="flex items-center shrink-0 pl-3" onClick={onClick}>
        <span className="text-[12px] text-fg-secondary font-mono hidden sm:inline border-r border-border/40 pr-2.5 mr-2.5">#{ticket.publicId ?? ticket.ticketId}</span>
        <span className="text-[12px] text-fg-secondary font-mono max-w-[100px] truncate hidden sm:inline border-r border-border/40 pr-2.5 mr-2.5">{sender}</span>
        <span className="text-[12px] font-semibold hidden sm:inline border-r border-border/40 pr-2.5 mr-2.5" style={{ color: statusInfo.color }}>
          {subLabel || statusInfo.label}
        </span>
        <span className="text-[12px] text-fg-secondary tabular-nums">{time}</span>
      </div>
    </div>
  );
}

// ── Bulk Action Bar ───────────────────────────────────────────────────

type BulkOp = 'close' | 'resolve' | 'low' | 'medium' | 'high' | 'delete';

function BulkActionBar({ selectedIds, onClear, onDone }: {
  selectedIds: Set<string>;
  onClear: () => void;
  onDone: () => void;
}) {
  const [running, setRunning] = useState<BulkOp | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function runBulk(action: BulkOp) {
    setRunning(action);
    try {
      let body: Record<string, unknown> = {};
      if (action === 'close') body = { action: 'set_status', value: 'closed' };
      else if (action === 'resolve') body = { action: 'set_status', value: 'resolved' };
      else if (action === 'low' || action === 'medium' || action === 'high') body = { action: 'set_priority', value: action };
      else if (action === 'delete') body = { action: 'delete' };

      await fetch('/api/tickets/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: Array.from(selectedIds), ...body }),
      });
      onDone();
    } catch (err) {
      console.error('[bulk] error:', err);
    } finally {
      setRunning(null);
      setConfirmDelete(false);
    }
  }

  const count = selectedIds.size;
  const busy = !!running;

  return (
    <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 bg-brand/5 border-b border-brand/20 flex-wrap">
      <span className="text-[12px] font-semibold text-brand shrink-0">{count} selected</span>
      <div className="w-px h-4 bg-brand/20 shrink-0" />
      <Button size="xs" design="ghost" onClick={onClear} disabled={busy}>
        <X size={12} /> Deselect
      </Button>
      <div className="flex-1" />
      {/* Status actions */}
      <Button size="xs" design="ghost" disabled={busy} onClick={() => runBulk('resolve')}>
        {running === 'resolve' ? '...' : <><CheckCircle2 size={12} /> Resolve</>}
      </Button>
      <Button size="xs" design="ghost" disabled={busy} onClick={() => runBulk('close')}>
        {running === 'close' ? '...' : <><Check size={12} /> Close</>}
      </Button>
      <div className="w-px h-4 bg-brand/20 shrink-0" />
      {/* Priority actions */}
      <span className="text-[11px] text-fg-muted font-medium">Priority:</span>
      {(['low', 'medium', 'high'] as const).map(p => (
        <Button key={p} size="xs" design="ghost" disabled={busy} onClick={() => runBulk(p)}>
          {running === p ? '...' : p.charAt(0).toUpperCase() + p.slice(1)}
        </Button>
      ))}
      <div className="w-px h-4 bg-brand/20 shrink-0" />
      {/* Delete */}
      {confirmDelete ? (
        <>
          <span className="text-[11px] text-destructive font-medium">Delete {count}?</span>
          <Button size="xs" design="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => runBulk('delete')}>
            {running === 'delete' ? '...' : 'Confirm'}
          </Button>
          <Button size="xs" design="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button size="xs" design="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>
          <Trash2 size={12} /> Delete
        </Button>
      )}
    </div>
  );
}

// ── TicketsContent ─────────────────────────────────────────────────────

export function TicketsContent({ defaultFilter = 'open' }: { defaultFilter?: string }) {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/home/tickets/detail/:id');
  const queryClient = useQueryClient();
  const { activeSpaceId } = useSpace();
  const { data: currentUser } = useUser();

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [mobileTagPickerOpen, setMobileTagPickerOpen] = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadOffset, setLoadOffset] = useState(0);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);

  const activeTicketId = params?.id;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: ticketsData, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['/api/tickets', activeSpaceId, 'offset', loadOffset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSpaceId) params.set('spaceId', activeSpaceId);
      params.set('limit', '50');
      params.set('offset', String(loadOffset));
      const res = await fetch(`/api/tickets?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeSpaceId,
  });

  const hasMore = ticketsData?.tickets ? ticketsData.tickets.length >= 50 : false;

  // Accumulate tickets across pagination
  React.useEffect(() => {
    if (ticketsData?.tickets) {
      setAllTickets(prev => {
        if (loadOffset === 0) return ticketsData.tickets;
        const existing = new Map(prev.map(t => [t.id, t]));
        for (const t of ticketsData.tickets) {
          existing.set(t.id, t);
        }
        return Array.from(existing.values());
      });
    }
  }, [ticketsData, loadOffset]);

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTickets) {
      set.add(t.fromEmail);
    }
    return Array.from(set).sort();
  }, [allTickets]);

  const userOptions = uniqueUsers.map(email => ({
    value: email,
    label: allTickets.find(t => t.fromEmail === email)?.fromName || email,
  }));

  const { data: allTags = [] } = useQuery<TagPickerTag[]>({
    queryKey: ['/api/spaces', activeSpaceId, 'ticket-tags'],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${activeSpaceId}/ticket-tags`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeSpaceId,
  });

  const selectedFilterTags = allTags.filter(t => tagFilter.includes(t.id));

  const tickets = useMemo(() => {
    let filtered = allTickets;

    if (defaultFilter === 'my' && currentUser) {
      filtered = filtered.filter(t => t.assignedToId === currentUser.id);
    } else if (defaultFilter !== 'all') {
      filtered = filtered.filter(t => t.status === defaultFilter);
    }

    if (subStatusFilter) {
      filtered = filtered.filter(t => t.subStatus === subStatusFilter);
    }

    if (userFilter) {
      filtered = filtered.filter(t => t.fromEmail.toLowerCase() === userFilter.toLowerCase());
    }

    if (tagFilter.length > 0) {
      filtered = filtered.filter(t => (t as any).tags?.some((id: string) => tagFilter.includes(id)));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q) ||
        (t.fromName || '').toLowerCase().includes(q) ||
        t.fromEmail.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === 'oldest' ? da - db : db - da;
    });

    return filtered;
  }, [allTickets, defaultFilter, subStatusFilter, userFilter, tagFilter, search, sortOrder, currentUser]);

  const status = TICKET_STATUSES[defaultFilter] ?? TICKET_STATUSES['open'];
  const title = STATUS_TITLE[defaultFilter] ?? (defaultFilter === 'all' ? 'All Tickets' : defaultFilter === 'my' ? 'My Tickets' : 'Tickets');
  const empty = STATUS_EMPTY[defaultFilter] ?? STATUS_EMPTY['open'];

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title=""
            className="[&_.lds-app-topbar-row]:min-h-[32px] [&_.lds-app-topbar-row]:h-auto [&_.lds-app-topbar-row]:px-4 [&_.lds-app-topbar-row]:py-1 [&_.lds-app-title]:text-[14px]"
            leading={
              <div ref={searchRef} className="flex items-center flex-1 min-w-0">
                {searchVisible ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 animate-in fade-in slide-in-from-right-2 duration-200">
                    <Search size={13} className="text-fg-faint shrink-0" />
                    <TextInput
                      placeholder="Search tickets..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="flex-1 min-w-0 h-7 text-[13px] px-0 border-0 bg-transparent focus:ring-0"
                      autoFocus
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="inline-flex items-center justify-center h-5 w-5 rounded text-fg-faint hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"><X size={12} /></button>
                    )}
                  </div>
                ) : (
                  <span className="text-[14px] font-medium text-foreground animate-in fade-in duration-200">{title}</span>
                )}
              </div>
            }
            actions={
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setSearchVisible(!searchVisible)} className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
                  {searchVisible ? <X size={14} /> : <Search size={14} />}
                </button>
                <Dropdown
                  value={userFilter ?? ''}
                  onChange={(v) => setUserFilter(v || null)}
                  options={[
                    { value: '', label: 'All users' },
                    ...userOptions,
                  ]}
                  menuAlign="right"
                  showChevron={false}
                  triggerClassName="!p-0 !border-none !bg-transparent"
                  renderTrigger={(selected, open) => (
                    <button className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', open || selected?.value ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                      <User size={14} />
                    </button>
                  )}
                />
                <div className="relative">
                  <button onClick={() => setTagPickerOpen(!tagPickerOpen)} className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', tagPickerOpen ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                    <Tags size={14} />
                  </button>
                  <TagPicker
                    open={tagPickerOpen}
                    onClose={() => setTagPickerOpen(false)}
                    tags={allTags}
                    selectedIds={tagFilter}
                    spaceId={activeSpaceId ?? undefined}
                    tagApiPrefix={`/api/spaces/${activeSpaceId}/ticket-tags`}
                    tagApiIdPrefix="/api/ticket-tags/"
                    onToggle={(tagId) => {
                      setTagFilter(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
                    }}
                    onTagCreated={(tag) => {
                      setTagFilter(prev => [...prev, tag.id]);
                      queryClient.setQueryData(['/api/spaces', activeSpaceId, 'ticket-tags'], (old: TagPickerTag[] = []) => {
                        if (old.some(t => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase())) return old;
                        return [...old, tag];
                      });
                    }}
                    onTagUpdated={(tag) => {
                      queryClient.setQueryData(['/api/spaces', activeSpaceId, 'ticket-tags'], (old: TagPickerTag[] = []) =>
                        old.map(t => t.id === tag.id ? tag : t)
                      );
                    }}
                    onClear={() => setTagFilter([])}
                  />
                </div>
                <div ref={sortRef} className="relative">
                  <button onClick={() => setSortOpen(!sortOpen)} className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', sortOpen ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                    <Clock size={14} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-background border border-border/60 rounded-[12px] p-1.5 shadow-lg">
                      <button onClick={() => { setSortOrder('newest'); setSortOpen(false); }} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-left text-[13px] font-medium transition-colors border-none bg-transparent cursor-pointer', sortOrder === 'newest' ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                        <ChevronsUpDown size={13} /> Newest
                      </button>
                      <button onClick={() => { setSortOrder('oldest'); setSortOpen(false); }} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-left text-[13px] font-medium transition-colors border-none bg-transparent cursor-pointer', sortOrder === 'oldest' ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                        <ChevronsUpDown size={13} /> Oldest
                      </button>
                    </div>
                  )}
                </div>
              </div>
            }
          />
        }
        maxWidth="full"
      >
        {/* Mobile filter bar */}
        <div className="sm:hidden flex items-center gap-1 px-3 py-1.5 border-b border-border overflow-x-auto no-scrollbar">
          <PillFilter active={sortOrder === 'newest'} onClick={() => setSortOrder('newest')}>
            Newest
          </PillFilter>
          <PillFilter active={sortOrder === 'oldest'} onClick={() => setSortOrder('oldest')}>
            Oldest
          </PillFilter>
          {defaultFilter === 'in_progress' && (
            <>
              <Dropdown
                value={subStatusFilter ?? ''}
                onChange={(v) => setSubStatusFilter(v || null)}
                options={[
                  { value: '', label: 'All' },
                  { value: 'waiting_on_customer', label: 'Waiting on Customer' },
                  { value: 'waiting_on_support', label: 'Waiting on Support' },
                ]}
                showChevron={false}
                triggerClassName="flex items-center p-0 border-none bg-transparent cursor-pointer"
                renderTrigger={(selected, open) => (
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors border cursor-pointer whitespace-nowrap',
                    (selected?.value && selected.value !== '') || open
                      ? 'bg-[hsl(var(--surface-active))] border-[hsl(var(--border-subtle))] text-foreground'
                      : 'bg-transparent text-fg-muted border-border/60',
                  )}>
                    {(selected?.value && selected.value !== '') ? selected.label : 'Sub Status'}
                  </span>
                )}
              />
              <div className="w-px h-4 bg-border/60 shrink-0" />
            </>
          )}
          <div className="relative inline-flex shrink-0">
            <div
              onClick={() => setMobileTagPickerOpen(!mobileTagPickerOpen)}
              className={cn(
                'inline-flex items-center justify-center gap-1 h-[30px] px-3 rounded-full text-[12.5px] font-medium leading-none border cursor-pointer transition-colors whitespace-nowrap',
                tagFilter.length > 0 || mobileTagPickerOpen
                  ? 'bg-[hsl(var(--surface-active))] border-[hsl(var(--border-subtle))] text-foreground'
                  : 'bg-transparent text-fg-muted border-border/60',
              )}
            >
              {tagFilter.length === 1 && selectedFilterTags[0] ? (
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedFilterTags[0].color }} />
                  <span className="truncate">{selectedFilterTags[0].name}</span>
                </span>
              ) : tagFilter.length > 1 ? (
                <span>Tags ({tagFilter.length})</span>
              ) : 'Tag'}
              <ChevronDown size={12} strokeWidth={2} className={cn('shrink-0 transition-transform duration-200', mobileTagPickerOpen && 'rotate-180')} />
            </div>
            <TagPicker
              open={mobileTagPickerOpen}
              onClose={() => setMobileTagPickerOpen(false)}
              tags={allTags}
              selectedIds={tagFilter}
              spaceId={activeSpaceId ?? undefined}
              tagApiPrefix={`/api/spaces/${activeSpaceId}/ticket-tags`}
              tagApiIdPrefix="/api/ticket-tags/"
              onToggle={(tagId) => {
                setTagFilter(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
              }}
              onTagCreated={(tag) => {
                setTagFilter(prev => [...prev, tag.id]);
                queryClient.setQueryData(['/api/spaces', activeSpaceId, 'ticket-tags'], (old: TagPickerTag[] = []) => {
                  if (old.some(t => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase())) return old;
                  return [...old, tag];
                });
              }}
              onTagUpdated={(tag) => {
                queryClient.setQueryData(['/api/spaces', activeSpaceId, 'ticket-tags'], (old: TagPickerTag[] = []) =>
                  old.map(t => t.id === tag.id ? tag : t)
                );
              }}
              onClear={() => setTagFilter([])}
            />
          </div>
          <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />
          <div className="relative min-w-0 flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
            <TextInput
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="sm"
              className="w-full pl-8"
              
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-foreground flex bg-none border-none cursor-pointer p-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={10} />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={status.icon}
            iconColor={status.color}
            title={empty.title}
            description={empty.desc}
          />
        ) : (
          <div>
            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <BulkActionBar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds(new Set())}
                onDone={() => {
                  setSelectedIds(new Set());
                  queryClient.invalidateQueries({ queryKey: ['/api/tickets', activeSpaceId] });
                }}
              />
            )}
            {tickets.map(ticket => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                isActive={activeTicketId === String(ticket.id)}
                onClick={() => navigate('/home/tickets/detail/' + String(ticket.id))}
                selected={selectedIds.has(String(ticket.id))}
                onToggleSelect={() => {
                  setSelectedIds(prev => {
                    const next = new Set(prev);
                    const id = String(ticket.id);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                showBulk={selectedIds.size > 0 || !!tickets.find(t => selectedIds.has(String(t.id)))}
                onStatusChange={async (newStatus) => {
                  await fetch(`/api/tickets/${ticket.id}`, {
                    method: 'PATCH', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                  });
                  queryClient.invalidateQueries({ queryKey: ['/api/tickets', activeSpaceId] });
                }}
              />
            ))}
            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-border/60">
                <Button size="xs" design="ghost" onClick={() => setLoadOffset(prev => prev + 50)}>
                  <ChevronDown size={14} /> Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </ContentPanel>
    </AppPage>
  );
}

export default function TicketsOpen() {
  return <TicketsContent defaultFilter="open" />;
}
