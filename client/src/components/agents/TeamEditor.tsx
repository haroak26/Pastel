import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, X, Trash2, Users, Brain, Shuffle, RotateCcw, Tag, Hash,
  ChevronDown, AlertTriangle,
} from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type RoutingStrategy = 'ai' | 'keyword' | 'round_robin';

interface Agent {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  spaceId: string;
}

interface TeamMemberLocal {
  memberId?: string;
  agentId: string;
  agentName: string;
  agentActive: boolean;
  specialization: string;
  keywords: string[];
  priority: number;
}

interface AgentTeam {
  id: string;
  name: string;
  description: string;
  routingStrategy: RoutingStrategy;
  active: boolean;
  createdAt: string;
}

interface TeamMemberFromApi {
  id: string;
  teamId: string;
  agentId: string;
  specialization: string;
  keywords: string[];
  priority: number;
  agent: Agent;
}

const ROUTING_OPTIONS: { value: RoutingStrategy; label: string; desc: string; icon: React.ElementType }[] = [
  {
    value: 'ai',
    label: 'AI Routing',
    desc: 'Automatically routes tickets to the best agent based on content and agent specializations',
    icon: Brain,
  },
  {
    value: 'round_robin',
    label: 'Round Robin',
    desc: 'Distributes tickets evenly across all team members in rotation',
    icon: RotateCcw,
  },
  {
    value: 'keyword',
    label: 'Keyword Match',
    desc: 'Routes to the first agent whose keywords match the ticket content',
    icon: Tag,
  },
];

function KeywordInput({ keywords, onChange }: { keywords: string[]; onChange: (kw: string[]) => void }) {
  const [input, setInput] = useState('');

  const addKeyword = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
    }
    setInput('');
  };

  const removeKeyword = (kw: string) => onChange(keywords.filter(k => k !== kw));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keywords.map(kw => (
        <span key={kw} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
          {kw}
          <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 leading-none">×</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); }
          if (e.key === 'Backspace' && !input && keywords.length) onChange(keywords.slice(0, -1));
        }}
        onBlur={addKeyword}
        placeholder="Add keyword…"
        className="text-[12px] outline-none bg-transparent min-w-[80px] text-foreground placeholder:text-fg-faint"
      />
    </div>
  );
}

