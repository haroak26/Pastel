import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Zap, GitBranch, Play, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FLOW_STEP_CONFIG } from '../types';
import type { FlowStep, FlowStepType } from '../types';

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

const stepIcons: Record<FlowStepType, typeof Zap> = {
  trigger: Zap,
  condition: GitBranch,
  action: Play,
  response: MessageSquare,
  delay: Clock,
};

let stepCounter = 0;
const createStep = (type: FlowStepType): FlowStep => ({
  id: `step_${++stepCounter}`,
  type,
  title: '',
  description: '',
});

export function KnowledgeFlowDesigner({ scopeId, onSave, onCancel, editId, initialData }: KnowledgeFlowDesignerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialData?.title || '');
  const [steps, setSteps] = useState<FlowStep[]>(initialData?.steps || []);

  const addStep = (type: FlowStepType) => {
    setSteps(prev => [...prev, createStep(type)]);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: 'title' | 'description', value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const apiBase = `/api/workspaces/${scopeId}/knowledge`;
      const url = editId ? `${apiBase}/${editId}` : apiBase;
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
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${scopeId}/knowledge`] });
      toast({ title: editId ? 'Saved' : 'Created', variant: 'success' });
      if (!editId) onSave();
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  });

  const addableTypes: { type: FlowStepType; label: string }[] = [
    { type: 'trigger', label: 'Trigger' },
    { type: 'condition', label: 'Condition' },
    { type: 'action', label: 'Action' },
    { type: 'response', label: 'Response' },
    { type: 'delay', label: 'Delay' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <div className="flex items-center justify-between h-[46px] px-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Button design="ghost" size="sm" onClick={onCancel} className="shrink-0">
            <ArrowLeft size={14} strokeWidth={1.5} />
          </Button>
          <span className="text-[13px] font-medium text-foreground">Flow</span>
        </div>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save size={13} strokeWidth={1.75} /> {editId ? 'Save' : 'Create'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[640px] px-6 py-8">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Flow title"
            className="w-full text-[24px] font-semibold text-foreground bg-transparent outline-none placeholder:text-fg-subtle mb-8"
          />

          {steps.length === 0 && (
            <div className="text-center py-12">
              <Zap size={32} strokeWidth={1} className="text-fg-subtle mx-auto mb-3" />
              <p className="text-[14px] text-fg-muted mb-4">No steps yet. Add your first step below.</p>
            </div>
          )}

          {/* Steps */}
          <div className="relative space-y-0">
            {steps.map((step, i) => {
              const Icon = stepIcons[step.type];
              const config = FLOW_STEP_CONFIG[step.type];
              return (
                <div key={step.id} className="relative flex gap-4 pb-2">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-border/60" />
                  )}

                  {/* Icon circle */}
                  <div className="shrink-0 w-[38px] flex flex-col items-center">
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center border-2"
                      style={{ borderColor: config.color, backgroundColor: `${config.color}10` }}>
                      <Icon size={16} style={{ color: config.color }} />
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-[11px] text-fg-subtle">Step {i + 1}</span>
                      <button onClick={() => removeStep(step.id)} className="ml-auto p-0.5 text-fg-subtle hover:text-[hsl(var(--danger))]">
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                    <TextInput
                      value={step.title}
                      onChange={e => updateStep(step.id, 'title', e.target.value)}
                      placeholder={`${config.label} title`}
                      className="mb-1.5"
                    />
                    <Textarea
                      value={step.description || ''}
                      onChange={e => updateStep(step.id, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="min-h-[60px] text-[13px]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {addableTypes.map(({ type, label }) => {
              const Icon = stepIcons[type];
              const config = FLOW_STEP_CONFIG[type];
              return (
                <Button
                  key={type}
                  size="sm"
                  design="outline"
                  onClick={() => addStep(type)}
                  className="flex items-center gap-1.5"
                  style={{ borderColor: `${config.color}40`, color: config.color }}
                >
                  <Icon size={12} strokeWidth={1.5} />
                  <Plus size={10} strokeWidth={2} />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeFlowDesigner;
