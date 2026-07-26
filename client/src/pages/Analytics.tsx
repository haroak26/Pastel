import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, DataTable, Badge, EmptyState, ListSkeleton, ContentPanel, type DataTableColumn } from '@/components/ds';
import { SettingsSection, SettingsDisplayRow } from '@/components/settings-ui';
import { BarChart3, CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';
import { useSpace } from '@/contexts/space-context';

interface ApiTicket {
  id: number;
  ticketId: string;
  inboxId: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string | null;
  status: string;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiAgent {
  id: number;
  inboxId: string;
  name: string;
  personality: string;
  active: boolean;
  createdAt: string;
}

function StatBlock({ label, value, sub, icon: Icon, tone }: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ElementType;
  tone?: 'success' | 'warning' | 'info' | 'brand' | 'neutral';
}) {
  const iconColor: Record<string, string> = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-info bg-info/10',
    brand: 'text-brand bg-brand/10',
    neutral: 'text-fg-muted bg-surface-hover',
  };
  return (
    <div className="flex flex-col gap-2.5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.06em]">{label}</span>
        {Icon && tone && (
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-[7px] ${iconColor[tone]}`}>
            <Icon className="h-3 w-3" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-semibold text-foreground leading-none tracking-tight">{value}</p>
        {sub && <p className="mt-1.5 text-[12px] text-fg-muted">{sub}</p>}
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const { activeSpaceId } = useSpace();

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<{ tickets: ApiTicket[] }>({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery<{ agents: ApiAgent[] }>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const stats = useMemo(() => {
    const tickets = ticketsData?.tickets ?? [];
    const agents = agentsData?.agents ?? [];
    const resolved = tickets.filter(t => t.status === 'resolved');
    const open = tickets.filter(t => t.status === 'open');
    const inProgress = tickets.filter(t => t.status === 'in_progress');
    const closed = tickets.filter(t => t.status === 'closed');

    const avgResolutionMs = resolved.length > 0
      ? resolved.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const updated = new Date(t.updatedAt).getTime();
          return sum + (updated - created);
        }, 0) / resolved.length
      : 0;

    const avgResolutionHours = avgResolutionMs > 0
      ? Math.round(avgResolutionMs / (1000 * 60 * 60) * 10) / 10
      : 0;

    const resolutionRate = tickets.length > 0
      ? Math.round((resolved.length / tickets.length) * 100)
      : 0;

    return {
      totalTickets: tickets.length,
      resolved: resolved.length,
      open: open.length,
      inProgress: inProgress.length,
      closed: closed.length,
      avgResolutionHours,
      resolutionRate,
      agentCount: agents.length,
      activeAgents: agents.filter(a => a.active).length,
      resolvedTickets: resolved.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    };
  }, [ticketsData, agentsData]);

  const isLoading = ticketsLoading || agentsLoading;

  if (isLoading) {
    return (
      <ListSkeleton rows={8} />
    );
  }

  if (stats.totalTickets === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Ticket analytics will appear here once you start receiving and resolving support tickets."
        iconColor="#4682B4"
        iconBg="hsl(207 44% 54% / 0.1)"
      />
    );
  }

  const columns: DataTableColumn<ApiTicket>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      render: (row) => (
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-foreground truncate">{row.subject}</div>
          <div className="text-[11px] text-fg-muted truncate">{row.ticketId}</div>
        </div>
      ),
    },
    {
      key: 'from',
      header: 'From',
      render: (row) => (
        <div className="text-[12px] text-fg-muted truncate max-w-[180px]">
          {row.fromName || row.fromEmail}
        </div>
      ),
    },
    {
      key: 'resolved',
      header: 'Resolved',
      render: (row) => (
        <span className="text-[12px] text-fg-muted whitespace-nowrap">
          {new Date(row.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (row) => {
        const tone = row.status === 'resolved' ? 'success' as const : row.status === 'open' ? 'warning' as const : 'brand' as const;
        return <Badge tone={tone} size="sm">{row.status === 'in_progress' ? 'In Progress' : row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Ticket volume */}
      <SettingsSection title="Tickets" description="Volume breakdown across all inboxes.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 sm:gap-y-0 sm:divide-x divide-border/60">
          <div className="sm:pr-6">
            <StatBlock
              label="Resolved"
              value={stats.resolved}
              sub={`${stats.resolutionRate}% resolution rate`}
              icon={CheckCircle2}
              tone="success"
            />
          </div>
          <div className="sm:px-6">
            <StatBlock
              label="Open"
              value={stats.open}
              sub="Awaiting response"
              icon={AlertCircle}
              tone="warning"
            />
          </div>
          <div className="sm:pl-6">
            <StatBlock
              label="In Progress"
              value={stats.inProgress}
              sub="Active tickets"
              icon={Clock}
              tone="info"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Performance */}
      <SettingsSection title="Performance" description="Resolution speed and agent activity.">
        <SettingsDisplayRow label="Resolution rate">
          <span className="text-[13px] font-medium text-foreground">{stats.resolutionRate}%</span>
        </SettingsDisplayRow>
        <SettingsDisplayRow label="Avg. resolution time">
          <span className="text-[13px] font-medium text-foreground">
            {stats.avgResolutionHours > 0 ? `${stats.avgResolutionHours}h` : '—'}
          </span>
        </SettingsDisplayRow>
        <SettingsDisplayRow label="Active agents">
          <span className="text-[13px] font-medium text-foreground">
            {stats.activeAgents}/{stats.agentCount}
          </span>
        </SettingsDisplayRow>
        <SettingsDisplayRow label="Total tickets">
          <span className="text-[13px] font-medium text-foreground">{stats.totalTickets}</span>
        </SettingsDisplayRow>
        <SettingsDisplayRow label="In progress">
          <span className="text-[13px] font-medium text-foreground">{stats.inProgress}</span>
        </SettingsDisplayRow>
        <SettingsDisplayRow label="Closed">
          <span className="text-[13px] font-medium text-foreground">{stats.closed}</span>
        </SettingsDisplayRow>
      </SettingsSection>

      {/* Table */}
      {stats.resolvedTickets.length > 0 && (
        <SettingsSection title="Recently Resolved" description="The most recently closed tickets.">
          <div className="pt-1">
            <DataTable
              columns={columns}
              rows={stats.resolvedTickets.slice(0, 20)}
              getRowKey={(r) => String(r.id)}
            />
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

export default function Analytics() {
  return (
    <AppPage>
      <ContentPanel header={<PageHeader title="Analytics" icon={BarChart3} iconColor="#4682B4" />} maxWidth="narrow">
        <AnalyticsContent />
      </ContentPanel>
    </AppPage>
  );
}
