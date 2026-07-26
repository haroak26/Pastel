import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ArrowLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';
import { IconButton } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';
import { Dropdown } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { FLOW_STEP_CONFIG, type FlowStep, type FlowStepType } from './types';

interface KnowledgeFlowDesignerProps {
  scopeId: string;
  onSave: () => void;
  onCancel: () => void;
  editId?: string;
  initialData?: {
    title?: string;
    steps?: FlowStep[];
    folderId?: string | null;
  };
}

const STEP_TYPES: { value: FlowStepType; label: string }[] = [
  { value: 'trigger', label: 'Trigger' },
  { value: 'condition', label: 'Condition' },
  { value: 'action', label: 'Action' },
  { value: 'response', label: 'Response' },
  { value: 'delay', label: 'Delay' },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function StepCard({
  step,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
}: {
  step: FlowStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (step: FlowStep) => void;
  onRemove: () => void;
}) {
  const config = FLOW_STEP_CONFIG[step.type];

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col items-center w-[24px] shrink-0">
        <div
          className="w-[10px] h-[10px] rounded-full border-2 mt-[18px] shrink-0"
          style={{ borderColor: config.color, background: config.color }}
        />
        {!isLast && (
          <div className="flex-1 w-px border-l-2 border-l-[hsl(var(--border))]" />
        )}
      </div>

      <div className="flex-1 rounded-[10px] border border-[hsl(var(--border-subtle))] bg-background transition-colors hover:border-[hsl(var(--border))] mb-3">
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px]"
            style={{ background: `color-mix(in srgb, ${config.color} 12%, transparent)`, color: config.color }}
          >
            {config.label}
          </span>
          <div className="flex-1" />
          <IconButton icon={Trash2} size="xs" design="ghost" onClick={onRemove} className="hover:text-destructive hover:bg-red-50" />
        </div>
        <div className="px-3 pb-3 space-y-2">
          <TextInput
            value={step.title}
            onChange={e => onUpdate({ ...step, title: e.target.value })}
            placeholder="Step title..."
          />
          <Textarea
            value={step.description || ''}
            onChange={e => onUpdate({ ...step, description: e.target.value })}
            placeholder="Description (optional)..."
            className="min-h-[60px] text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}

export function KnowledgeFlowDesigner({
  scopeId,
  onSave,
  onCancel,
  editId,
  initialData,
}: KnowledgeFlowDesignerProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title || '');
  const [steps, setSteps] = useState<FlowStep[]>(initialData?.steps || [
    { id: generateId(), type: 'trigger', title: 'New message received' },
  ]);

  const addStep = (type: FlowStepType) => {
    setSteps(prev => [...prev, { id: generateId(), type, title: '' }]);
  };

  const updateStep = (id: string, update: FlowStep) => {
    setSteps(prev => prev.map(s => s.id === id ? update : s));
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editId
        ? `/api/workspaces/${scopeId}/knowledge/${editId}`
        : `/api/workspaces/${scopeId}/knowledge`;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flow',
          content: JSON.stringify({ steps }),
          label: title.trim() || 'Untitled Flow',
          status: 'published',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editId ? 'Flow saved' : 'Flow created', variant: 'success' });
      onSave();
    },
    onError: () => toast({ title: 'Failed to save flow', variant: 'destructive' }),
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <div className="flex items-center justify-between h-[46px] px-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Button design="ghost" size="sm" onClick={onCancel} className="shrink-0">
            <ArrowLeft size={14} strokeWidth={1.5} />
          </Button>
          <span className="text-[13px] text-fg-muted">Flow Designer</span>
        </div>
        <div className="flex items-center gap-2">
          <Button design="ghost" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Save Draft
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[640px] px-6 py-8">
          <TextInput
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            variant="ghost"
            className="text-[28px] font-semibold mb-6"
          />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                index={i}
                isFirst={i === 0}
                isLast={i === steps.length - 1}
                onUpdate={update => updateStep(step.id, update)}
                onRemove={() => removeStep(step.id)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 ml-[27px]">
            {STEP_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => addStep(type.value)}
                className="inline-flex items-center gap-1 h-[30px] px-3 rounded-full text-[12px] font-medium border cursor-pointer transition-colors bg-transparent border-[hsl(var(--border)/0.6)] text-fg-muted hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--border-subtle))]"
              >
                <Plus size={12} strokeWidth={1.5} />
                {type.label}
              </button>
            ))}
          </div>

          {steps.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[13px] text-fg-faint mb-3">Add steps to build your flow</p>
              <div className="flex items-center justify-center gap-2">
                {STEP_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => addStep(type.value)}
                    className="inline-flex items-center gap-1 h-[30px] px-3 rounded-full text-[12px] font-medium border cursor-pointer transition-colors bg-transparent border-[hsl(var(--border)/0.6)] text-fg-muted hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--border-subtle))]"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgeFlowDesigner;