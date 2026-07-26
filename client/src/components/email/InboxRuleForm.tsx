import { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { TextInput } from "@/components/text-input";

const FIELD_OPTIONS = ['from', 'to', 'subject', 'body'] as const;
const OPERATOR_OPTIONS = ['contains', 'equals', 'starts_with', 'regex', 'not_contains'] as const;
const ACTION_TYPE_OPTIONS = ['label', 'star', 'forward', 'assign', 'notify', 'mark_read', 'trash'] as const;

type Condition = { field: string; operator: string; value: string };
type Action = { type: string; value: string };

interface InboxRuleFormProps {
  initial?: { name: string; conditions: Condition[]; actions: Action[]; enabled: boolean };
  onSave: (data: { name: string; conditions: Condition[]; actions: Action[]; enabled: boolean }) => void;
  onCancel: () => void;
}

export function InboxRuleForm({ initial, onSave, onCancel }: InboxRuleFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [conditions, setConditions] = useState<Condition[]>(initial?.conditions ?? [{ field: 'from', operator: 'contains', value: '' }]);
  const [actions, setActions] = useState<Action[]>(initial?.actions ?? [{ type: 'label', value: '' }]);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  const addCondition = () => setConditions([...conditions, { field: 'from', operator: 'contains', value: '' }]);
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, field: keyof Condition, value: string) => {
    const updated = [...conditions];
    updated[i] = { ...updated[i], [field]: value };
    setConditions(updated);
  };

  const addAction = () => setActions([...actions, { type: 'label', value: '' }]);
  const removeAction = (i: number) => setActions(actions.filter((_, idx) => idx !== i));
  const updateAction = (i: number, field: keyof Action, value: string) => {
    const updated = [...actions];
    updated[i] = { ...updated[i], [field]: value };
    setActions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), conditions, actions, enabled });
  };

  const fieldLabelClass = "text-[13px] text-foreground font-medium shrink-0 select-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={fieldLabelClass}>Rule name</label>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Flag support emails"
          variant="default"
          className="mt-1 w-full"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={fieldLabelClass}>Conditions</label>
          <button type="button" onClick={addCondition} className="text-xs text-primary hover:underline">+ Add condition</button>
        </div>
        <div className="space-y-2">
          {conditions.map((cond, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={cond.field}
                onChange={(e) => updateCondition(i, 'field', e.target.value)}
                className="h-8 px-2 text-xs bg-surface border border-border rounded-md focus:outline-none"
              >
                {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={cond.operator}
                onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                className="h-8 px-2 text-xs bg-surface border border-border rounded-md focus:outline-none"
              >
                {OPERATOR_OPTIONS.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
              <TextInput
                value={cond.value}
                onChange={(e) => updateCondition(i, 'value', e.target.value)}
                placeholder="Value"
                
                variant="default"
                className="flex-1"
              />
              {conditions.length > 1 && (
                <IconButton icon={X} size="xs" design="ghost" onClick={() => removeCondition(i)} type="button" className="hover:text-destructive" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={fieldLabelClass}>Actions</label>
          <button type="button" onClick={addAction} className="text-xs text-primary hover:underline">+ Add action</button>
        </div>
        <div className="space-y-2">
          {actions.map((act, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={act.type}
                onChange={(e) => updateAction(i, 'type', e.target.value)}
                className="h-8 px-2 text-xs bg-surface border border-border rounded-md focus:outline-none"
              >
                {ACTION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <TextInput
                value={act.value}
                onChange={(e) => updateAction(i, 'value', e.target.value)}
                placeholder={act.type === 'label' ? 'Label name' : act.type === 'forward' ? 'email@example.com' : 'Value'}
                
                variant="default"
                className="flex-1"
              />
              {actions.length > 1 && (
                <IconButton icon={X} size="xs" design="ghost" onClick={() => removeAction(i)} type="button" className="hover:text-destructive" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rule-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor="rule-enabled" className="text-sm text-foreground">Rule active</label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
        <Button type="button" design="ghost" size="xs" onClick={onCancel}>Cancel</Button>
        <Button type="submit" design="primary" size="xs">Save rule</Button>
      </div>
    </form>
  );
}
