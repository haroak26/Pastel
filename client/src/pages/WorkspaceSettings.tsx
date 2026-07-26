import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SettingsSection,
  SettingsRow,
  SettingsButtonRow,
  SettingsDisplayRow,
  SaveButton,
} from "@/components/settings-ui";
import { ListSkeleton } from "@/components/ds";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  Building2, Trash2, Loader, AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

function WorkspaceLogo({ logoUrl, name, size = "lg" }: { logoUrl?: string | null; name: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-12 h-12 rounded-[14px]" : "w-8 h-8 rounded-[10px]";
  if (logoUrl) {
    return <img src={logoUrl} alt={name} className={`${cls} object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} bg-brand flex items-center justify-center shrink-0`}>
      <span className="text-white font-bold" style={{ fontSize: size === "lg" ? 20 : 14 }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-brand/10 text-brand",
    editor: "bg-violet-50 text-violet-600",
    viewer: "bg-gray-50 text-gray-500",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[role] ?? colors.viewer}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "active") return <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-amber inline-block" />;
}

function WorkspaceLogoInput({ logoUrl, workspaceId, canManage, onLogoChange }: {
  logoUrl: string;
  workspaceId: string;
  canManage: boolean;
  onLogoChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(`/api/workspaces/${workspaceId}/logo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Upload failed");
      }
      const data = await res.json();
      onLogoChange(data.logoUrl);
      toast({ title: "Logo updated", variant: "success" });
    } catch (err: any) {
      toast({ title: err?.message ?? "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-[10px] object-cover shrink-0 border border-border" />
      ) : (
        <div className="w-8 h-8 rounded-[10px] bg-surface-active flex items-center justify-center shrink-0 border border-border">
          <Building2 size={15} className="text-fg-faint" />
        </div>
      )}
      {canManage && (
        <div className="flex flex-col gap-1">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={handleUpload} className="hidden" id="ws-logo-file" />
          <label htmlFor="ws-logo-file" className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-input bg-background text-[12px] font-medium text-foreground hover:bg-surface-hover transition-colors whitespace-nowrap">
            {uploading ? "Uploading…" : "Upload"}
          </label>
          <p className="text-[11px] text-fg-muted">Max 25MB</p>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceSettings() {
  const [location, navigate] = useLocation();
  const workspaceId = location.split('/').pop() ?? '';
  const { toast } = useToast();
  const qc = useQueryClient();
  const { setActiveWorkspaceId } = useWorkspace();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["/api/workspaces", workspaceId],
    queryFn: async () => {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      const all = await res.json();
      return Array.isArray(all) ? all.find((w: any) => w.id === workspaceId) ?? null : null;
    },
    enabled: !!workspaceId,
  });

  const role = workspace?.role ?? "viewer";
  const canManage = ["owner", "editor"].includes(role);

  const [wsName, setWsName] = useState("");
  const [wsDomain, setWsDomain] = useState("");
  const [wsLogo, setWsLogo] = useState("");
  const [wsAutoEscalate, setWsAutoEscalate] = useState(true);
  const [overviewDirty, setOverviewDirty] = useState(false);

  const [wsConfidenceThreshold, setWsConfidenceThreshold] = useState(60);
  const [thresholdDirty, setThresholdDirty] = useState(false);
  const [thresholdError, setThresholdError] = useState("");

  React.useEffect(() => {
    if (workspace) {
      setWsName(workspace.name ?? "");
      setWsDomain(workspace.domain ?? "");
      setWsLogo(workspace.logoUrl ?? "");
      setWsAutoEscalate(workspace.autoEscalate !== false);
      setWsConfidenceThreshold(workspace.confidenceThreshold ?? 60);
    }
  }, [workspace]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; domain?: string; logoUrl?: string; autoEscalate?: boolean; confidenceThreshold?: number }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["/api/workspaces"] });
      if (variables.confidenceThreshold !== undefined) {
        setThresholdDirty(false);
      } else {
        setOverviewDirty(false);
      }
      toast({ title: "Workspace updated" });
    },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete workspace");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace deleted" });
      navigate("/account/profile");
    },
    onError: () => toast({ title: "Failed to delete workspace", variant: "destructive" }),
  });

  if (isLoading) {
    return <ListSkeleton rows={5} className="py-2" />;
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-40 text-fg-muted text-sm">Workspace not found.</div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <SettingsSection title="Workspace Details" description="The name, domain, and logo for this workspace.">
        <SettingsRow label="Logo">
          <WorkspaceLogoInput
            logoUrl={wsLogo}
            workspaceId={workspaceId}
            canManage={canManage}
            onLogoChange={(url) => { setWsLogo(url); setOverviewDirty(true); }}
          />
        </SettingsRow>
        <SettingsRow label="Name">
          <TextInput
            value={wsName}
            onChange={e => { setWsName(e.target.value); setOverviewDirty(true); }}
            placeholder="Workspace name"
            disabled={!canManage}
          />
        </SettingsRow>
        <SettingsRow label="Domain">
          {canManage ? (
            <TextInput
              value={wsDomain}
              onChange={e => { setWsDomain(e.target.value); setOverviewDirty(true); }}
              placeholder="example.com"
              disabled={!canManage}
            />
          ) : (
            <span className="text-[13px] text-fg-muted font-mono">{wsDomain}</span>
          )}
        </SettingsRow>
        {canManage && overviewDirty && (
          <div className="flex justify-end pt-2">
            <SaveButton
              onSave={() => updateMutation.mutate({ name: wsName, domain: wsDomain, logoUrl: wsLogo })}
              onCancel={() => { setWsName(workspace?.name ?? ""); setWsDomain(workspace?.domain ?? ""); setWsLogo(workspace?.logoUrl ?? ""); setOverviewDirty(false); }}
              isSaving={updateMutation.isPending}
              hasChanges={overviewDirty}
              saveLabel="Save Changes"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="AI Settings" description="Configure how AI-handled tickets are displayed.">
        <SettingsRow label="Low-confidence threshold">
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={wsConfidenceThreshold}
              disabled={!canManage}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                setWsConfidenceThreshold(isNaN(val) ? 0 : val);
                setThresholdDirty(true);
                setThresholdError(isNaN(val) || val < 0 || val > 100 ? "Enter a number between 0 and 100." : "");
              }}
              className="w-20"
            />
            <span className="text-[13px] text-fg-muted">%</span>
          </div>
          {thresholdError && <p className="text-[12px] text-destructive mt-1">{thresholdError}</p>}
        </SettingsRow>
        {canManage && thresholdDirty && !thresholdError && (
          <div className="flex justify-end pt-2">
            <SaveButton
              onSave={() => updateMutation.mutate({ confidenceThreshold: wsConfidenceThreshold })}
              onCancel={() => { setWsConfidenceThreshold(workspace?.confidenceThreshold ?? 60); setThresholdDirty(false); setThresholdError(""); }}
              isSaving={updateMutation.isPending}
              hasChanges={thresholdDirty}
              saveLabel="Save Changes"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Info" description="Your role in this workspace.">
        <SettingsDisplayRow label="Your role">
          <RoleBadge role={role} />
        </SettingsDisplayRow>
      </SettingsSection>

      <SettingsSection title="Automation" description="Control how AI agents behave across this workspace.">
        <SettingsRow label={
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-foreground">Auto-escalate low-confidence replies</p>
              <p className="text-[11px] text-fg-muted mt-0.5">When enabled, all agents in this workspace will route low-confidence replies to human review. Overrides per-agent settings when disabled.</p>
            </div>
          </div>
        }>
          <Switch
            checked={wsAutoEscalate}
            disabled={!canManage || updateMutation.isPending}
            onCheckedChange={(val) => {
              if (!canManage) return;
              setWsAutoEscalate(val);
              updateMutation.mutate({ autoEscalate: val });
            }}
          />
        </SettingsRow>
      </SettingsSection>

      {role === "owner" && (
        <SettingsSection title="Danger Zone" description="Irreversible actions for this workspace.">
          <SettingsButtonRow label="Delete workspace">
            <Button
              design="destructive"
              size="xs"
              onClick={() => {
                if (confirm(`Delete workspace "${workspace.name}"? This cannot be undone.`)) {
                  deleteWorkspaceMutation.mutate();
                }
              }}
              disabled={deleteWorkspaceMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteWorkspaceMutation.isPending ? "Deleting…" : "Delete workspace"}
            </Button>
          </SettingsButtonRow>
        </SettingsSection>
      )}
    </div>
  );
}
