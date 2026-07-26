import { useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2, GripVertical } from 'lucide-react';
import { IconButton } from '@/components/button';
import { InboxRuleForm } from './InboxRuleForm';

interface InboxRule {
  id: string;
  name: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  actions: Array<{ type: string; value: string }>;
  enabled: boolean;
  priority: number;
}

interface InboxRulesListProps {
  rules: InboxRule[];
  spaceId: string;
  onCreate: (data: { name: string; conditions: any[]; actions: any[]; enabled: boolean }) => Promise<void>;
  onUpdate: (id: string, data: Partial<InboxRule>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (ruleIds: string[]) => Promise<void>;
}

export function InboxRulesList({ rules, onCreate, onUpdate, onDelete, onReorder }: InboxRulesListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  const handleSave = async (data: { name: string; conditions: any[]; actions: any[]; enabled: boolean }) => {
    await onCreate(data);
    setShowForm(false);
  };

  const handleEdit = async (data: { name: string; conditions: any[]; actions: any[]; enabled: boolean }) => {
    if (editingId) {
      await onUpdate(editingId, data);
      setEditingId(null);
    }
  };

  const ruleLabel = (r: InboxRule) => {
    const conds = r.conditions.map((c) => `${c.field} ${c.operator} "${c.value}"`).join(', ');
    const acts = r.actions.map((a) => `${a.type}: ${a.value}`).join(', ');
    return `${conds} → ${acts}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Inbox Rules</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add rule
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-3 border border-border rounded-lg bg-surface/30">
          <InboxRuleForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">No rules yet. Emails will pass through without any automatic actions.</p>
      )}

      <div className="space-y-1.5">
        {sorted.map((rule) => (
          <div key={rule.id}>
            {editingId === rule.id ? (
              <div className="p-3 border border-border rounded-lg bg-surface/30">
                <InboxRuleForm
                  initial={{ name: rule.name, conditions: rule.conditions, actions: rule.actions, enabled: rule.enabled }}
                  onSave={handleEdit}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface/20 hover:bg-surface/40 transition-colors">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{rule.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rule.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{ruleLabel(rule)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton icon={ToggleLeft} size="xs" design="ghost" onClick={() => onUpdate(rule.id, { enabled: !rule.enabled })} title={rule.enabled ? 'Disable' : 'Enable'} />
                  <IconButton icon={Pencil} size="xs" design="ghost" onClick={() => setEditingId(rule.id)} title="Edit" />
                  <IconButton icon={Trash2} size="xs" design="ghost" onClick={() => onDelete(rule.id)} title="Delete" className="hover:text-destructive" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
