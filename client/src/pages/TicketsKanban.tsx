import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, X, Tags, Clock, ChevronsUpDown, Plus,
  Trash2, Calendar, User as UserIcon, AlertCircle,
  ArrowUp, ArrowDown, Dot,
} from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, KeyboardSensor, useSensor, useSensors, rectIntersection, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { AppPage, ContentPanel, EmptyState, Dropdown, PageHeader } from '@/components/ds';
import { Button, IconButton } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { useSpace } from '@/contexts/space-context';
import { useUser } from '@/hooks/use-user';
import { OpenIcon, InProgressIcon, ResolvedIcon, ClosedIcon, type Ticket } from './TicketsOpen';

const COLUMNS = ['open', 'in_progress', 'resolved', 'closed'] as const;

const COLUMN_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#eab308' },
  in_progress: { label: 'In Progress', color: '#f97316' },
  resolved: { label: 'Resolved', color: '#10b981' },
  closed: { label: 'Closed', color: '#6b7280' },
};

const STATUS_ICON: Record<string, React.ElementType> = {
  open: OpenIcon,
  in_progress: InProgressIcon,
  resolved: ResolvedIcon,
  closed: ClosedIcon,
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
] as const;

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DraggableTicketCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingSelf } = useDraggable({
    id: String(ticket.id),
    data: { ticket },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDraggingSelf ? 50 : undefined,
    opacity: isDraggingSelf ? 0 : undefined,
  } : undefined;

  const StatusIcon = STATUS_ICON[ticket.status] ?? OpenIcon;
  const statusColor = COLUMN_CONFIG[ticket.status]?.color ?? '#eab308';
  const sender = ticket.fromName || ticket.fromEmail;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group/card relative cursor-grab active:cursor-grabbing touch-none border-b border-border-subtle last:border-b-0 px-3 py-2.5 transition-colors hover:bg-surface-hover/50"
    >
      <div className="flex items-start gap-2">
        <StatusIcon size={11} className="mt-0.5 shrink-0" style={{ color: statusColor }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-foreground line-clamp-2">{ticket.subject}</p>
          <p className="mt-0.5 truncate text-[11.5px] leading-snug text-fg-muted">{sender}</p>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-0.5 rounded-[4px] px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-border/30 text-fg-muted">
              #{ticket.publicId ?? ticket.ticketId.slice(0, 8)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-fg-muted">
              <Calendar size={9} strokeWidth={2} />
              {formatTime(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ status, tickets }: {
  status: string;
  tickets: Ticket[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status] ?? COLUMN_CONFIG.open;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col border-r border-border-subtle last:border-r-0 transition-colors',
        isOver && 'bg-surface-hover/30',
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: config.color }} />
          <span className="text-[12px] font-semibold text-foreground truncate">{config.label}</span>
          <span className="text-[11px] font-medium tabular-nums text-fg-faint shrink-0">{tickets.length}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {tickets.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-3 py-8">
            <p className="text-center text-[11px] text-fg-faint">Drop tickets here</p>
          </div>
        )}
        {tickets.map(ticket => (
          <DraggableTicketCard key={ticket.id} ticket={ticket} />
        ))}
        <div className="h-2 shrink-0" />
      </div>
    </div>
  );
}

