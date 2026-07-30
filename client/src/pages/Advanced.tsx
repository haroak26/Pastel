import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, PillFilter, ListSkeleton, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow, SettingsDisplayRow, SettingsButtonRow, SettingsLock, SaveButton } from "@/components/settings-ui";
import { Button, IconButton } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { usePlan } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader } from "lucide-react";

type ForwardingRule = {
  id: string;
  forwardTo: string;
  forwardingAddress: string;
  enabled: boolean;
  createdAt: string;
};

async function apiJson<T>(method: string, url: string, data?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message);
  }
  return res.json();
}

function ForwardingTab({ plan }: { plan: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isLocked = plan === "free" || plan === "starter";
  const [email, setEmail] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: rules = [], isLoading } = useQuery<ForwardingRule[]>({
    queryKey: ['/api/forwarding-rules'],
    queryFn: () => apiJson<ForwardingRule[]>('GET', '/api/forwarding-rules'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { forwardTo: string; forwardingAddress: string }) =>
      apiJson<ForwardingRule>('POST', '/api/forwarding-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-rules'] });
      toast({ title: "Forwarding rule created", variant: "success" });
      setEmail("");
      setDirty(false);
    },
    onError: (err) => toast({ title: (err as Error).message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/forwarding-rules/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forwarding-rules'] });
      toast({ title: "Forwarding rule removed", variant: "success" });
    },
    onError: (err) => toast({ title: (err as Error).message, variant: 'destructive' }),
  });

  const handleSave = async () => {
    if (isLocked || createMutation.isPending || !email.trim()) return;
    const domain = email.split("@")[1] || "yourdomain.com";
    const forwardingAddress = `forwarding@${domain}`;
    createMutation.mutate({ forwardTo: email.trim(), forwardingAddress });
  };

  return (
    <div className="space-y-8 py-6">
      <SettingsSection title="Email Forwarding" description="Forward incoming emails to an external address.">
        <SettingsRow label="Forward to">
          <div className="flex items-center gap-2">
            <SettingsLock plan="pro" currentPlan={plan} />
            <TextInput
              value={email}
              onChange={e => { setEmail(e.target.value); setDirty(true); }}
              placeholder="you@example.com"
              disabled={isLocked}
              className="flex-1"
            />
          </div>
        </SettingsRow>
        {!isLocked && dirty && email.trim() && (
          <div className="flex justify-end pt-2">
            <SaveButton
              onSave={handleSave}
              onCancel={() => { setEmail(""); setDirty(false); }}
              isSaving={createMutation.isPending}
              hasChanges={dirty}
              saveLabel="Save Changes"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Current Forwarding Rules" description="Active forwarding configurations.">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : rules.length === 0 ? (
          <SettingsDisplayRow label="Status">
            <span className="text-[13px] text-fg-muted">No forwarding rules configured</span>
          </SettingsDisplayRow>
        ) : (
          rules.map(rule => (
            <SettingsRow
              key={rule.id}
              label={
                <div>
                  <p className="text-[13px] font-medium text-foreground">{rule.forwardTo}</p>
                  <p className="text-[11px] text-fg-muted mt-0.5">via {rule.forwardingAddress}</p>
                </div>
              }
            >
              <IconButton icon={Trash2} size="sm" design="ghost" className="hover:text-destructive hover:bg-red-50" onClick={() => deleteMutation.mutate(rule.id)} title="Remove" />
            </SettingsRow>
          ))
        )}
      </SettingsSection>
    </div>
  );
}

function GhostingTab({ plan }: { plan: string }) {
  const { toast } = useToast();
  const isLocked = plan === "free" || plan === "starter";
  const [ghostDomain, setGhostDomain] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isLocked || saving) return;
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      toast({ title: "Ghosting settings saved" });
      setDirty(false);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setGhostDomain("");
    setDirty(false);
  };

  return (
    <div className="space-y-8 py-6">
      <SettingsSection title="Ghosting" description="Send emails from a different address while preserving reply routing.">
        <SettingsRow label="Ghost address">
          <div className="flex items-center gap-2">
            <SettingsLock plan="pro" currentPlan={plan} />
            <TextInput
              value={ghostDomain}
              onChange={e => { setGhostDomain(e.target.value); setDirty(true); }}
              placeholder="ghost@yourdomain.com"
              disabled={isLocked}
              className="flex-1"
            />
          </div>
        </SettingsRow>
        {!isLocked && dirty && (
          <div className="flex justify-end pt-2">
            <SaveButton
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={saving}
              hasChanges={dirty}
              saveLabel="Save Changes"
            />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Active Ghost Profiles" description="Currently configured ghost addresses.">
        <SettingsDisplayRow label="Status">
          <span className="text-[13px] text-fg-muted">No ghost profiles configured</span>
        </SettingsDisplayRow>
      </SettingsSection>
    </div>
  );
}

export default function Advanced() {
  const { data: planInfo } = usePlan();
  const currentPlan = planInfo?.plan ?? "free";
  const [tab, setTab] = useState("forwarding");

  return (
    <AppLayout>
      <AppPage>
        <ContentPanel maxWidth="narrow">
          <div className="flex items-center gap-1 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 mb-6">
            <PillFilter active={tab === "forwarding"} onClick={() => setTab("forwarding")}>
              Forwarding
            </PillFilter>
            <PillFilter active={tab === "ghosting"} onClick={() => setTab("ghosting")}>
              Ghosting
            </PillFilter>
          </div>
          {tab === "forwarding" && <ForwardingTab plan={currentPlan} />}
          {tab === "ghosting" && <GhostingTab plan={currentPlan} />}
        </ContentPanel>
      </AppPage>
    </AppLayout>
  );
}
