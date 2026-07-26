import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowLeft, Copy, Check,
  Globe, Mail, Headphones,
  RefreshCw, Loader, CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { AppPage, PageHeader, PillFilter, ContentPanel } from "@/components/ds";
import { StepDots } from "@/components/step-dots";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type InboxTypeOption = "support" | "regular";

const INBOX_TYPE_OPTIONS = [
  { value: "support" as const, label: "Support", icon: Headphones, desc: "Tickets, agents, and auto-reply for customer support" },
  { value: "regular" as const, label: "Regular", icon: Mail, desc: "General email with bugs and features" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Button onClick={copy} design="ghost" size="xs" className="gap-1">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

const TOTAL_STEPS = 4;

export default function CreateDomain() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 0: Workspace name + domain
  const [workspaceName, setWorkspaceName] = useState("");
  const [domain, setDomain] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [txtVerified, setTxtVerified] = useState(false);
  const [domainId, setDomainId] = useState<number | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Step 1: DNS records
  const [dnsRecords, setDnsRecords] = useState<{ type: string; name: string; value: string; desc: string }[]>([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(false);
  const [verifyingDns, setVerifyingDns] = useState(false);

  // Step 2: Inbox creation
  const [inboxName, setInboxName] = useState("");
  const [inboxLocalPart, setInboxLocalPart] = useState("");
  const [inboxType, setInboxType] = useState<InboxTypeOption>("support");
  const emailAddress = inboxLocalPart.trim() ? `${inboxLocalPart.trim()}@${domain}` : "";

  // Load DNS records when entering step 1
  useEffect(() => {
    if (step === 1 && domainId) {
      setDnsLoading(true);
      fetch(`/api/email-domains/${domainId}/dns`, { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (data.records) {
            setDnsRecords(data.records.map((r: any) => ({
              type: r.type,
              name: r.name,
              value: r.value,
              desc: r.desc ?? r.explanation ?? "",
            })));
          }
        })
        .catch(() => setError("Failed to load DNS records"))
        .finally(() => setDnsLoading(false));
    }
  }, [step, domainId]);

  const advance = () => { setError(""); setStep(s => s + 1); };
  const goBack = () => { setError(""); setStep(s => Math.max(0, s - 1)); };

  // Step 0 — Start domain verification
  const handleStartVerification = async () => {
    if (!workspaceName.trim()) { setError("Enter a workspace name"); return; }
    const val = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!val || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(val)) {
      setError("Enter a valid domain (e.g. example.com)");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/domain/start-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ domain: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to start verification");
      setDomain(data.domain);
      setDomainId(data.domainId);
      if (data.alreadyVerified) {
        setTxtVerified(true);
        setVerificationCode("");
      } else {
        setVerificationCode(data.verificationCode);
        setTxtVerified(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start verification");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 0 — Check TXT verification
  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/domain/check-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Verification failed");
      setTxtVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setCheckingVerification(false);
    }
  };

  // Step 1 — Verify DNS records
  const handleVerifyDns = async () => {
    if (!domainId) { setError("Domain not found"); return; }
    setVerifyingDns(true);
    setError("");
    try {
      const res = await fetch(`/api/email-domains/${domainId}/verify`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to verify DNS");
      const missing: string[] = [];
      if (!data.mxVerified) missing.push("MX");
      if (!data.spfVerified) missing.push("SPF");
      if (!data.dkimVerified) missing.push("DKIM");
      if (!data.dmarcVerified) missing.push("DMARC");
      if (missing.length > 0) {
        setError(`Records not yet found: ${missing.join(", ")}. DNS changes can take up to 48 hours.`);
      } else {
        setDnsVerified(true);
        setError("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify DNS");
    } finally {
      setVerifyingDns(false);
    }
  };

  // Step 2 — Create inbox
  const handleCreateSpace = async () => {
    if (!inboxName.trim()) { setError("Enter a sender name"); return; }
    if (!inboxLocalPart.trim()) { setError("Enter an email local part"); return; }
    if (!emailAddress || !/\S+@\S+\.\S+/.test(emailAddress)) { setError("Enter a valid email address"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: inboxName.trim(), emailAddress: emailAddress.toLowerCase(), spaceType: inboxType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create inbox" }));
        throw new Error(err.message);
      }
      advance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create inbox");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 — Done
  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/email-domains"] });
    queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
    setLocation("/home/inbox");
  };

  const stepTitles = [
    "Add your domain",
    "Configure DNS records",
    "Create your first inbox",
    "You're all set!",
  ];

  return (
      <AppPage>
        <ContentPanel
          header={<PageHeader title={stepTitles[step]} />}
          maxWidth="narrow"
        >
          <StepDots current={step} total={TOTAL_STEPS} />

          {/* ── Step 0: Domain + TXT Verification ── */}
          {step === 0 && (
            <div className="space-y-5">
              {!verificationCode && !txtVerified ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-foreground">Workspace name</label>
                    <TextInput
                      placeholder="My Company"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      autoFocus
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-foreground">Your domain</label>
                    <TextInput
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") handleStartVerification(); }}
                      className="w-full"
                    />
                  </div>
                  {error && <p className="text-[12px] text-destructive">{error}</p>}
                  <Button onClick={handleStartVerification} isLoading={isLoading} className="w-full">
                    Get verification record <ArrowRight size={14} />
                  </Button>
                </>
              ) : !txtVerified ? (
                <>
                  <div className="space-y-3">
                    <p className="text-[13px] text-foreground">
                      Add this TXT record to <strong>{domain}</strong> to prove ownership:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 shrink-0">Name</span>
                        <code className="text-[13px] font-mono text-foreground bg-neutral-50 rounded px-2 py-0.5">@</code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 shrink-0 pt-0.5">Value</span>
                        <code className="text-[13px] font-mono text-foreground bg-neutral-50 rounded px-2 py-0.5 break-all">{verificationCode}</code>
                      </div>
                      <CopyButton text={verificationCode} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">DNS changes can take a few minutes. Click verify once you've added the record.</p>
                  </div>
                  {error && <p className="text-[12px] text-destructive">{error}</p>}
                  <div className="flex gap-2">
                    <Button design="ghost" onClick={() => { setVerificationCode(""); setTxtVerified(false); }}>
                      <ArrowLeft size={14} />
                    </Button>
                    <Button onClick={handleCheckVerification} isLoading={checkingVerification} className="flex-1">
                      {checkingVerification ? (
                        <><RefreshCw size={14} className="animate-spin" /> Checking DNS...</>
                      ) : (
                        <>Verify <ArrowRight size={14} /></>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-emerald-700">Domain verified</p>
                      <p className="text-[11px] text-emerald-600"><strong>{domain}</strong> has been verified.</p>
                    </div>
                  </div>
                  {error && <p className="text-[12px] text-destructive">{error}</p>}
                  <Button onClick={advance} className="w-full">
                    Configure DNS records <ArrowRight size={14} />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Step 1: DNS Records ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-[13px] text-foreground font-medium">
                  Add these DNS records to <strong>{domain}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Required for email delivery. Add them all, then click verify.
                </p>
              </div>

              {dnsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {dnsRecords.map((record) => (
                    <div key={`${record.type}-${record.name}`} className="py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center px-2 h-5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 font-mono">
                          {record.type}
                        </span>
                        <code className="text-[11px] font-mono text-foreground">{record.name}</code>
                        <CopyButton text={`${record.name}  ${record.value}`} />
                      </div>
                      <code className="text-[11px] font-mono text-muted-foreground block ml-0 pl-1 break-all">{record.value}</code>
                      {record.desc && (
                        <p className="text-[10px] text-muted-foreground mt-1 pl-1">{record.desc}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dnsVerified && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span className="text-[13px] font-medium">All DNS records verified!</span>
                </div>
              )}

              {error && <p className="text-[12px] text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button design="ghost" onClick={goBack}>
                  <ArrowLeft size={14} />
                </Button>
                {dnsVerified ? (
                  <Button onClick={advance} className="flex-1">
                    Create inbox <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button onClick={handleVerifyDns} isLoading={verifyingDns} className="flex-1">
                    {verifyingDns ? (
                      <><RefreshCw size={14} className="animate-spin" /> Checking...</>
                    ) : (
                      <>I've added the records <ArrowRight size={14} /></>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Create Inbox ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-foreground">Sender name</label>
                  <TextInput
                    placeholder="e.g. Support"
                    value={inboxName}
                    onChange={(e) => setInboxName(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-foreground">Email address</label>
                  <div className="flex items-center gap-2">
                    <TextInput
                      placeholder="hello"
                      value={inboxLocalPart}
                      onChange={(e) => setInboxLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._+-]/g, ""))}
                      className="w-32 font-mono"
                    />
                    <span className="text-[13px] text-muted-foreground">@</span>
                    <span className="text-[13px] font-mono text-foreground">{domain}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[13px] font-medium text-foreground mb-2">Space type</p>
                  <div className="flex flex-wrap gap-2">
                    {INBOX_TYPE_OPTIONS.map((opt) => (
                      <PillFilter key={opt.value} active={inboxType === opt.value} onClick={() => setInboxType(opt.value)}>
                        <opt.icon size={12} />
                        {opt.label}
                      </PillFilter>
                    ))}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {INBOX_TYPE_OPTIONS.find(o => o.value === inboxType)?.desc}
                  </p>
                </div>

                {emailAddress && (
                  <div className="pt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Preview: <code className="text-[12px] font-mono text-foreground ml-1">{emailAddress}</code>
                    </p>
                  </div>
                )}
              </div>

              {error && <p className="text-[12px] text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button design="ghost" onClick={goBack}>
                  <ArrowLeft size={14} />
                </Button>
                <Button onClick={handleCreateSpace} isLoading={isLoading} className="flex-1">
                  Create space <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div
                style={{
                  width: 64, height: 64, borderRadius: 20, background: "#1e1e1e",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                }}
              >
                <CheckCircle2 size={28} style={{ color: "#fff" }} />
              </div>
              <div>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
                  Your domain <strong>{domain}</strong> is configured and your inbox is ready.
                </p>
              </div>
              <Button onClick={handleFinish} className="w-full" style={{ marginTop: 32 }}>
                Go to inbox <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </ContentPanel>
      </AppPage>
  );
}
