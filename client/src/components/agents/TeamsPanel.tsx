import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Settings2, Pencil } from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { useToast } from '@/hooks/use-toast';
import { TeamForm } from './TeamForm';
interface LocalAgent { id: string; name: string; active: boolean; description?: string }
interface LocalAgentTeam { id: string; name: string; description?: string; agentIds?: string[]; routingStrategy: string }

export function TeamsPanel({ agents, onEditTeam }: { agents: LocalAgent[]; onEditTeam: (team: LocalAgentTeam) => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: teamsData } = useQuery<{ teams: LocalAgentTeam[] }>({
    queryKey: ['/api/agent-teams'],
    queryFn: async () => { const r = await fetch('/api/agent-teams', { credentials: 'include' }); if (!r.ok) throw new Error('Failed'); return r.json(); },
  });
  const teams = teamsData?.teams ?? [];

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; routingStrategy?: string }) => {
      const r = await fetch('/api/agent-teams', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed'); return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/agent-teams'] }); setShowCreate(false); toast({ title: 'Team created', variant: 'success' }); },
    onError: () => toast({ title: 'Failed to create team', variant: 'destructive' }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => { const r = await fetch(`/api/agent-teams/${id}`, { method: 'DELETE', credentials: 'include' }); if (!r.ok) throw new Error('Failed'); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/agent-teams'] }); toast({ title: 'Team deleted', variant: 'success' }); },
    onError: () => toast({ title: 'Failed to delete team', variant: 'destructive' }),
  });

  const handleSaveTeam = (data: { name: string; description: string; agentIds: string[]; routingStrategy: string }) => {
    const strategyMap: Record<string, string> = { 'round-robin': 'round_robin', 'random': 'ai', 'all': 'ai' };
    createTeamMutation.mutate({ name: data.name, description: data.description, routingStrategy: strategyMap[data.routingStrategy] ?? 'ai' });
  };

  const agentNameMap = new Map(agents.map(a => [a.id, a.name]));

  if (showCreate) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <IconButton icon={ArrowLeft} size="xs" design="ghost" onClick={() => setShowCreate(false)} />
          <h2 className="text-[14px] font-semibold text-foreground">Create Team</h2>
        </div>
        <TeamForm agents={agents} onSave={handleSaveTeam} onCancel={() => setShowCreate(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">Agent Teams</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Group agents into teams for coordinated routing.</p>
        </div>
        <Button size="xs" onClick={() => setShowCreate(true)}><Plus size={12} /> Create Team</Button>
      </div>
      {teams.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border/60 rounded-xl">
          <p className="text-[13px] text-muted-foreground">No teams yet. Create your first team.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground">{team.name}</span>
                {team.description && <span className="text-[12px] text-fg-muted ml-2">{team.description}</span>}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-fg-muted">{team.agentIds?.length ?? 0} members</span>
                  {(team.agentIds ?? []).slice(0, 3).map(id => (
                    <span key={id} className="text-[11px] text-fg-faint ml-1">{agentNameMap.get(id) || 'Unknown'}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => onEditTeam(team)} className="flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover"><Pencil size={13} /></button>
              <button onClick={() => deleteTeamMutation.mutate(team.id)} className="flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
