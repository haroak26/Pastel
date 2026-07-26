import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, ContentPanel } from '@/components/ds';
import {
  SettingsSection, SettingsRow, SettingsDisplayRow, SaveButton,
} from "@/components/settings-ui";
import { TextInput } from '@/components/text-input';
import { useSpace } from '@/contexts/space-context';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, InboxIcon, Building2,
  Headphones, MessageSquare,
} from 'lucide-react';

const SPACE_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  support: 'Support',
  chat: 'Chat',
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

function SpaceAvatarInput({ avatarUrl, spaceId, onAvatarChange }: {
  avatarUrl: string | null;
  spaceId: string;
  onAvatarChange: (url: string | null) => void;
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
      const res = await fetch(`/api/spaces/${spaceId}/logo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Upload failed");
      }
      const data = await res.json();
      onAvatarChange(data.logoUrl);
      toast({ title: "Profile picture updated", variant: "success" });
    } catch (err: any) {
      toast({ title: err?.message ?? "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 border border-border" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center shrink-0 border border-border">
          <Building2 size={15} className="text-fg-faint" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={handleUpload} className="hidden" id="space-avatar-file" />
        <label htmlFor="space-avatar-file" className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-input bg-background text-[12px] font-medium text-foreground hover:bg-surface-hover transition-colors whitespace-nowrap">
          {uploading ? "Uploading…" : "Upload"}
        </label>
        <p className="text-[11px] text-fg-muted">Max 25MB</p>
      </div>
    </div>
  );
}

export default function SpaceSettings() {
  const { activeSpace } = useSpace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState(activeSpace?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setName(activeSpace?.name ?? '');
    setAvatarUrl(activeSpace?.senderAvatar ?? null);
  }, [activeSpace?.id]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string }) =>
      apiJson(`PATCH`, `/api/spaces/${activeSpace!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
      toast({ title: 'Space updated', variant: 'success' });
    },
    onError: (err) => toast({ title: err.message, variant: 'destructive' }),
  });

  if (!activeSpace) {
    return (
      <AppPage>
        <ContentPanel>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <InboxIcon size={28} className="mx-auto text-fg-faint mb-3" strokeWidth={1.5} />
              <p className="text-[13px] text-fg-muted">Select a space from the sidebar to view its settings.</p>
            </div>
          </div>
        </ContentPanel>
      </AppPage>
    );
  }

  const typeLabel = SPACE_TYPE_LABELS[activeSpace.spaceType] ?? activeSpace.spaceType;
  const nameDirty = name !== activeSpace.name;

  const spaceTypeIcon = activeSpace.spaceType === 'support'
    ? <Headphones size={11} className="mr-1" />
    : activeSpace.spaceType === 'chat'
    ? <MessageSquare size={11} className="mr-1" />
    : <Mail size={11} className="mr-1" />;

  return (
    <AppPage>
      <ContentPanel maxWidth="narrow">
        <SettingsSection title="General" description="Basic space information">
          <SettingsRow label="Sender name">
            <TextInput size="sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 sm:w-56 sm:flex-none"
            />
          </SettingsRow>
          <SettingsRow label="Profile picture">
            <SpaceAvatarInput
              avatarUrl={avatarUrl}
              spaceId={activeSpace.id}
              onAvatarChange={(url) => {
                setAvatarUrl(url);
                queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
              }}
            />
          </SettingsRow>
          <SettingsDisplayRow label="Email address">
            <span className="text-[13px] font-mono text-fg-muted">{activeSpace.emailAddress}</span>
          </SettingsDisplayRow>
          <SettingsDisplayRow label="Type">
            <span className="text-[13px] font-mono text-fg-muted">{typeLabel}</span>
          </SettingsDisplayRow>
          {nameDirty && (
            <SaveButton
              onSave={() => updateMutation.mutate({ name })}
              onCancel={() => setName(activeSpace.name)}
              isSaving={updateMutation.isPending}
              hasChanges={nameDirty}
              saveLabel="Save Changes"
            />
          )}
        </SettingsSection>
      </ContentPanel>
    </AppPage>
  );
}
