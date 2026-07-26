import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  Settings2, Zap, ListChecks, Mail, Plus, X, Trash2,
  Power, AlertTriangle, BookOpen, ChevronRight, Bot, Clock, Users2, Globe,
} from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';
import { Switch } from '@/components/ui/switch';
import { AgentReplies } from './AgentReplies';
import { useToast } from '@/hooks/use-toast';
import { usePlan } from '@/hooks/use-user';
import { SettingsLock } from '@/components/settings-ui';
import { useSpace } from '@/contexts/space-context';

type Tab = 'setup' | 'behavior' | 'actions' | 'activity';

interface ActionStep {
  id: string;
  title: string;
  description?: string;
  order: number;
}

interface AgentAction {
  id: string;
  overview: string;
  steps: ActionStep[];
  type?: string;
  value?: number;
}

interface Agent {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  personality: string;
  active: boolean;
  autoEscalate: boolean;
  model: string;
  maxCapacity: number;
  timezone: string | null;
  businessHours: { start: string; end: string } | null;
  actions?: AgentAction[];
}

const MODELS = [
  { value: 'mistral-small-latest', label: 'Mistral Small', desc: 'Fast & cost-effective' },
  { value: 'mistral-medium-latest', label: 'Mistral Medium', desc: 'Balanced speed & quality' },
  { value: 'mistral-large-latest', label: 'Mistral Large', desc: 'Highest quality replies' },
];

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'setup', label: 'Setup', icon: Settings2 },
  { id: 'behavior', label: 'Behavior', icon: Zap },
  { id: 'actions', label: 'Actions', icon: ListChecks },
  { id: 'activity', label: 'Activity', icon: Mail },
];

