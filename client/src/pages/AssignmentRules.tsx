import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Sparkles, Users, Mail, Tag, AlertTriangle, ArrowRight, ArrowLeft, X, Circle, Loader } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, Dropdown, EmptyState, ListSkeleton, ContentPanel } from "@/components/ds";
import { Button, IconButton } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { useToast } from '@/hooks/use-toast';

interface RuleCondition {
  field: string;
  operator: string;
  value: string | string[];
}

interface RuleAction {
  type: string;
  value: string;
}

interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

interface AgentTeam {
  id: string;
  name: string;
  routingStrategy?: string;
}

interface Member {
  id: string;
  email: string;
  role: string;
  skills?: Array<{ skill: string; proficiency: number }>;
  maxCapacity?: number;
  currentTicketCount?: number;
  available?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  tag: 'Tag', priority: 'Priority', keyword: 'Keyword', customer: 'Customer',
  platform: 'Platform', language: 'Language', sentiment: 'Sentiment',
  category: 'Category', status: 'Status', masterTag: 'Type',
  sender_domain: 'Sender Domain', has_attachment: 'Has Attachment',
  subject: 'Subject', body: 'Body',
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals', contains: 'contains', matches: 'matches (regex)',
  in: 'is one of', gt: 'greater than', lt: 'less than',
  is: 'is', not_equals: 'not equals', starts_with: 'starts with',
};

const ACTION_LABELS: Record<string, string> = {
  assign_to_agent: 'Assign to AI agent', assign_to_team: 'Assign to team',
  assign_to_human: 'Assign to member', set_priority: 'Set priority',
  set_tags: 'Add tags', escalate: 'Escalate',
  forward_to_email: 'Forward to email', notify: 'Send notification',
};

const FIELD_GROUPS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tag: { label: 'Tag', icon: Tag, color: '#4682B4' },
  priority: { label: 'Priority', icon: AlertTriangle, color: '#E78A13' },
  keyword: { label: 'Keyword', icon: Mail, color: '#8b5cf6' },
  customer: { label: 'Customer', icon: Users, color: '#22c55e' },
  platform: { label: 'Platform', icon: Users, color: '#3b82f6' },
  language: { label: 'Language', icon: Mail, color: '#06b6d4' },
  sentiment: { label: 'Sentiment', icon: Sparkles, color: '#ec4899' },
  category: { label: 'Category', icon: Tag, color: '#f97316' },
  status: { label: 'Status', icon: Tag, color: '#6b7280' },
  masterTag: { label: 'Type', icon: Tag, color: '#a855f7' },
  sender_domain: { label: 'Sender Domain', icon: Mail, color: '#14b8a6' },
  has_attachment: { label: 'Has Attachment', icon: Mail, color: '#f43f5e' },
  subject: { label: 'Subject', icon: Mail, color: '#6366f1' },
  body: { label: 'Body', icon: Mail, color: '#84cc16' },
};

const FIELD_OPTIONS = [
  { value: 'tag', label: 'Tag', description: 'Ticket tag or label' },
  { value: 'priority', label: 'Priority', description: 'low, medium, high' },
  { value: 'keyword', label: 'Keyword', description: 'Word in subject or body' },
  { value: 'customer', label: 'Customer', description: 'Sender email or name' },
  { value: 'sender_domain', label: 'Sender Domain', description: 'Email domain of sender' },
  { value: 'platform', label: 'Platform', description: 'web, mobile, both' },
  { value: 'language', label: 'Language', description: 'Detected language' },
  { value: 'sentiment', label: 'Sentiment', description: 'positive, neutral, negative' },
  { value: 'category', label: 'Category', description: 'Support category' },
  { value: 'has_attachment', label: 'Has Attachment', description: 'Email includes file' },
  { value: 'subject', label: 'Subject', description: 'Email subject line' },
  { value: 'body', label: 'Body', description: 'Email body content' },
  { value: 'status', label: 'Status', description: 'Ticket status' },
  { value: 'masterTag', label: 'Type', description: 'bug, feature, question, etc' },
];

function getOperatorsForField(field: string) {
  const common = ['equals', 'contains', 'not_equals'];
  switch (field) {
    case 'priority': return ['equals', 'gt', 'lt'];
    case 'sentiment': return ['equals'];
    case 'platform': return ['equals'];
    case 'has_attachment': return ['is'];
    case 'language': return ['equals'];
    case 'status': return ['equals'];
    case 'masterTag': return ['equals'];
    case 'customer': return ['equals', 'contains', 'matches'];
    case 'sender_domain': return ['equals', 'contains', 'not_equals'];
    case 'subject': return ['contains', 'matches', 'starts_with'];
    case 'body': return ['contains', 'matches'];
    default: return common;
  }
}

function fieldLabel(f: string): string { return FIELD_LABELS[f] ?? f; }
function operatorLabel(o: string): string { return OPERATOR_LABELS[o] ?? o; }
function actionLabel(a: RuleAction): string { return ACTION_LABELS[a.type] ?? a.type; }

function displayConditionValue(c: RuleCondition, agents: Agent[], teams: AgentTeam[], members: Member[]): string {
  const val = Array.isArray(c.value) ? c.value.join(', ') : c.value;
  if (!val) return '…';
  return val;
}

function formatRuleAsSentence(rule: AssignmentRule, agents: Agent[], teams: AgentTeam[], members: Member[]): string {
  const conds = rule.conditions.map(c =>
    `${fieldLabel(c.field)} ${operatorLabel(c.operator)} "${displayConditionValue(c, agents, teams, members)}"`
  );
  const acts = rule.actions.map(a => {
    const base = actionLabel(a);
    const extra = a.value ? `: ${displayActionValue(a, agents, teams, members)}` : '';
    return base + extra;
  });
  return `When ${conds.join(' AND ')} → ${acts.join(', ')}`;
}

function displayActionValue(a: RuleAction, agents: Agent[], teams: AgentTeam[], members: Member[]): string {
  if (!a.value) return '…';
  if (a.type === 'assign_to_agent') return agents.find(x => x.id === a.value)?.name ?? a.value;
  if (a.type === 'assign_to_team') return teams.find(x => x.id === a.value)?.name ?? a.value;
  if (a.type === 'assign_to_human') return members.find(x => x.id === a.value)?.email ?? a.value;
  if (a.type === 'set_priority') return a.value;
  if (a.type === 'escalate') return `Level ${a.value}`;
  return a.value;
}

// ── Condition Row ──────────────────────────────────────────────────────────

