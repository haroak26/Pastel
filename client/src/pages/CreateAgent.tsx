import React, { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, ContentPanel } from "@/components/ds";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { SettingsSection, SettingsRow, SettingsTextRow, SettingsLargeTextRow } from "@/components/settings-ui";
import { Sparkles, Plus, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { useSpace } from "@/contexts/space-context";
import { useToast } from "@/hooks/use-toast";

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
}

function CollapsibleSection({ title, description, defaultOpen = false, children }: {
  title: React.ReactNode;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-surface-hover transition-colors"
      >
        <div>
          <span className="text-[13.5px] font-semibold text-foreground">{title}</span>
          {description && <p className="text-[12px] text-fg-muted mt-0.5">{description}</p>}
        </div>
        {open ? <ChevronDown size={15} className="text-fg-muted shrink-0" /> : <ChevronRight size={15} className="text-fg-muted shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border/60 pt-3">{children}</div>}
    </div>
  );
}

export default function CreateAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeSpaceId, activeSpace } = useSpace();

  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [responseDelay, setResponseDelay] = useState(120);
  const [saving, setSaving] = useState(false);
  const [localActions, setLocalActions] = useState<AgentAction[]>([]);

  const valid = name.trim().length >= 1 && !!activeSpaceId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: activeSpaceId, name: name.trim(), personality: personality.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Failed to create agent");
      }
      const agent = await res.json();

      const allActions = [
        ...localActions.filter((a: any) => a.type !== "responseDelay"),
        { type: "responseDelay", value: responseDelay },
      ];
      await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), personality: personality.trim(), actions: allActions }),
      });

      toast({ title: "Agent created", variant: "success" });
      setLocation("/home/configure/agents");
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
      <AppPage>
        <ContentPanel maxWidth="narrow">
          <div className="space-y-8 py-6">
            <SettingsSection title="New agent" description="Create an AI agent to handle customer support automatically.">
              <SettingsTextRow label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Support Bot" />
              <SettingsRow label="Linked inbox">
                <div className="text-[13px] text-foreground font-medium">
                  {(activeSpace as any) ? `${(activeSpace as any).name} (${(activeSpace as any).emailAddress})` : '—'}
                </div>
              </SettingsRow>
              <SettingsLargeTextRow label="Personality" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="e.g. Friendly, professional, concise..." rows={3} />
              <SettingsRow label="Response delay">
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    value={String(responseDelay)}
                    onChange={e => setResponseDelay(Math.max(120, parseInt(e.target.value) || 120))}
                    className="w-24"
                    min={120}
                  />
                  <span className="text-[12px] text-fg-muted">seconds (min 120)</span>
                </div>
              </SettingsRow>
            </SettingsSection>

            <CollapsibleSection title="Actions" description="Create action guides so the agent can walk customers through multi-step processes.">
              <div className="space-y-4">
                {localActions.map((action) => (
                  <div key={action.id} className="border border-border/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-foreground uppercase tracking-wide">Action</span>
                      <button onClick={() => setLocalActions(prev => prev.filter(a => a.id !== action.id))}
                        className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <TextInput
                      placeholder="Overview — e.g. Cancel Subscription"
                      value={action.overview}
                      onChange={(e) => setLocalActions(prev => prev.map(a => a.id === action.id ? { ...a, overview: e.target.value } : a))}
                      
                    />
                    <div className="space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Steps</p>
                      {action.steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2">
                          <span className="text-[11px] font-bold text-muted-foreground mt-2.5 min-w-[16px] text-right">{step.order}.</span>
                          <div className="flex-1 space-y-1">
                            <TextInput
                              placeholder="Step title"
                              value={step.title}
                              onChange={(e) => setLocalActions(prev => prev.map(a => a.id === action.id ? {
                                ...a, steps: a.steps.map(s => s.id === step.id ? { ...s, title: e.target.value } : s)
                              } : a))}
                              
                            />
                            <TextInput
                              placeholder="Optional description"
                              value={step.description ?? ""}
                              onChange={(e) => setLocalActions(prev => prev.map(a => a.id === action.id ? {
                                ...a, steps: a.steps.map(s => s.id === step.id ? { ...s, description: e.target.value || undefined } : s)
                              } : a))}
                              
                              className="text-[11px]"
                            />
                          </div>
                          <button onClick={() => setLocalActions(prev => prev.map(a => a.id === action.id ? {
                            ...a, steps: a.steps.filter(s => s.id !== step.id).map((s, i) => ({ ...s, order: i + 1 }))
                          } : a))}
                            className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors mt-1.5">
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <Button design="ghost" size="xs"
                        onClick={() => setLocalActions(prev => prev.map(a => a.id === action.id ? {
                          ...a, steps: [...a.steps, { id: crypto.randomUUID(), title: "", order: a.steps.length + 1 }]
                        } : a))}
                        className="w-full">
                        <Plus size={11} /> Add Step
                      </Button>
                    </div>
                  </div>
                ))}
                <Button design="ghost" size="xs"
                  onClick={() => setLocalActions(prev => [...prev, { id: crypto.randomUUID(), overview: "", steps: [] }])}
                  className="w-full">
                  <Plus size={13} /> New Action
                </Button>
              </div>
            </CollapsibleSection>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button design="ghost" onClick={() => setLocation("/home/configure/agents")}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!valid || saving} isLoading={saving}>
                Create agent
              </Button>
            </div>
          </div>
        </ContentPanel>
      </AppPage>
  );
}