function DragOverlayCard({ ticket }: { ticket: Ticket }) {
  const StatusIcon = STATUS_ICON[ticket.status] ?? OpenIcon;
  const statusColor = COLUMN_CONFIG[ticket.status]?.color ?? '#eab308';
  const sender = ticket.fromName || ticket.fromEmail;

  return (
    <div className="w-full border-b border-border-subtle bg-background px-3 py-2.5 shadow-lg ring-1 ring-brand/10">
      <div className="flex items-start gap-2">
        <StatusIcon size={11} className="mt-0.5 shrink-0" style={{ color: statusColor }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-foreground line-clamp-2">{ticket.subject}</p>
          <p className="mt-0.5 truncate text-[11.5px] leading-snug text-fg-muted">{sender}</p>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-0.5 rounded-[4px] px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-border/30 text-fg-muted">
              #{ticket.publicId ?? ticket.ticketId.slice(0, 8)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums text-fg-muted">
              <Calendar size={9} strokeWidth={2} />
              {formatTime(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


const MOCK_TICKETS: Ticket[] = import.meta.env.DEV ? [
  { id: 1, userId: 1, ticketId: 'TKT-001', publicId: 1001, inboxId: '', fromEmail: 'alice@example.com', fromName: 'Alice Johnson', subject: 'Unable to login to my account', body: null, status: 'open', threadId: null, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, userId: 1, ticketId: 'TKT-002', publicId: 1002, inboxId: '', fromEmail: 'bob@example.com', fromName: 'Bob Smith', subject: 'Payment not going through', body: null, status: 'open', threadId: null, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, userId: 1, ticketId: 'TKT-003', publicId: 1003, inboxId: '', fromEmail: 'carol@example.com', fromName: 'Carol Davis', subject: 'Feature request: dark mode', body: null, status: 'in_progress', threadId: null, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, userId: 1, ticketId: 'TKT-004', publicId: 1004, inboxId: '', fromEmail: 'dave@example.com', fromName: null, subject: 'Billing inquiry for last month', body: null, status: 'in_progress', threadId: null, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, userId: 1, ticketId: 'TKT-005', publicId: 1005, inboxId: '', fromEmail: 'eve@example.com', fromName: 'Eve Wilson', subject: 'Account deletion request', body: null, status: 'resolved', threadId: null, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 6, userId: 1, ticketId: 'TKT-006', publicId: 1006, inboxId: '', fromEmail: 'frank@example.com', fromName: 'Frank Miller', subject: 'Integration with Slack failing', body: null, status: 'resolved', threadId: null, createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 7, userId: 1, ticketId: 'TKT-007', publicId: 1007, inboxId: '', fromEmail: 'grace@example.com', fromName: 'Grace Lee', subject: 'Password reset not working', body: null, status: 'closed', threadId: null, createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 8, userId: 1, ticketId: 'TKT-008', publicId: 1008, inboxId: '', fromEmail: 'henry@example.com', fromName: 'Henry Brown', subject: 'API rate limit exceeded', body: null, status: 'closed', threadId: null, createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() },
] : [];

export default function TicketsKanban({ defaultFilter = 'all' }: { defaultFilter?: string }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('newest');
  const [activeDragTicket, setActiveDragTicket] = useState<Ticket | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { activeSpaceId } = useSpace();
  const { data: currentUser } = useUser();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const { data: ticketsData, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ['/api/tickets', activeSpaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSpaceId) params.set('spaceId', activeSpaceId);
      const res = await fetch(`/api/tickets?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    },
    enabled: !!activeSpaceId,
    retry: false,
  });

  const tickets = useMemo(() => {
    const apiTickets = ticketsData?.tickets ?? [];
    return apiTickets.length > 0 ? apiTickets : MOCK_TICKETS;
  }, [ticketsData]);

  const grouped = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    for (const col of COLUMNS) map[col] = [];

    let filtered = tickets;

    if (defaultFilter === 'my' && currentUser) {
      filtered = filtered.filter(t => t.assignedToId === currentUser.id);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.fromEmail.toLowerCase().includes(q) ||
        (t.fromName ?? '').toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q)
      );
    }

    for (const ticket of filtered) {
      const status = COLUMNS.includes(ticket.status as any) ? ticket.status : 'open';
      map[status].push(ticket);
    }

    for (const col of COLUMNS) {
      if (sort === 'oldest') {
        map[col].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        map[col].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return map;
  }, [tickets, search, sort, defaultFilter, currentUser]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/tickets', activeSpaceId] });
  }, [queryClient, activeSpaceId]);

  const totalCount = tickets.length;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const ticket = event.active.data.current?.ticket as Ticket | undefined;
    if (ticket) setActiveDragTicket(ticket);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragTicket(null);
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id;
    const targetStatus = String(over.id);

    if (!COLUMNS.includes(targetStatus as any)) return;

    const ticket = tickets.find(t => String(t.id) === String(ticketId));
    if (!ticket) return;
    if (ticket.status === targetStatus) return;

    const isMock = String(ticketId).startsWith('mock-');

    queryClient.setQueryData<{ tickets: Ticket[] }>(['/api/tickets', activeSpaceId], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tickets: prev.tickets.map(t =>
          String(t.id) === String(ticketId) ? { ...t, status: targetStatus } : t
        ),
      };
    });

    if (isMock) return;

    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      refetch();
    } catch {
      refetch();
    }
  }, [tickets, refetch, activeSpaceId, queryClient]);

  const title = defaultFilter === 'all' ? 'All Tickets' : defaultFilter === 'my' ? 'My Tickets' : 'Tickets';

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
                <div ref={sortRef} className="relative">
                  <button onClick={() => setSortOpen(!sortOpen)} className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', sortOpen ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                    <Clock size={14} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-background border border-border/60 rounded-[12px] p-1.5 shadow-lg">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-left text-[13px] font-medium transition-colors border-none bg-transparent cursor-pointer', sort === opt.value ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                          <ChevronsUpDown size={13} /> {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            }
          />
        }
      >
        {totalCount === 0 && !isLoading ? (
          <div className="flex h-full items-start justify-center pt-16">
            <EmptyState
              icon={Clock}
              iconColor="#4682B4"
              title="No tickets yet"
              description="Tickets will appear here when customers email your support inbox."
            />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="shrink-0 h-9 bg-border/5 border-b border-border/40" />
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={rectIntersection}>
              <div className="flex flex-1 overflow-x-auto overflow-y-hidden min-h-0">
                {COLUMNS.map(status => (
                  <DroppableColumn
                    key={status}
                    status={status}
                    tickets={grouped[status] ?? []}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDragTicket ? (
                  <div style={{ width: 220 }}>
                    <DragOverlayCard ticket={activeDragTicket} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </ContentPanel>
    </AppPage>
  );
}
