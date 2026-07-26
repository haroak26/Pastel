import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, PageHeader, ContentPanel } from "@/components/ds";
import { useWorkspace } from "@/contexts/workspace-context";
import { Globe, Check, RefreshCw, Wifi, WifiOff, Settings as SettingsIcon, Sparkles, Users, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/button";
import {
  SettingsSection,
  SettingsDisplayRow,
} from "@/components/settings-ui";
import { useLocation } from "wouter";

function Slider({ value, onChange, min = 0, max = 100, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12.5px] text-fg-muted min-w-[40px]">{label || `${min}-${max}`}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none bg-border/60 accent-brand cursor-pointer"
      />
      <span className="text-[12.5px] font-semibold text-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-border/60'} border-none cursor-pointer`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function SettingsContent() {
  const { workspaces, activeWorkspace } = useWorkspace();
  const selectedWorkspace = activeWorkspace;
  const hasWorkspaces = workspaces.length > 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const ws = selectedWorkspace as { confidenceThreshold?: number; autoEscalate?: boolean } | null;
  const [confidenceThreshold, setConfidenceThreshold] = useState(ws?.confidenceThreshold ?? 60);
  const [autoEscalate, setAutoEscalate] = useState(ws?.autoEscalate ?? true);

  useEffect(() => {
    if (ws) {
      setConfidenceThreshold(ws.confidenceThreshold ?? 60);
      setAutoEscalate(ws.autoEscalate ?? true);
    }
  }, [ws?.confidenceThreshold, ws?.autoEscalate]);

  const checkConnection = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${selectedWorkspace?.id}/ping`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Connection failed");
      return res.json() as Promise<{
        ok: boolean;
        connected: boolean;
        message: string;
        lastEventAt: string | null;
      }>;
    },
  });

  const saveWorkspace = async (data: Record<string, unknown>) => {
    if (!selectedWorkspace?.id) return;
    try {
      await fetch(`/api/workspaces/${selectedWorkspace.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces'] });
      toast({ title: 'Saved', description: 'Workspace settings updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title="Workspace settings"
            icon={SettingsIcon}
            iconColor="#4682B4"
            className="[&_.lds-app-topbar-row]:min-h-[32px] [&_.lds-app-topbar-row]:px-4 [&_.lds-app-topbar-row]:py-1 [&_.lds-app-title]:text-[14px]"
          />
        }
        maxWidth="narrow"
      >
        {hasWorkspaces && selectedWorkspace ? (
          <div className="space-y-8">

          {/* Agent Confidence */}
          <SettingsSection
            title="AI Confidence Threshold"
            description="Minimum confidence score for AI agents to reply automatically. Below this threshold, tickets are escalated to humans."
          >
            <SettingsDisplayRow label="Threshold">
              <Slider
                value={confidenceThreshold}
                onChange={v => { setConfidenceThreshold(v); saveWorkspace({ confidenceThreshold: v }); }}
                min={0}
                max={100}
              />
            </SettingsDisplayRow>
          </SettingsSection>

          {/* Auto-Escalate */}
          <SettingsSection
            title="Auto-Escalation"
            description="Automatically escalate tickets to human agents when AI confidence is below the threshold."
          >
            <SettingsDisplayRow label="Enabled">
              <Toggle
                checked={autoEscalate}
                onChange={v => { setAutoEscalate(v); saveWorkspace({ autoEscalate: v }); }}
              />
            </SettingsDisplayRow>
          </SettingsSection>

          {/* Quick Links */}
          <SettingsSection
            title="Quick Links"
            description="Navigate to related configuration pages."
          >
            <SettingsDisplayRow label="Domains & DNS">
              <Button size="xs" design="ghost" onClick={() => navigate('/create/domain')}>
                <Globe size={12} /> Manage domains
              </Button>
            </SettingsDisplayRow>
            <SettingsDisplayRow label="AI Agents">
              <Button size="xs" design="ghost" onClick={() => navigate('/home/configure/agents')}>
                <Sparkles size={12} /> Configure agents
              </Button>
            </SettingsDisplayRow>
            <SettingsDisplayRow label="Team">
              <Button size="xs" design="ghost" onClick={() => navigate('/home/team')}>
                <Users size={12} /> Manage team
              </Button>
            </SettingsDisplayRow>
          </SettingsSection>

          {/* Verify connection */}
          <SettingsSection
            title="Check connection"
            description="Verify Pastel can receive data for this workspace."
            action={
              <Button
                size="xs"
                data-testid="button-check-connection"
                onClick={() => checkConnection.mutate()}
                disabled={checkConnection.isPending}
                isLoading={checkConnection.isPending}
              >
                {checkConnection.isPending ? null : "Check connection"}
              </Button>
            }
          >
            <SettingsDisplayRow label="Status">
              {checkConnection.isSuccess && checkConnection.data.connected ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Connected
                </span>
              ) : checkConnection.isSuccess && !checkConnection.data.connected ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-amber">
                  <WifiOff className="h-3.5 w-3.5" />{" "}
                  {checkConnection.data.message}
                </span>
              ) : checkConnection.isError ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
                  <WifiOff className="h-3.5 w-3.5" /> Connection failed
                </span>
              ) : (
                <span className="text-[12.5px] text-muted-foreground">
                  Not checked yet
                </span>
              )}
            </SettingsDisplayRow>
          </SettingsSection>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background px-8 py-12 text-center">
          <Globe className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No workspaces yet
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Add a workspace to configure settings.
          </p>
        </div>
      )}
      </ContentPanel>
    </AppPage>
  );
}

export { SettingsContent };

export default function Settings() {
  return <SettingsContent />;
}
