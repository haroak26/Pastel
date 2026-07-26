import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, PageHeader, ListSkeleton, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow, SettingsButtonRow } from "@/components/settings-ui";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useWorkspace } from "@/contexts/workspace-context";
import { Clock, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SlaPolicy = {
  id: string;
  name: string;
  priority: "low" | "medium" | "high";
  firstResponseMinutes: number;
  resolutionMinutes: number;
  active: boolean;
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#E78A13",
  high: "#ef4444",
};

function minutesToLabel(m: number): string {
  if (m < 60) return `${m}m`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  const d = Math.floor(m / 1440);
  const rem = m % 1440;
  return rem > 0 ? `${d}d ${Math.floor(rem / 60)}h` : `${d}d`;
}

type FormState = {
  name: string;
  priority: "low" | "medium" | "high";
  firstResponseMinutes: number;
  resolutionMinutes: number;
  active: boolean;
};

function defaultForm(): FormState {
  return {
    name: "",
    priority: "medium",
    firstResponseMinutes: 60,
    resolutionMinutes: 480,
    active: true,
  };
}

type EditModalProps = {
  initial?: FormState & { id?: string };
  workspaceId: string;
  onClose: () => void;
  onSaved: () => void;
};

function EditModal({ initial, workspaceId, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState<FormState>(initial ?? defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!(initial as any)?.id;

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/workspaces/${workspaceId}/sla-policies/${(initial as any).id}`
        : `/api/workspaces/${workspaceId}/sla-policies`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const PRESET_HOURS = [
    { label: "30m", value: 30 },
    { label: "1h", value: 60 },
    { label: "2h", value: 120 },
    { label: "4h", value: 240 },
    { label: "8h", value: 480 },
    { label: "24h", value: 1440 },
    { label: "48h", value: 2880 },
    { label: "5d", value: 7200 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[15px] font-semibold">{isEdit ? "Edit Policy" : "New SLA Policy"}</span>
          <button onClick={onClose} className="text-fg-muted hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-fg-muted mb-1 block">Policy Name</label>
            <TextInput size="xs"
              placeholder="e.g. Standard Priority SLA"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-fg-muted mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer",
                    form.priority === p
                      ? "border-transparent text-white"
                      : "border-border bg-background text-fg-muted hover:text-foreground",
                  )}
                  style={form.priority === p ? { background: PRIORITY_COLORS[p] } : {}}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-fg-muted mb-1.5 block">First Response Time</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_HOURS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm(f => ({ ...f, firstResponseMinutes: p.value }))}
                  className={cn(
                    "h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer",
                    form.firstResponseMinutes === p.value
                      ? "bg-foreground text-background border-transparent"
                      : "border-border bg-background text-fg-muted hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <TextInput
              type="number"
              placeholder="Custom minutes"
              value={form.firstResponseMinutes}
              onChange={(e) => setForm(f => ({ ...f, firstResponseMinutes: Math.max(1, parseInt(e.target.value) || 60) }))}
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-fg-muted mb-1.5 block">Resolution Time</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_HOURS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm(f => ({ ...f, resolutionMinutes: p.value }))}
                  className={cn(
                    "h-7 px-2.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer",
                    form.resolutionMinutes === p.value
                      ? "bg-foreground text-background border-transparent"
                      : "border-border bg-background text-fg-muted hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <TextInput
              type="number"
              placeholder="Custom minutes"
              value={form.resolutionMinutes}
              onChange={(e) => setForm(f => ({ ...f, resolutionMinutes: Math.max(1, parseInt(e.target.value) || 480) }))}
            />
          </div>

          {error && <p className="text-[12px] text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-surface-hover">
          <Button size="xs" design="ghost" onClick={onClose}>Cancel</Button>
          <Button size="xs" onClick={save} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Policy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SlaSettingsContent() {
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const workspaceId = activeWorkspace?.id ?? "";

  const { data: policies = [], isLoading } = useQuery<SlaPolicy[]>({
    queryKey: ["/api/workspaces", workspaceId, "sla-policies"],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/sla-policies`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editPolicy, setEditPolicy] = useState<(SlaPolicy & { id: string }) | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deletePolicy(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/workspaces/${workspaceId}/sla-policies/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      qc.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "sla-policies"] });
    } finally {
      setDeletingId(null);
    }
  }

  function onSaved() {
    qc.invalidateQueries({ queryKey: ["/api/workspaces", workspaceId, "sla-policies"] });
    setShowCreate(false);
    setEditPolicy(null);
  }

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title="SLA Policies"
            icon={Clock}
            iconColor="#6366f1"
            actions={
              <Button size="xs" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> New Policy
              </Button>
            }
          />
        }
        maxWidth="narrow"
      >
        {showCreate && (
          <EditModal
            workspaceId={workspaceId}
            onClose={() => setShowCreate(false)}
            onSaved={onSaved}
          />
        )}
        {editPolicy && (
          <EditModal
            initial={editPolicy}
            workspaceId={workspaceId}
            onClose={() => setEditPolicy(null)}
            onSaved={onSaved}
          />
        )}

        <SettingsSection
          title="Response & Resolution Targets"
          description="Set time-based targets for your support team. Tickets will show an SLA countdown and breach status automatically."
        >
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : policies.length === 0 ? (
            <div className="py-8 text-center">
              <Clock size={32} className="text-fg-faint mx-auto mb-3" />
              <p className="text-[14px] font-medium text-foreground mb-1">No SLA policies yet</p>
              <p className="text-[13px] text-fg-muted mb-4">Create your first SLA policy to set response time targets for your team.</p>
          <Button size="xs" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Create First Policy
              </Button>
            </div>
          ) : (
            policies.map((p) => (
              <SettingsRow key={p.id} label="">
                <div className="flex items-center gap-3 flex-1 min-w-0 py-1">
                  <span
                    className="shrink-0 inline-block w-2 h-2 rounded-full"
                    style={{ background: PRIORITY_COLORS[p.priority] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{p.name}</span>
                      <span
                        className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: PRIORITY_COLORS[p.priority] + "20", color: PRIORITY_COLORS[p.priority] }}
                      >
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                      {!p.active && (
                        <span className="text-[11px] font-medium text-fg-muted bg-surface-hover px-1.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[12px] text-fg-muted">
                        First response: <span className="font-medium text-foreground">{minutesToLabel(p.firstResponseMinutes)}</span>
                      </span>
                      <span className="text-fg-faint">·</span>
                      <span className="text-[12px] text-fg-muted">
                        Resolution: <span className="font-medium text-foreground">{minutesToLabel(p.resolutionMinutes)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="xs"
                      design="ghost"
                      onClick={() => setEditPolicy(p)}
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      size="xs"
                      design="ghost"
                      disabled={deletingId === p.id}
                      onClick={() => deletePolicy(p.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </SettingsRow>
            ))
          )}
        </SettingsSection>

        <SettingsSection
          title="How SLA Works"
          description=""
          className="mt-6"
        >
          <SettingsRow label="">
            <div className="py-2 space-y-2 text-[13px] text-fg-muted">
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>When a ticket is created, the matching SLA policy (by priority) sets the resolution deadline.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>Tickets show a live countdown to deadline in the ticket list and detail view.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" />
                <span>Breached tickets are highlighted in red so your team can prioritize them.</span>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>
      </ContentPanel>
    </AppPage>
  );
}

export default function SlaSettings() {
  return <SlaSettingsContent />;
}
