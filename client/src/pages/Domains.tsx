import React, { useState } from "react";
import { Button, IconButton } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { Badge, DataTable, EmptyState } from "@/components/ds";
import type { DataTableColumn } from "@/components/ds";
import {
  Check, Copy, ArrowRight, ArrowLeft, Globe,
  ChevronRight, RefreshCw, Loader, AlertCircle, CheckCircle2,
  Upload, Trash2,
} from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import {
  SettingsSection,
  SettingsRow,
  SettingsDisplayRow,
  SettingsButtonRow,
  SettingsLock,
  SaveButton,
} from "@/components/settings-ui";
import { OptionsPage } from "@/components/options-page";
import { usePlan } from "@/hooks/use-user";

interface ApiDomain {
  id: number;
  userId: number;
  domain: string;
  mxVerified: boolean;
  spfVerified: boolean;
  dkimVerified: boolean;
  dmarcVerified: boolean;
  bimiUrl?: string | null;
  bimiVerified?: boolean;
  brandLogo?: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  explanation?: string;
}

function VerBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? "success" : "danger"} size="sm">
      {ok ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      {label}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Button onClick={copy} design="ghost" size="xs" className="gap-1">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function DomainDetail({ domain, onBack }: { domain: ApiDomain; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [current, setCurrent] = useState(domain);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: dnsData, isLoading: dnsLoading, isError: dnsError, error: dnsErr } = useQuery<{ domain: string; records: DnsRecord[] }>({
    queryKey: ['/api/email-domains', domain.id, 'dns'],
    queryFn: async () => {
      const res = await fetch(`/api/email-domains/${domain.id}/dns`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    retry: 1,
  });

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/email-domains/${domain.id}/verify`, { credentials: 'include' });
      const data = await res.json();
      const updated = { ...current, ...data };
      setCurrent(updated);
      queryClient.invalidateQueries({ queryKey: ['/api/email-domains'] });
    } catch { /* ignore */ }
    finally { setVerifying(false); }
  };

  const dnsColumns: DataTableColumn<DnsRecord>[] = [
    {
      key: 'type',
      header: 'Type',
      width: 80,
      render: (r) => (
        <span className="inline-flex items-center px-[6px] py-[2px] rounded bg-indigo-50 text-indigo-700 font-mono text-[10.5px] font-bold">
          {r.type}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <code className="text-[11.5px] font-mono text-foreground break-all">{r.name}</code>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: (r) => (
        <div className="flex items-start gap-2">
          <code className="text-[11.5px] font-mono text-muted-foreground break-all flex-1">{r.value}</code>
          <CopyButton text={r.value} />
        </div>
      ),
    },
  ];

  const dnsRows = dnsData?.records ?? [];
  const verifiedCount = [current.mxVerified, current.spfVerified, current.dkimVerified, current.dmarcVerified, current.bimiUrl ? current.bimiVerified : null]
    .filter(v => v === true).length;
  const totalChecks = current.bimiUrl ? 5 : 4;

  return (
    <div>
      <Button onClick={onBack} design="ghost" size="xs" className="mb-6">
        <ArrowLeft size={14} /> Domains
      </Button>

      <div className="space-y-8">
        <SettingsSection title={current.domain} description={`Added ${new Date(current.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}>
          <SettingsRow label="Verification">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                <VerBadge ok={current.mxVerified} label="MX" />
                <VerBadge ok={current.spfVerified} label="SPF" />
                <VerBadge ok={current.dkimVerified} label="DKIM" />
                <VerBadge ok={current.dmarcVerified} label="DMARC" />
                {current.bimiUrl && <VerBadge ok={!!current.bimiVerified} label="BIMI" />}
              </div>
              <span className={cn(
                "text-[12px] font-medium",
                verifiedCount === totalChecks ? "text-green-600" : "text-muted-foreground"
              )}>
                {verifiedCount}/{totalChecks} verified
              </span>
            </div>
          </SettingsRow>
          <SettingsButtonRow label="Actions">
            <Button design="ghost" size="xs" onClick={handleVerify} disabled={verifying}>
              {verifying ? <Loader size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {verifying ? 'Verifying...' : 'Verify DNS'}
            </Button>
          </SettingsButtonRow>
          {current.lastCheckedAt && (
            <SettingsDisplayRow label="Last checked">
              {new Date(current.lastCheckedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </SettingsDisplayRow>
          )}
        </SettingsSection>

        <SettingsSection title="Brand Logo" description="Displayed on public pages and throughout the app for emails from this domain.">
          {current.brandLogo ? (
            <SettingsRow label="Logo">
              <div className="flex items-center gap-3">
                <img
                  src={current.brandLogo}
                  alt="Brand logo"
                  className="h-10 w-10 rounded-lg border border-border object-contain bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-foreground font-medium">Uploaded</span>
                  <Button
                    onClick={async () => {
                      try {
                        await fetch(`/api/email-domains/${current.id}/logo`, { method: 'DELETE', credentials: 'include' });
                        setCurrent({ ...current, brandLogo: null });
                        queryClient.invalidateQueries({ queryKey: ['/api/email-domains'] });
                      } catch {}
                    }}
                    design="destructive"
                    size="xs"
                  >
                    <Trash2 size={10} /> Remove
                  </Button>
                </div>
              </div>
            </SettingsRow>
          ) : (
            <SettingsRow label="Logo">
              <label className="inline-flex items-center justify-center h-9 px-4 rounded-[10px] border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                <Upload size={12} className="mr-1.5" />
                {uploadingLogo ? 'Uploading...' : 'Upload logo'}
                <input
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.svg,.webp"
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingLogo(true);
                    try {
                      const fd = new FormData();
                      fd.append('logo', file);
                      const res = await fetch(`/api/email-domains/${current.id}/logo`, { method: 'POST', credentials: 'include', body: fd });
                      if (res.ok) {
                        const data = await res.json();
                        setCurrent({ ...current, brandLogo: data.brandLogo });
                        queryClient.invalidateQueries({ queryKey: ['/api/email-domains'] });
                      }
                    } catch {}
                    setUploadingLogo(false);
                    e.target.value = '';
                  }}
                />
              </label>
            </SettingsRow>
          )}
        </SettingsSection>

        <SettingsSection title="DNS Records" description="Configure these records at your domain registrar to enable email delivery.">
          {dnsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Loading DNS records...</span>
            </div>
          ) : dnsError ? (
            <div className="py-10 text-center">
              <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
              <p className="text-[13px] text-red-600 font-medium mb-1">Failed to load DNS records</p>
              <p className="text-[12px] text-muted-foreground">{(dnsErr as Error)?.message ?? "Could not retrieve DNS configuration."}</p>
            </div>
          ) : dnsRows.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-border rounded-2xl">
              <p className="text-[13px] text-muted-foreground">No DNS records available.</p>
              <p className="text-[12px] text-muted-foreground mt-1">Click Verify DNS to check your configuration.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <DataTable
                columns={dnsColumns}
                rows={dnsRows}
                getRowKey={(_, i) => String(i)}
                className="border-0 rounded-none"
              />
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

export default function Domains() {
  const queryClient = useQueryClient();
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const { data: planInfo } = usePlan();

  const { data: apiDomains = [], isLoading, isError, error } = useQuery<ApiDomain[]>({
    queryKey: ['/api/email-domains'],
    queryFn: async () => {
      const res = await fetch('/api/email-domains', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    retry: 1,
  });

  const selectedDomain = apiDomains.find(d => d.id === selectedDomainId) ?? null;

  const handleAddDomain = async () => {
    const val = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!val) { setAddError('Enter a domain name.'); return; }
    setAdding(true); setAddError('');
    try {
      const res = await fetch('/api/email-domains', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: val }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.message ?? 'Failed to add domain.'); return; }
      queryClient.invalidateQueries({ queryKey: ['/api/email-domains'] });
      setShowAddForm(false);
      setNewDomain('');
    } catch { setAddError('Network error.'); }
    finally { setAdding(false); }
  };

  if (selectedDomain) {
    return <DomainDetail domain={selectedDomain} onBack={() => setSelectedDomainId(null)} />;
  }

  return (
    <OptionsPage view="list" onAdd={() => setShowAddForm(true)} addLabel="Add Domain" standalone={false}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Loading domains...</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load domains"
          description={(error as Error)?.message ?? "Could not fetch your domains. Please try again."}
          actions={
            <Button design="ghost" size="xs" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/email-domains'] })}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          }
        />
      ) : apiDomains.length === 0 && !showAddForm ? (
        <EmptyState
          icon={Globe}
          title="No domains connected"
          description="Add your first domain to start receiving emails"
          actions={
            <Button onClick={() => setShowAddForm(true)}>
              Connect Domain <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      ) : (
        <div className="py-4 space-y-8">
          {showAddForm ? (
            <SettingsSection title={<span className="inline-flex items-center gap-2">Add a domain <SettingsLock plan="pro" currentPlan={planInfo?.plan} /></span>} description="Enter the domain you want to connect for email delivery.">
              <SettingsRow label="Domain">
                <TextInput
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                  autoFocus
                  className="min-w-0 flex-1 sm:w-56 sm:flex-none"
                />
              </SettingsRow>
              {addError && <p className="text-[12px] text-destructive px-1 pb-1">{addError}</p>}
              <SaveButton
                onSave={handleAddDomain}
                onCancel={() => { setShowAddForm(false); setAddError(''); setNewDomain(''); }}
                isSaving={adding}
                saveLabel="Add domain"
              />
            </SettingsSection>
          ) : null}

          {apiDomains.length > 0 && (
            <SettingsSection title="Your Domains" description="Manage your connected domains.">
              {apiDomains.map((domain) => {
                const allVerified = domain.mxVerified && domain.spfVerified && domain.dkimVerified && domain.dmarcVerified;
                const date = new Date(domain.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <SettingsRow
                    key={domain.id}
                    label={
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium">{domain.domain}</span>
                        {allVerified ? (
                          <Badge tone="success">Verified</Badge>
                        ) : (
                          <Badge tone="warning">Pending</Badge>
                        )}
                      </div>
                    }
                  >
                    <span className="text-[11px] text-muted-foreground">{date}</span>
                    <IconButton icon={ChevronRight} size="sm" design="ghost" onClick={() => setSelectedDomainId(domain.id)} title="View details" />
                  </SettingsRow>
                );
              })}
            </SettingsSection>
          )}
        </div>
      )}
    </OptionsPage>
  );
}
