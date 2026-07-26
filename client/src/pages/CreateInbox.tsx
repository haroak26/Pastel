import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, Dropdown, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow } from "@/components/settings-ui";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { Mail } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";

const INBOX_TYPE_OPTIONS = [
  { value: "support", label: "Support" },
  { value: "regular", label: "Regular" },
];

export default function CreateInbox() {
  const [, setLocation] = useLocation();
  const { activeWorkspace } = useWorkspace();
  const domainSuffix = activeWorkspace?.domain ? `@${activeWorkspace.domain}` : '@';
  const [name, setName] = useState("");
  const [localPart, setLocalPart] = useState("");
  const [type, setType] = useState("support");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fullEmail = localPart + domainSuffix;
  const valid = name.trim().length >= 1 && localPart.trim().length >= 1 && domainSuffix.length > 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!valid) return;
    setCreating(true);
    try {
      let senderAvatar: string | undefined;
      if (logoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadRes = await fetch("/api/spaces/logo", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          throw new Error(d.message ?? "Logo upload failed");
        }
        const data = await uploadRes.json();
        senderAvatar = data.logoUrl;
        setUploading(false);
      }
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, emailAddress: fullEmail, spaceType: type === "regular" ? "email" : type, senderAvatar, workspaceId: activeWorkspace?.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Failed to create inbox");
      setLocation("/home/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <AppPage>
        <ContentPanel maxWidth="narrow">
          <div className="space-y-8 py-6">
            <SettingsSection title="New inbox" description="Create a new email inbox.">
              <SettingsRow label="Sender name">
                <TextInput
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Support"
                  required
                  autoFocus
                />
              </SettingsRow>
              <SettingsRow label="Email">
                <div className="flex items-center w-full text-[13px]">
                  <TextInput
                    value={localPart}
                    onChange={e => setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._+-]/g, ''))}
                    placeholder="support"
                    className="flex-1 min-w-0 px-3 py-1.5 border-r-0"
                  />
                  <span className="px-3 py-1.5 rounded-r-[8px] border border-border bg-surface-muted text-fg-muted font-mono select-none">
                    {domainSuffix}
                  </span>
                </div>
              </SettingsRow>
              <SettingsRow label="Inbox type">
                <Dropdown
                  value={type}
                  onChange={setType}
                  options={INBOX_TYPE_OPTIONS}
                  triggerClassName="inline-flex items-center justify-between gap-2 w-full cursor-pointer text-[13px] font-medium px-3 py-1.5 rounded-[14px] border border-border bg-background text-foreground hover:border-foreground/30 transition-colors min-w-[140px]"
                  showChevron
                />
              </SettingsRow>
              <SettingsRow label="Profile picture">
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-8 h-8 rounded-full object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center shrink-0 border border-border">
                      <Mail size={15} className="text-fg-faint" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleFileChange} className="hidden" id="inbox-logo" />
                    <label htmlFor="inbox-logo" className="cursor-pointer inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-input bg-background text-[12px] font-medium text-foreground hover:bg-surface-hover transition-colors whitespace-nowrap">
                      {uploading ? "Uploading…" : "Upload"}
                    </label>
                    <p className="text-[11px] text-fg-muted">Max 25MB</p>
                  </div>
                </div>
              </SettingsRow>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <SettingsRow label="">
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!valid || creating}
                  isLoading={creating}
                >
                  {uploading ? "Uploading…" : "Create inbox"}
                </Button>
              </SettingsRow>
            </SettingsSection>
          </div>
        </ContentPanel>
      </AppPage>
    </AppLayout>
  );
}