export function AgentEditor({
  agent,
  spaceId: newSpaceId,
  onSaved,
  onDeleted,
  onCancel,
}: {
  agent: Agent | null;
  spaceId: string | null;
  onSaved: (a: Agent) => void;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { spaceList } = useSpace();
  const { data: planInfo } = usePlan();

  const [tab, setTab] = useState<Tab>('setup');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [model, setModel] = useState('mistral-small-latest');

  const [active, setActive] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [responseDelay, setResponseDelay] = useState(120);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [timezone, setTimezone] = useState('UTC');
  const [bhEnabled, setBhEnabled] = useState(false);
  const [bhStart, setBhStart] = useState('09:00');
  const [bhEnd, setBhEnd] = useState('17:00');

  const [actions, setActions] = useState<AgentAction[]>([]);

  const isNew = !agent;

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description || '');
      setPersonality(agent.personality || '');
      setModel(agent.model || 'mistral-small-latest');
      setActive(agent.active);
      setAutoEscalate(agent.autoEscalate !== false);
      setMaxCapacity(agent.maxCapacity || 10);
      setTimezone(agent.timezone || 'UTC');
      setBhEnabled(!!agent.businessHours);
      setBhStart(agent.businessHours?.start || '09:00');
      setBhEnd(agent.businessHours?.end || '17:00');
      const nonDelay = (agent.actions ?? []).filter(a => a.type !== 'responseDelay');
      const delayAction = (agent.actions ?? []).find(a => a.type === 'responseDelay');
      setActions(nonDelay);
      setResponseDelay(delayAction?.value ?? 120);
    } else {
      setName('');
      setDescription('');
      setPersonality('');
      setModel('mistral-small-latest');
      setActive(false);
      setAutoEscalate(true);
      setMaxCapacity(10);
      setTimezone('UTC');
      setBhEnabled(false);
      setBhStart('09:00');
      setBhEnd('17:00');
      setActions([]);
      setResponseDelay(120);
      setTab('setup');
    }
  }, [agent?.id]);

  const linkedSpace = spaceList.find(s => s.id === (agent?.spaceId ?? newSpaceId));

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Agent name is required', variant: 'destructive' });
      return;
    }
    const targetSpaceId = agent?.spaceId ?? newSpaceId;
    if (!targetSpaceId) {
      toast({ title: 'No inbox selected', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const allActions = [
        ...actions.filter(a => a.type !== 'responseDelay'),
        { type: 'responseDelay', value: responseDelay },
      ];
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        personality: personality.trim(),
        model,
        autoEscalate,
        actions: allActions,
        maxCapacity,
        timezone,
        businessHours: bhEnabled ? { start: bhStart, end: bhEnd } : null,
      };

      let saved: Agent;
      if (agent) {
        const res = await fetch(`/api/agents/${agent.id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
        saved = await res.json();
      } else {
        const res = await fetch('/api/agents', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId: targetSpaceId, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
        saved = await res.json();
      }
      qc.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: agent ? 'Agent saved' : 'Agent created', variant: 'success' });
      onSaved(saved);
    } catch (err) {
      toast({ title: (err as Error).message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!agent) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !agent.active }),
      });
      if (!res.ok) throw new Error('Failed');
      const saved = await res.json();
      qc.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: agent.active ? 'Agent deactivated' : 'Agent activated', variant: 'success' });
      onSaved(saved);
    } catch {
      toast({ title: 'Failed to toggle agent', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!agent || !confirm('Delete this agent? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      qc.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: 'Agent deleted', variant: 'success' });
      onDeleted();
    } catch {
      toast({ title: 'Failed to delete agent', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-brand/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-brand" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-foreground truncate">
                {isNew ? 'New Agent' : (name || agent?.name || 'Agent')}
              </h2>
              {!isNew && linkedSpace && (
                <p className="text-[12px] text-fg-muted truncate">{linkedSpace.name} · {linkedSpace.emailAddress}</p>
              )}
            </div>
          </div>
          {!isNew && (
            <button
              onClick={handleToggleActive}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                agent?.active
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-surface-muted text-fg-muted hover:bg-surface-hover'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${agent?.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              {agent?.active ? 'Active' : 'Inactive'}
            </button>
          )}
        </div>

        {/* Tabs — only show for edit mode */}
        {!isNew && (
          <div className="flex gap-0.5 border-b border-border/60">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px [&_svg]:shrink-0 ${
                  tab === t.id
                    ? 'text-foreground border-foreground'
                    : 'text-fg-muted border-transparent hover:text-foreground'
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {/* CREATE or SETUP tab */}
        {(isNew || tab === 'setup') && (
          <div className="space-y-5 max-w-[560px]">
            <div className="space-y-3">
              <label className="block">
                <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Agent Name</span>
                <TextInput
                  className="mt-1.5"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Billing Bot"
                  autoFocus={isNew}
                />
              </label>

              <label className="block">
                <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Handles</span>
                <p className="text-[11px] text-fg-faint mt-0.5 mb-1.5">What kinds of questions this agent answers</p>
                <TextInput
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Billing, refunds, and subscription queries"
                />
              </label>

              <div>
                <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Linked Inbox</span>
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-muted border border-border/60">
                  <Mail size={13} className="text-fg-muted shrink-0" />
                  <span className="text-[13px] text-foreground flex-1 truncate">
                    {linkedSpace ? `${linkedSpace.name} (${linkedSpace.emailAddress})` : '—'}
                  </span>
                  {!isNew && (
                    <Link href="/home/settings/spaces" className="text-[11px] text-brand hover:underline shrink-0">
                      Change
                    </Link>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Personality</span>
                <p className="text-[11px] text-fg-faint mt-0.5 mb-1.5">How the agent should sound in replies</p>
                <Textarea
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                  placeholder="e.g. You are a friendly and professional support agent for Acme. Always be concise, empathetic, and solution-focused. Sign off as the Acme Support team."
                  rows={4}
                />
              </label>

              <label className="block">
                <span className="text-[12px] font-medium text-fg-muted uppercase tracking-wide">Model</span>
                <p className="text-[11px] text-fg-faint mt-0.5 mb-1.5">AI model used for generating replies</p>
                <div className="grid grid-cols-3 gap-2">
                  {MODELS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setModel(m.value)}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                        model === m.value
                          ? 'border-brand bg-brand/5 text-foreground'
                          : 'border-border/60 bg-background text-fg-muted hover:border-border'
                      }`}
                    >
                      <p className="text-[12px] font-semibold leading-tight">{m.label}</p>
                      <p className="text-[11px] text-fg-faint mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {isNew && (
              <div className="flex items-start gap-2.5 rounded-xl bg-brand/5 border border-brand/20 p-3.5">
                <BookOpen size={14} className="text-brand mt-0.5 shrink-0" />
                <p className="text-[12px] text-fg-secondary leading-relaxed">
                  After creating the agent you can configure behavior, actions, and view its reply history.
                </p>
              </div>
            )}
          </div>
        )}

        {/* BEHAVIOR tab */}
        {!isNew && tab === 'behavior' && (
          <div className="space-y-0 divide-y divide-border/60 max-w-[560px]">
            <div className="flex items-center justify-between gap-3 py-4">
              <div>
                <p className="text-[13px] font-medium text-foreground">Active</p>
                <p className="text-[12px] text-fg-muted mt-0.5">Agent will auto-reply to incoming emails when active</p>
              </div>
              <Switch checked={active} onCheckedChange={v => {
                setActive(v);
                if (agent) {
                  fetch(`/api/agents/${agent.id}`, {
                    method: 'PUT', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: v }),
                  }).then(() => qc.invalidateQueries({ queryKey: ['/api/agents'] }));
                }
              }} />
            </div>

            <div className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle size={14} className="text-amber mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Auto-escalate low-confidence replies</p>
                  <p className="text-[12px] text-fg-muted mt-0.5">Route to human review when the agent isn't confident in its reply</p>
                </div>
              </div>
              <Switch checked={autoEscalate} onCheckedChange={setAutoEscalate} />
            </div>

            <div className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-2 min-w-0">
                <Clock size={14} className="text-fg-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Response delay</p>
                  <p className="text-[12px] text-fg-muted mt-0.5">Minimum wait before the agent sends a reply (min 120s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TextInput
                  type="number"
                  value={String(responseDelay)}
                  onChange={e => setResponseDelay(Math.max(120, parseInt(e.target.value) || 120))}
                  className="w-20 text-center"
                  min={120}
                />
                <span className="text-[12px] text-fg-muted">sec</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-2 min-w-0">
                <Users2 size={14} className="text-fg-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Max concurrent tickets</p>
                  <p className="text-[12px] text-fg-muted mt-0.5">Agent pauses when this many open tickets are active</p>
                </div>
              </div>
              <TextInput
                type="number"
                value={String(maxCapacity)}
                onChange={e => setMaxCapacity(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                className="w-20 text-center shrink-0"
                min={1}
                max={100}
              />
            </div>

            <div className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-2 min-w-0">
                <Globe size={14} className="text-fg-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Timezone</p>
                  <p className="text-[12px] text-fg-muted mt-0.5">Used for business hours scheduling</p>
                </div>
              </div>
              <TextInput
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                placeholder="UTC"
                className="w-40 shrink-0"
              />
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Clock size={14} className="text-fg-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">Business hours</p>
                    <p className="text-[12px] text-fg-muted mt-0.5">Agent only replies during these hours</p>
                  </div>
                </div>
                <Switch checked={bhEnabled} onCheckedChange={setBhEnabled} />
              </div>
              {bhEnabled && (
                <div className="ml-6 flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-fg-muted shrink-0">From</span>
                    <TextInput
                      type="time"
                      value={bhStart}
                      onChange={e => setBhStart(e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-fg-muted shrink-0">to</span>
                    <TextInput
                      type="time"
                      value={bhEnd}
                      onChange={e => setBhEnd(e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIONS tab */}
        {!isNew && tab === 'actions' && (
          <div className="space-y-4 max-w-[560px]">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                  Action Guides
                  <SettingsLock plan="pro" currentPlan={planInfo?.plan} />
                </h3>
                <p className="text-[12px] text-fg-muted mt-0.5">
                  Multi-step processes the agent can walk customers through — like cancellations, refunds, or account changes.
                </p>
              </div>
            </div>

            {actions.map(action => (
              <div key={action.id} className="border border-border/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide">Action Guide</span>
                  <IconButton
                    icon={X} size="xs" design="ghost"
                    className="hover:text-destructive hover:bg-red-50"
                    onClick={() => setActions(prev => prev.filter(a => a.id !== action.id))}
                  />
                </div>
                <TextInput
                  placeholder="Title — e.g. Cancel Subscription"
                  value={action.overview}
                  onChange={e => setActions(prev => prev.map(a => a.id === action.id ? { ...a, overview: e.target.value } : a))}
                />
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-fg-muted uppercase tracking-wide">Steps</p>
                  {action.steps.map(step => (
                    <div key={step.id} className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-fg-muted mt-2.5 min-w-[18px] text-right">{step.order}.</span>
                      <div className="flex-1 space-y-1">
                        <TextInput
                          placeholder="Step title"
                          value={step.title}
                          onChange={e => setActions(prev => prev.map(a => a.id === action.id ? {
                            ...a, steps: a.steps.map(s => s.id === step.id ? { ...s, title: e.target.value } : s),
                          } : a))}
                        />
                        <TextInput
                          placeholder="Optional description"
                          value={step.description ?? ''}
                          onChange={e => setActions(prev => prev.map(a => a.id === action.id ? {
                            ...a, steps: a.steps.map(s => s.id === step.id ? { ...s, description: e.target.value || undefined } : s),
                          } : a))}
                          className="text-[11px]"
                        />
                      </div>
                      <IconButton
                        icon={X} size="xs" design="ghost"
                        className="hover:text-destructive hover:bg-red-50 mt-0.5"
                        onClick={() => setActions(prev => prev.map(a => a.id === action.id ? {
                          ...a, steps: a.steps.filter(s => s.id !== step.id).map((s, i) => ({ ...s, order: i + 1 })),
                        } : a))}
                      />
                    </div>
                  ))}
                  <Button
                    design="ghost" size="xs"
                    onClick={() => setActions(prev => prev.map(a => a.id === action.id ? {
                      ...a, steps: [...a.steps, { id: crypto.randomUUID(), title: '', order: a.steps.length + 1 }],
                    } : a))}
                    className="w-full"
                  >
                    <Plus size={11} /> Add Step
                  </Button>
                </div>
              </div>
            ))}

            <Button
              design="ghost" size="sm"
              onClick={() => setActions(prev => [...prev, { id: crypto.randomUUID(), overview: '', steps: [] }])}
              className="w-full border border-dashed border-border/60"
            >
              <Plus size={13} /> New Action Guide
            </Button>

            <div className="flex items-start gap-2.5 rounded-xl bg-surface-muted border border-border/60 p-3.5 mt-2">
              <BookOpen size={13} className="text-fg-muted mt-0.5 shrink-0" />
              <p className="text-[12px] text-fg-muted leading-relaxed">
                Workspace knowledge is shared across all agents.{' '}
                <Link href="/home/knowledge" className="text-brand hover:underline font-medium">Manage knowledge base →</Link>
              </p>
            </div>
          </div>
        )}

        {/* ACTIVITY tab */}
        {!isNew && tab === 'activity' && agent && (
          <div className="max-w-[560px]">
            <AgentReplies agentId={agent.id} />
          </div>
        )}
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
              <Trash2 size={13} /> Delete Agent
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
              Create Agent
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