function ConditionRow({
  condition, index, agents, teams, members, onChange, onRemove,
}: {
  condition: RuleCondition; index: number;
  agents: Agent[]; teams: AgentTeam[]; members: Member[];
  onChange: (idx: number, c: RuleCondition) => void;
  onRemove: (idx: number) => void;
}) {
  const operators = getOperatorsForField(condition.field);

  const valueWidget = () => {
    switch (condition.field) {
      case 'priority':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'low', label: <div className="flex items-center gap-2"><Circle size={8} className="text-gray-400 fill-gray-400" /> Low</div> },
              { value: 'medium', label: <div className="flex items-center gap-2"><Circle size={8} className="text-amber fill-amber" /> Medium</div> },
              { value: 'high', label: <div className="flex items-center gap-2"><Circle size={8} className="text-red-400 fill-red-400" /> High</div> },
            ]}
            placeholder="Select priority…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'platform':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'both', label: 'Both' },
            ]}
            placeholder="Select platform…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'sentiment':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'positive', label: 'Positive' },
              { value: 'neutral', label: 'Neutral' },
              { value: 'negative', label: 'Negative' },
            ]}
            placeholder="Select sentiment…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'language':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
              { value: 'ja', label: 'Japanese' },
              { value: 'zh', label: 'Chinese' },
              { value: 'pt', label: 'Portuguese' },
            ]}
            placeholder="Select language…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'status':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
              { value: 'human_review', label: 'Human Review' },
              { value: 'escalated', label: 'Escalated' },
            ]}
            placeholder="Select status…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'masterTag':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature' },
              { value: 'improvement', label: 'Improvement' },
              { value: 'task', label: 'Task' },
              { value: 'question', label: 'Question' },
            ]}
            placeholder="Select type…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'has_attachment':
        return (
          <Dropdown
            value={String(condition.value ?? '')}
            onChange={v => onChange(index, { ...condition, value: v })}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            placeholder="Select…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer w-full flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'tag':
        return (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <TextInput
              value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
              onChange={e => onChange(index, { ...condition, value: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="billing, refunds, api"
              className="flex-1 min-w-0"
              
            />
          </div>
        );
      default:
        return (
          <TextInput
            value={typeof condition.value === 'string' ? condition.value : Array.isArray(condition.value) ? condition.value.join(', ') : ''}
            onChange={e => onChange(index, { ...condition, value: e.target.value })}
            placeholder={placeholderForField(condition.field)}
            className="flex-1 min-w-0"
            
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {index === 0 ? (
        <span className="text-[12px] font-medium text-foreground w-[38px] shrink-0">When</span>
      ) : (
        <span className="text-[12px] font-medium text-foreground w-[38px] shrink-0">And</span>
      )}
      <Dropdown
        value={condition.field}
        onChange={v => onChange(index, { field: v, operator: getOperatorsForField(v)[0], value: '' })}
        options={FIELD_OPTIONS}
        placeholder="Field…"
        searchable
        triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer min-w-[130px] flex items-center gap-1.5"
        menuAlign="left"
        renderTrigger={(selected) => {
          const cfg = FIELD_GROUPS[condition.field];
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              {cfg && <cfg.icon size={12} style={{ color: cfg.color }} className="shrink-0" />}
              <span className="truncate">{fieldLabel(condition.field)}</span>
            </div>
          );
        }}
      />
      <Dropdown
        value={condition.operator}
        onChange={v => onChange(index, { ...condition, operator: v })}
        options={operators.map(o => ({ value: o, label: operatorLabel(o) }))}
        placeholder="op"
        triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer min-w-[90px] flex items-center gap-1.5"
        menuAlign="left"
      />
      <div className="flex-1 min-w-0">
        {valueWidget()}
      </div>
      <button onClick={() => onRemove(index)} className="p-1.5 text-fg-muted hover:text-destructive shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

function placeholderForField(field: string): string {
  switch (field) {
    case 'keyword': return 'e.g. cancel, refund, help';
    case 'customer': return 'e.g. john@email.com';
    case 'sender_domain': return 'e.g. @gmail.com';
    case 'subject': return 'e.g. order confirmation';
    case 'body': return 'e.g. I need a refund';
    case 'category': return 'e.g. billing, support';
    default: return 'value…';
  }
}

// ── Action Row ──────────────────────────────────────────────────────────────

function ActionRow({
  action, index, agents, teams, members, onChange, onRemove,
}: {
  action: RuleAction; index: number;
  agents: Agent[]; teams: AgentTeam[]; members: Member[];
  onChange: (idx: number, a: RuleAction) => void;
  onRemove: (idx: number) => void;
}) {
  const ACTION_TYPE_OPTIONS = [
    { value: 'assign_to_agent', label: 'Assign to AI agent', description: 'Route to an AI responder', icon: Sparkles },
    { value: 'assign_to_human', label: 'Assign to team member', description: 'Route to a human', icon: Users },
    { value: 'assign_to_team', label: 'Assign to team', description: 'Route to an agent team', icon: Users },
    { value: 'set_priority', label: 'Set priority', description: 'Override ticket priority', icon: AlertTriangle },
    { value: 'set_tags', label: 'Add tags', description: 'Label the ticket', icon: Tag },
    { value: 'escalate', label: 'Escalate', description: 'Escalate to a level', icon: ArrowRight },
    { value: 'forward_to_email', label: 'Forward to email', description: 'Forward to external', icon: Mail },
  ];

  const valueWidget = () => {
    switch (action.type) {
      case 'assign_to_agent':
        return (
          <Dropdown
            value={action.value}
            onChange={v => onChange(index, { ...action, value: v })}
            options={agents.map(a => ({
              value: a.id, label: a.name,
              description: a.description ? a.description.slice(0, 40) : undefined,
            }))}
            placeholder="Select AI agent…"
            searchable
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer flex-1 flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'assign_to_human':
        return (
          <Dropdown
            value={action.value}
            onChange={v => onChange(index, { ...action, value: v })}
            options={members.filter(m => m.available !== false).map(m => {
              const skills = (m.skills ?? []).slice(0, 2).map((s: any) => s.skill).join(', ');
              const load = `${m.currentTicketCount ?? 0}/${m.maxCapacity ?? 10}`;
              return {
                value: m.id,
                label: (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.available !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="truncate">{m.email}</span>
                    {skills && <span className="text-[11px] text-fg-muted truncate">{skills}</span>}
                    <span className="text-[11px] text-fg-muted ml-auto shrink-0">{load}</span>
                  </div>
                ),
              };
            })}
            placeholder="Select team member…"
            searchable
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer flex-1 flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'assign_to_team':
        return (
          <Dropdown
            value={action.value}
            onChange={v => onChange(index, { ...action, value: v })}
            options={teams.map(t => ({
              value: t.id, label: t.name,
              description: t.routingStrategy ? `Strategy: ${t.routingStrategy}` : undefined,
            }))}
            placeholder="Select team…"
            searchable
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer flex-1 flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'set_priority':
        return (
          <Dropdown
            value={action.value}
            onChange={v => onChange(index, { ...action, value: v })}
            options={[
              { value: 'low', label: <div className="flex items-center gap-2"><Circle size={8} className="text-gray-400 fill-gray-400" /> Low</div> },
              { value: 'medium', label: <div className="flex items-center gap-2"><Circle size={8} className="text-amber fill-amber" /> Medium</div> },
              { value: 'high', label: <div className="flex items-center gap-2"><Circle size={8} className="text-red-400 fill-red-400" /> High</div> },
            ]}
            placeholder="Set priority…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer flex-1 flex items-center gap-2"
            menuAlign="left"
          />
        );
      case 'set_tags':
        return (
          <TextInput value={action.value} onChange={e => onChange(index, { ...action, value: e.target.value })}
            placeholder="billing, urgent, follow-up"
            className="flex-1"
             />
        );
      case 'forward_to_email':
        return (
          <TextInput value={action.value} onChange={e => onChange(index, { ...action, value: e.target.value })}
            placeholder="forward@company.com"
            className="flex-1"
             />
        );
      case 'escalate':
        return (
          <Dropdown
            value={action.value}
            onChange={v => onChange(index, { ...action, value: v })}
            options={[
              { value: '1', label: 'Level 1 - Team Lead' },
              { value: '2', label: 'Level 2 - Manager' },
              { value: '3', label: 'Level 3 - Director' },
              { value: 'final', label: 'Final - All hands' },
            ]}
            placeholder="Escalation level…"
            triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer flex-1 flex items-center gap-2"
            menuAlign="left"
          />
        );
      default:
        return (
          <TextInput value={action.value} onChange={e => onChange(index, { ...action, value: e.target.value })}
            placeholder="value…"
            className="flex-1"
             />
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-medium text-foreground w-[38px] shrink-0">Then</span>
      <Dropdown
        value={action.type}
        onChange={v => onChange(index, { type: v, value: '' })}
        options={ACTION_TYPE_OPTIONS}
        placeholder="Action…"
        triggerClassName="h-8 px-2.5 rounded-[10px] border border-border bg-transparent text-[12px] text-foreground cursor-pointer min-w-[160px] flex items-center gap-1.5"
        menuAlign="left"
      />
      <div className="flex-1 min-w-0">
        {valueWidget()}
      </div>
      <button onClick={() => onRemove(index)} className="p-1.5 text-fg-muted hover:text-destructive shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Rules Modal ─────────────────────────────────────────────────────────────

function RulesModal({
  rule, agents, teams, members, onSave, onClose,
}: {
  rule?: AssignmentRule | null;
  agents: Agent[]; teams: AgentTeam[]; members: Member[];
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(rule?.name ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions ?? [{ field: 'keyword', operator: 'contains', value: '' }]);
  const [actions, setActions] = useState<RuleAction[]>(rule?.actions ?? [{ type: 'set_priority', value: 'high' }]);

  const updateCondition = (i: number, c: RuleCondition) => {
    const updated = [...conditions]; updated[i] = c; setConditions(updated);
  };
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const addCondition = () => setConditions([...conditions, { field: 'keyword', operator: 'contains', value: '' }]);

  const updateAction = (i: number, a: RuleAction) => {
    const updated = [...actions]; updated[i] = a; setActions(updated);
  };
  const removeAction = (i: number) => setActions(actions.filter((_, idx) => idx !== i));
  const addAction = () => setActions([...actions, { type: 'set_priority', value: 'medium' }]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      conditions: conditions.filter(c => c.value !== '' && (Array.isArray(c.value) ? c.value.length > 0 : true)),
      actions: actions.filter(a => a.value !== ''),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[20px] shadow-xl border border-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">{rule ? 'Edit Rule' : 'Create Rule'}</h3>
            <p className="text-[12px] text-fg-muted mt-0.5">When conditions match, actions are executed automatically.</p>
          </div>
          <IconButton icon={X} size="sm" design="ghost" onClick={onClose} />
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1">Rule Name</label>
              <TextInput value={name} onChange={e => setName(e.target.value)} required
                placeholder="e.g. Billing auto-route"
                className="w-full" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1">Description (optional)</label>
              <TextInput value={description} onChange={e => setDescription(e.target.value)}
                placeholder="What this rule does"
                className="w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-foreground">Conditions <span className="text-fg-muted font-normal">(all must match)</span></label>
              <button onClick={addCondition} className="text-[11px] text-brand hover:underline font-medium">+ Add condition</button>
            </div>
            <div className="space-y-2 bg-surface rounded-[14px] border border-border p-3">
              {conditions.map((c, i) => (
                <ConditionRow key={i} index={i} condition={c}
                  agents={agents} teams={teams} members={members}
                  onChange={updateCondition} onRemove={removeCondition} />
              ))}
              {conditions.length === 0 && (
                <div className="text-[12px] text-fg-muted text-center py-4">No conditions — rule will match all tickets</div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-foreground">Actions</label>
              <button onClick={addAction} className="text-[11px] text-brand hover:underline font-medium">+ Add action</button>
            </div>
            <div className="space-y-2 bg-surface rounded-[14px] border border-border p-3">
              {actions.map((a, i) => (
                <ActionRow key={i} index={i} action={a}
                  agents={agents} teams={teams} members={members}
                  onChange={updateAction} onRemove={removeAction} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border flex items-center justify-between">
          <div className="text-[11px] text-fg-muted">
            {conditions.filter(c => c.value).length > 0 && actions.filter(a => a.value).length > 0 ? (
              <span className="text-green-600">✓ Rule will run on matching tickets</span>
            ) : (
              <span className="text-amber">Add at least one condition and action</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button design="ghost" size="xs" onClick={onClose}>Cancel</Button>
            <Button size="xs" onClick={handleSave} disabled={!name.trim()}>
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rule Card ───────────────────────────────────────────────────────────────

function RuleCard({
  rule, agents, teams, members,
  onToggle, onEdit, onDelete,
}: {
  rule: AssignmentRule;
  agents: Agent[]; teams: AgentTeam[]; members: Member[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sentence = useMemo(() => formatRuleAsSentence(rule, agents, teams, members), [rule, agents, teams, members]);

  return (
    <div className="p-4 rounded-[14px] border border-border bg-surface hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-[14px] font-medium text-foreground truncate">{rule.name}</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${rule.enabled ? 'bg-green-500/10 text-green-500' : 'bg-surface-hover text-fg-muted'}`}>
              {rule.enabled ? 'Active' : 'Paused'}
            </span>
          </div>
          {rule.description && (
            <div className="text-[12px] text-fg-muted mt-0.5">{rule.description}</div>
          )}
          <div className="mt-2 text-[12px] text-foreground/80 leading-relaxed">
            {sentence}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-fg-muted">Priority: {rule.priority ?? 0}</span>
            {(rule.conditions ?? []).length > 0 && (
              <span className="text-[11px] text-fg-muted">{rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}</span>
            )}
            {(rule.actions ?? []).length > 0 && (
              <span className="text-[11px] text-fg-muted">{rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}</span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(rule.conditions ?? []).map((c, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/5 text-brand/70 font-medium">
                  {fieldLabel(c.field)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onToggle} className={`p-1.5 rounded-lg transition-colors ${rule.enabled ? 'text-green-500 hover:bg-green-50' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'}`}>
            {rule.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <IconButton icon={Pencil} size="sm" design="ghost" onClick={onEdit} />
          <IconButton icon={Trash2} size="sm" design="ghost" className="hover:text-destructive hover:bg-red-50" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

// ── Content (no AppLayout wrapper, reusable in WorkspacePage) ──────────

export function AssignmentRulesContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);

  const { data, isLoading } = useQuery<{ rules: AssignmentRule[] }>({
    queryKey: ['/api/assignment-rules'],
    queryFn: async () => {
      const res = await fetch('/api/assignment-rules', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { data: teamsData } = useQuery<{ teams: AgentTeam[] }>({
    queryKey: ['/api/agent-teams'],
    queryFn: async () => {
      const res = await fetch('/api/agent-teams', { credentials: 'include' });
      if (!res.ok) return { teams: [] };
      return res.json();
    },
  });

  const { data: membersData } = useQuery<Record<string, any>>({
    queryKey: ['/api/workspace-members'],
    queryFn: async () => {
      const res = await fetch('/api/workspaces', { credentials: 'include' });
      if (!res.ok) return { members: [] };
      const workspaces = await res.json();
      for (const ws of workspaces) {
        const mRes = await fetch(`/api/workspaces/${ws.id}/members`, { credentials: 'include' });
        if (mRes.ok) return mRes.json();
      }
      return [];
    },
  });

  const agents = agentsData?.agents ?? [];
  const teams = teamsData?.teams ?? [];
  const members = Array.isArray(membersData) ? membersData : [];

  const createMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const res = await fetch('/api/assignment-rules', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ruleData, enabled: true, priority: 0 }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignment-rules'] });
      setShowModal(false);
      toast({ title: 'Rule created', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to create rule', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/assignment-rules/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignment-rules'] });
      setEditingRule(null);
      setShowModal(false);
      toast({ title: 'Rule updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to update rule', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assignment-rules/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignment-rules'] });
      toast({ title: 'Rule deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/assignment-rules/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/assignment-rules'] }),
  });

  const rules = data?.rules ?? [];
  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <>
      <AppPage>
        <ContentPanel
          header={
            <PageHeader
              title="Assignment Rules"
              subtitle={`${activeCount} active · ${rules.length} total`}
              actions={
                <Button size="xs" icon={Plus} onClick={() => { setEditingRule(null); setShowModal(true); }}>
                  New Rule
                </Button>
              }
            />
          }
          maxWidth="wide"
        >
          {isLoading ? (
            <ListSkeleton rows={6} />
          ) : rules.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-[16px] bg-brand/5 flex items-center justify-center mx-auto mb-5">
                <Sparkles size={24} className="text-brand" />
              </div>
              <h3 className="text-[16px] font-semibold text-foreground mb-1">No assignment rules yet</h3>
              <p className="text-[13px] text-fg-muted max-w-md mx-auto mb-6">
                Create rules to automatically route tickets by keyword, tag, priority, sender domain, and more.
              </p>
              <Button size="xs" icon={Plus} onClick={() => setShowModal(true)}>Create your first rule</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  agents={agents}
                  teams={teams}
                  members={members}
                  onToggle={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                  onEdit={() => { setEditingRule(rule); setShowModal(true); }}
                  onDelete={() => deleteMutation.mutate(rule.id)}
                />
              ))}
            </div>
          )}

          {/* Email routing tips */}
          {rules.length > 0 && (
            <div className="mt-8 p-4 rounded-[14px] border border-border bg-surface/50">
              <h4 className="text-[13px] font-medium text-foreground mb-2 flex items-center gap-2">
                <Mail size={14} className="text-brand" /> Email routing tips
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-fg-muted">
                <div className="flex items-start gap-2">
                  <span className="text-brand font-medium shrink-0">Domain:</span>
                  <span>Use <strong>Sender Domain</strong> condition to route <code>@company.com</code> vs <code>@gmail.com</code> differently.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brand font-medium shrink-0">Attachments:</span>
                  <span>Use <strong>Has Attachment</strong> to flag or escalate emails with files.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brand font-medium shrink-0">Language:</span>
                  <span>Route non-English emails to specific agents by <strong>Language</strong> condition.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-brand font-medium shrink-0">Subject:</span>
                  <span>Use <strong>Subject contains</strong> to catch patterns like "order #" or "urgent".</span>
                </div>
              </div>
            </div>
          )}
        </ContentPanel>
      </AppPage>

      {showModal && (
        <RulesModal
          rule={editingRule}
          agents={agents}
          teams={teams}
          members={members}
          onSave={(data) => {
            if (editingRule) {
              updateMutation.mutate({ id: editingRule.id, ...data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
        />
      )}
    </>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AssignmentRules() {
  return <AssignmentRulesContent />;
}
