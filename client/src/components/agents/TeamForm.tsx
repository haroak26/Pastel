import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/button';
import { SettingsSection, SettingsTextRow, SettingsRow } from '@/components/settings-ui';
import { FilterChip } from '@/components/ds';
interface LocalAgent { id: string; name: string; active: boolean; description?: string }
interface LocalAgentTeam { id: string; name: string; description?: string; agentIds?: string[]; routingStrategy: string }

export function TeamForm({ team, agents, onSave, onCancel }: {
  team?: LocalAgentTeam; agents: LocalAgent[];
  onSave: (data: { name: string; description: string; agentIds: string[]; routingStrategy: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(team?.name ?? '');
  const [description, setDescription] = useState(team?.description ?? '');
  const [agentIds, setAgentIds] = useState<string[]>(team?.agentIds ?? []);
  const [routingStrategy, setRoutingStrategy] = useState(team?.routingStrategy ?? 'round-robin');

  const toggleAgent = (id: string) => setAgentIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  return (
    <div className="space-y-6">
      <SettingsSection title={team ? 'Edit Team' : 'Create Team'} description="Group agents together for coordinated support coverage.">
        <SettingsTextRow label="Team Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Billing Team" />
        <SettingsTextRow label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Handles billing queries" />
        <SettingsRow label="Routing Strategy">
          <div className="flex gap-1">
            {(['round-robin', 'random', 'all'] as const).map(s => (
              <FilterChip key={s} active={routingStrategy === s} onClick={() => setRoutingStrategy(s)}>
                {s === 'round-robin' ? 'Round Robin' : s === 'random' ? 'Random' : 'Send to All'}
              </FilterChip>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>
      <div>
        <h3 className="text-[14px] font-semibold text-foreground mb-2">Team Members</h3>
        <p className="text-[12px] text-muted-foreground mb-3">Select agents to add to this team.</p>
        {agents.length === 0 ? (
          <p className="text-[13px] text-fg-muted py-4 text-center border border-dashed border-border/60 rounded-xl">No agents available.</p>
        ) : (
          <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
            {agents.map(agent => (
              <label key={agent.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${agentIds.includes(agent.id) ? 'bg-brand border-brand' : 'border-border'}`}>
                  {agentIds.includes(agent.id) && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground">{agent.name}</span>
                  {agent.description && <span className="text-[12px] text-fg-muted ml-2">{agent.description}</span>}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${agent.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {agent.active ? 'Active' : 'Inactive'}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button design="ghost" size="xs" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ name, description, agentIds, routingStrategy })} disabled={!name.trim()}>
          {team ? 'Save Team' : 'Create Team'}
        </Button>
      </div>
    </div>
  );
}
