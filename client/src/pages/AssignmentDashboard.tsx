import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Radio, Circle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, ContentPanel } from "@/components/ds";
import { Button } from '@/components/button';
import { useToast } from '@/hooks/use-toast';

interface AgentStatus {
  id: string;
  agentId: string;
  status: string;
  currentTicketCount: number;
  maxCapacity: number;
  lastActivityAt: string | null;
  agentName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  online: { label: 'Online', color: 'text-green-500', dot: 'bg-green-500' },
  busy: { label: 'Busy', color: 'text-amber', dot: 'bg-amber' },
  away: { label: 'Away', color: 'text-yellow-500', dot: 'bg-yellow-500' },
  offline: { label: 'Offline', color: 'text-gray-400', dot: 'bg-gray-400' },
};

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function AssignmentDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statusData, isLoading } = useQuery<{ statuses: AgentStatus[] }>({
    queryKey: ['/api/agent-statuses'],
    queryFn: async () => {
      const res = await fetch('/api/agent-statuses', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: rulesData } = useQuery<{ rules: any[] }>({
    queryKey: ['/api/assignment-rules'],
    queryFn: async () => {
      const res = await fetch('/api/assignment-rules', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ agentId, status }: { agentId: string; status: string }) => {
      const res = await fetch(`/api/agents/${agentId}/status`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-statuses'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
  });

  const statuses = statusData?.statuses ?? [];
  const rules = rulesData?.rules ?? [];
  const activeRules = rules.filter(r => r.enabled);
  const totalSlots = statuses.reduce((sum, s) => sum + (s.maxCapacity ?? 10), 0);
  const filledSlots = statuses.reduce((sum, s) => sum + (s.currentTicketCount ?? 0), 0);
  const utilization = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return (
      <AppPage>
        <ContentPanel
          header={
            <PageHeader
              title="Assignment Dashboard"
              subtitle="Live agent status & workload overview"
              actions={
                <Button size="xs" icon={RefreshCw} onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agent-statuses'] })}>
                  Refresh
                </Button>
              }
            />
          }
          maxWidth="wide"
        >
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-[14px] border border-border bg-surface">
              <div className="text-[12px] text-fg-muted font-medium mb-1">Agents</div>
              <div className="text-[24px] font-medium text-foreground">{statuses.length}</div>
            </div>
            <div className="p-4 rounded-[14px] border border-border bg-surface">
              <div className="text-[12px] text-fg-muted font-medium mb-1">Active Rules</div>
              <div className="text-[24px] font-medium text-foreground">{activeRules.length}</div>
            </div>
            <div className="p-4 rounded-[14px] border border-border bg-surface">
              <div className="text-[12px] text-fg-muted font-medium mb-1">Current Load</div>
              <div className="text-[24px] font-medium text-foreground">{filledSlots}/{totalSlots}</div>
            </div>
            <div className="p-4 rounded-[14px] border border-border bg-surface">
              <div className="text-[12px] text-fg-muted font-medium mb-1">Utilization</div>
              <div className={`text-[24px] font-medium ${utilization > 80 ? 'text-destructive' : utilization > 60 ? 'text-amber' : 'text-foreground'}`}>
                {utilization}%
              </div>
            </div>
          </div>

          {/* Agent status list */}
          <div className="mt-8">
            <h3 className="text-[14px] font-medium text-foreground mb-3">Agent Status</h3>
            {isLoading ? (
              <div className="text-[13px] text-fg-muted py-8 text-center">Loading agent statuses...</div>
            ) : statuses.length === 0 ? (
              <div className="text-[13px] text-fg-muted py-8 text-center">No agents with status tracking yet. Configure agents first.</div>
            ) : (
              <div className="space-y-2">
                {statuses.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.offline;
                  const loadPct = s.maxCapacity > 0 ? Math.round((s.currentTicketCount / s.maxCapacity) * 100) : 0;
                  return (
                    <div key={s.id} className="p-4 rounded-[14px] border border-border bg-surface flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium text-foreground truncate">{s.agentName}</div>
                          <div className="text-[12px] text-fg-muted">
                            {cfg.label} · {formatLastActive(s.lastActivityAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[13px] font-medium text-foreground">{s.currentTicketCount}/{s.maxCapacity}</div>
                          <div className="w-20 h-1.5 rounded-full bg-surface-hover overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full transition-all ${loadPct > 80 ? 'bg-destructive' : loadPct > 60 ? 'bg-amber' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(loadPct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {['online', 'busy', 'away', 'offline'].map(st => (
                            <button
                              key={st}
                              onClick={() => updateStatus.mutate({ agentId: s.agentId, status: st })}
                              className={`px-2 py-1 rounded-[8px] text-[11px] font-medium transition-colors ${
                                s.status === st
                                  ? 'bg-brand/10 text-brand'
                                  : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active rules summary */}
          <div className="mt-8">
            <h3 className="text-[14px] font-medium text-foreground mb-3">Active Assignment Rules ({activeRules.length})</h3>
            {activeRules.length === 0 ? (
              <div className="text-[13px] text-fg-muted">No active rules. Create rules on the <a href="/assignment-rules" className="text-brand hover:underline">Assignment Rules</a> page.</div>
            ) : (
              <div className="space-y-2">
                {activeRules.slice(0, 10).map((rule: any) => (
                  <div key={rule.id} className="p-3 rounded-[12px] border border-border bg-surface/50 flex items-center justify-between">
                    <div className="text-[13px] font-medium text-foreground truncate">{rule.name}</div>
                    <div className="text-[11px] text-fg-muted shrink-0 ml-3">
                      {rule.conditions?.length ?? 0} condition{(rule.conditions?.length ?? 0) !== 1 ? 's' : ''}
                      · {(rule.actions?.length ?? 0)} action{(rule.actions?.length ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentPanel>
      </AppPage>
  );
}