export function TeamEditor({
  team,
  allAgents,
  onSaved,
  onDeleted,
  onCancel,
}: {
  team: AgentTeam | null;
  allAgents: Agent[];
  onSaved: (t: AgentTeam) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isNew = !team;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routingStrategy, setRoutingStrategy] = useState<RoutingStrategy>('ai');
  const [active, setActive] = useState(false);
  const [members, setMembers] = useState<TeamMemberLocal[]>([]);
  const [addingAgent, setAddingAgent] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: membersData } = useQuery<{ members: TeamMemberFromApi[] }>({
    queryKey: ['/api/agent-teams', team?.id, 'members'],
    queryFn: async () => {
      const res = await fetch(`/api/agent-teams/${team!.id}/members`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!team?.id,
  });

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
      setRoutingStrategy(team.routingStrategy as RoutingStrategy ?? 'ai');
      setActive(team.active);
    } else {
      setName('');
      setDescription('');
      setRoutingStrategy('ai');
      setActive(false);
      setMembers([]);
    }
  }, [team?.id]);

  useEffect(() => {
    if (membersData?.members) {
      setMembers(membersData.members.map(m => ({
        memberId: m.id,
        agentId: m.agentId,
        agentName: m.agent.name,
        agentActive: m.agent.active,
        specialization: m.specialization || '',
        keywords: m.keywords || [],
        priority: m.priority ?? 0,
      })));
    }
  }, [membersData]);

  const memberAgentIds = new Set(members.map(m => m.agentId));
  const availableAgents = allAgents.filter(a => !memberAgentIds.has(a.id));

  const addMember = (agent: Agent) => {
    setMembers(prev => [...prev, {
      agentId: agent.id,
      agentName: agent.name,
      agentActive: agent.active,
      specialization: '',
      keywords: [],
      priority: prev.length,
    }]);
    setAddingAgent(false);
  };

  const removeMember = (agentId: string) => {
    setMembers(prev => prev.filter(m => m.agentId !== agentId));
  };

  const updateMember = (agentId: string, patch: Partial<TeamMemberLocal>) => {
    setMembers(prev => prev.map(m => m.agentId === agentId ? { ...m, ...patch } : m));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Team name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let savedTeam: AgentTeam;

      if (team) {
        const res = await fetch(`/api/agent-teams/${team.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim(), routingStrategy, active }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
        savedTeam = await res.json();
      } else {
        const res = await fetch('/api/agent-teams', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim(), routingStrategy }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
        savedTeam = await res.json();
      }

      const teamId = savedTeam.id ?? team?.id;
      if (teamId) {
        const memberPayload = members.map((m, i) => ({
          agentId: m.agentId,
          specialization: m.specialization || '',
          keywords: m.keywords || [],
          priority: routingStrategy === 'round_robin' ? i : m.priority,
        }));
        await fetch(`/api/agent-teams/${teamId}/members`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: memberPayload }),
        });
      }

      qc.invalidateQueries({ queryKey: ['/api/agent-teams'] });
      qc.invalidateQueries({ queryKey: ['/api/agent-teams', teamId, 'members'] });
      toast({ title: team ? 'Team saved' : 'Team created', variant: 'success' });
      onSaved(savedTeam);
    } catch (err) {
      toast({ title: (err as Error).message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!team || !confirm('Delete this team? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/agent-teams/${team.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      qc.invalidateQueries({ queryKey: ['/api/agent-teams'] });
      toast({ title: 'Team deleted', variant: 'success' });
      onDeleted();
    } catch {
      toast({ title: 'Failed to delete team', variant: 'destructive' });
    }
  };

  const selectedRouting = ROUTING_OPTIONS.find(r => r.value === routingStrategy);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <Users size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-foreground truncate">
                {isNew ? 'New Team' : (name || team?.name || 'Team')}
              </h2>
              {!isNew && (
                <p className="text-[12px] text-fg-muted">
                  {members.length} {members.length === 1 ? 'member' : 'members'} · {selectedRouting?.label}
                </p>
              )}
            </div>
          </div>
          {!isNew && (
            <button
              onClick={() => {
                const newActive = !active;
                setActive(newActive);
                fetch(`/api/agent-teams/${team.id}`, {
                  method: 'PATCH', credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ active: newActive }),
                }).then(() => qc.invalidateQueries({ queryKey: ['/api/agent-teams'] }));
              }}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-surface-muted text-fg-muted hover:bg-surface-hover'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              {active ? 'Active' : 'Inactive'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {/* Basic info */}
        <div className="space-y-3 max-w-[560px]">
          <label className="block">
            <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Team Name</span>
            <TextInput
              className="mt-1.5"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Billing Team"
              autoFocus={isNew}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Description</span>
            <TextInput
              className="mt-1.5"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Handles billing, refunds, and subscription questions"
            />
          </label>
        </div>

        {/* Routing strategy */}
        <div className="max-w-[560px]">
          <p className="text-[12px] font-medium text-fg-muted uppercase tracking-wide mb-2">Routing Strategy</p>
          <div className="space-y-2">
            {ROUTING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRoutingStrategy(opt.value)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  routingStrategy === opt.value
                    ? 'border-brand bg-brand/5'
                    : 'border-border/60 bg-background hover:border-border'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  routingStrategy === opt.value ? 'bg-brand/10' : 'bg-surface-muted'
                }`}>
                  <opt.icon size={13} className={routingStrategy === opt.value ? 'text-brand' : 'text-fg-muted'} />
                </div>
                <div className="min-w-0">
                  <p className={`text-[13px] font-semibold ${routingStrategy === opt.value ? 'text-foreground' : 'text-fg-muted'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[12px] text-fg-muted mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${
                  routingStrategy === opt.value ? 'border-brand bg-brand' : 'border-border'
                }`}>
                  {routingStrategy === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="max-w-[560px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Team Members</p>
              <p className="text-[11px] text-fg-faint mt-0.5">
                {routingStrategy === 'keyword'
                  ? 'Set trigger keywords per member — tickets matching those words route to that agent.'
                  : routingStrategy === 'round_robin'
                  ? 'Drag to reorder priority. Tickets rotate through members in order.'
                  : 'Set specializations so AI knows what each member handles best.'}
              </p>
            </div>
            {availableAgents.length > 0 && (
              <Button size="xs" design="ghost" onClick={() => setAddingAgent(true)}>
                <Plus size={12} /> Add
              </Button>
            )}
          </div>

          {addingAgent && (
            <div className="mb-3 p-3 rounded-xl border border-brand/30 bg-brand/5 space-y-2">
              <p className="text-[12px] font-medium text-foreground mb-1">Select an agent to add</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableAgents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => addMember(agent)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${agent.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className="text-[13px] font-medium text-foreground flex-1 truncate">{agent.name}</span>
                    {agent.description && (
                      <span className="text-[12px] text-fg-faint truncate max-w-[160px]">{agent.description}</span>
                    )}
                  </button>
                ))}
              </div>
              <Button size="xs" design="ghost" onClick={() => setAddingAgent(false)} className="mt-1">Cancel</Button>
            </div>
          )}

          {members.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border/60 rounded-xl">
              <Users size={20} className="text-fg-faint mx-auto mb-2" />
              <p className="text-[13px] font-medium text-foreground">No members yet</p>
              <p className="text-[12px] text-fg-muted mt-0.5">Add agents to this team to get started</p>
              {availableAgents.length > 0 && (
                <Button size="xs" className="mt-3" onClick={() => setAddingAgent(true)}>
                  <Plus size={12} /> Add first member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div key={member.agentId} className="border border-border/60 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {routingStrategy === 'round_robin' && (
                        <span className="text-[11px] font-bold text-fg-muted w-5 text-center shrink-0">#{idx + 1}</span>
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${member.agentActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="text-[13px] font-semibold text-foreground truncate">{member.agentName}</span>
                      {!member.agentActive && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 rounded-full shrink-0">Inactive</span>
                      )}
                    </div>
                    <IconButton
                      icon={X} size="xs" design="ghost"
                      className="hover:text-destructive hover:bg-red-50 shrink-0"
                      onClick={() => removeMember(member.agentId)}
                    />
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-medium text-fg-muted">Specialization</span>
                    <TextInput
                      value={member.specialization}
                      onChange={e => updateMember(member.agentId, { specialization: e.target.value })}
                      placeholder="e.g. Technical support, refunds"
                      className="mt-1 text-[12px]"
                    />
                  </label>

                  {routingStrategy === 'keyword' && (
                    <div>
                      <span className="text-[11px] font-medium text-fg-muted">Trigger Keywords</span>
                      <div className="mt-1 min-h-[32px] px-2.5 py-1.5 rounded-lg border border-border/60 bg-background focus-within:ring-1 focus-within:ring-brand/40 focus-within:border-brand/40">
                        <KeywordInput
                          keywords={member.keywords}
                          onChange={kw => updateMember(member.agentId, { keywords: kw })}
                        />
                      </div>
                      <p className="text-[10px] text-fg-faint mt-1">Press Enter or comma to add. Backspace to remove last.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {allAgents.length === 0 && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-muted border border-amber-border">
              <AlertTriangle size={13} className="text-amber mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber">
                No agents exist yet. Create agents first, then add them to teams.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-border/60 flex items-center justify-between gap-2">
        {!isNew ? (
          <>
            <Button
              design="ghost" size="sm"
              className="text-destructive hover:bg-red-50 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 size={13} /> Delete Team
            </Button>
            <div className="flex items-center gap-2">
              <Button design="ghost" size="sm" onClick={onCancel}>Discard</Button>
              <Button size="sm" onClick={handleSave} isLoading={saving} disabled={!name.trim() || saving}>
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button design="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave} isLoading={saving} disabled={!name.trim() || saving}>
              Create Team
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
