import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow } from "@/components/settings-ui";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { Building2 } from "lucide-react";

export default function CreateWorkspace() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = name.trim().length >= 2 && domain.trim().length >= 3;

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
      let logoUrl: string | undefined;
      if (logoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("logo", logoFile);
        const uploadRes = await fetch("/api/workspaces/logo", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          throw new Error(d.message ?? "Logo upload failed");
        }
        const data = await uploadRes.json();
        logoUrl = data.logoUrl;
        setUploading(false);
      }
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, domain, logoUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Failed to create workspace");
      setLocation("/account/profile");
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
            <SettingsSection title="New workspace" description="Create a workspace for your team.">
              <SettingsRow label="Name">
                <TextInput
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Acme Inc."
                  size="sm"
                  required
                  autoFocus
                />
              </SettingsRow>
              <SettingsRow label="Domain">
                <div className="flex flex-col gap-1 w-full">
                  <TextInput
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="acme.com"
                    size="sm"
                    required
                  />
                  <p className="text-[11px] text-fg-muted">e.g. example.com, *.example.com, localhost:3000</p>
                </div>
              </SettingsRow>
              <SettingsRow label="Logo">
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-8 h-8 rounded-[10px] object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-[10px] bg-surface-active flex items-center justify-center shrink-0 border border-border">
                      <Building2 size={15} className="text-fg-faint" />
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" id="ws-logo" />
                  <label htmlFor="ws-logo" className="cursor-pointer inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-input bg-background text-[12px] font-medium text-foreground hover:bg-surface-hover transition-colors">
                    Upload
                  </label>
                </div>
                <p className="text-[11px] text-fg-muted">PNG, JPEG, GIF, WebP, SVG. Max 10MB.</p>
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
                  {uploading ? "Uploading logo…" : "Create workspace"}
                </Button>
              </SettingsRow>
            </SettingsSection>
          </div>
        </ContentPanel>
      </AppPage>
    </AppLayout>
  );
}
