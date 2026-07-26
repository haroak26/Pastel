import { useEffect, useState, useRef } from "react";
import { ArrowRight, CheckCircle2, Check, Copy, Clock, Loader } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(var(--fg-muted))] hover:text-foreground transition-colors">
      {copied ? <Check size={11} className="text-[hsl(var(--success))]" /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type Props = {
  canonicalDomain: string;
  txtRecord: string;
  txtVerified: boolean;
  domainName: string;
  onDomainNameChange: (value: string) => void;
  onStartVerification: () => void;
  onCheckVerification: () => void;
  checkingVerification: boolean;
  isLoading: boolean;
};

export function DomainTxtStep({
  canonicalDomain,
  txtRecord,
  txtVerified,
  domainName,
  onDomainNameChange,
  onStartVerification,
  onCheckVerification,
  checkingVerification,
  isLoading,
}: Props) {
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (txtRecord && !txtVerified && pollCount < 12) {
      pollRef.current = setInterval(() => {
        setPollCount((c) => c + 1);
        onCheckVerification();
      }, 8000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    if (txtVerified && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [txtRecord, txtVerified, pollCount, onCheckVerification]);

  useEffect(() => {
    setPollCount(0);
  }, [canonicalDomain]);

  if (!txtRecord || !canonicalDomain) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="domain" className="text-[13px] font-medium text-foreground">
            Domain to verify
          </label>
          <TextInput
            id="domain"
            type="text"
            placeholder="example.com"
            value={domainName}
            onChange={(e) => onDomainNameChange(e.target.value.toLowerCase())}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && domainName.trim()) onStartVerification(); }}
            className="w-full"
          />
          <p className="text-[11px] text-[hsl(var(--fg-faint))]">
            You&apos;ll need access to your domain&apos;s DNS settings to add a TXT record.
          </p>
        </div>
        <Button onClick={onStartVerification} isLoading={isLoading} disabled={!domainName.trim()} size="md" className="w-full">
          Get verification record <ArrowRight size={14} />
        </Button>
      </div>
    );
  }

  if (!txtVerified) {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[13px] text-foreground font-medium">
            Add this TXT record to <strong>{canonicalDomain}</strong>
          </p>
          <div className="space-y-2.5 rounded-xl border border-border bg-[hsl(var(--surface-muted))] p-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[hsl(var(--fg-faint))] uppercase tracking-wide w-12 shrink-0">
                Type
              </span>
              <code className="text-[12px] font-mono text-foreground bg-background rounded-md px-2 py-0.5 border border-border">
                TXT
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[hsl(var(--fg-faint))] uppercase tracking-wide w-12 shrink-0">
                Name
              </span>
              <code className="text-[12px] font-mono text-foreground bg-background rounded-md px-2 py-0.5 border border-border">
                @
              </code>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-[hsl(var(--fg-faint))] uppercase tracking-wide w-12 shrink-0 pt-0.5">
                Value
              </span>
              <div className="flex-1 min-w-0">
                <code className="text-[12px] font-mono text-foreground bg-background rounded-md px-2 py-0.5 border border-border break-all block">
                  {txtRecord}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <CopyButton text={txtRecord} />
            </div>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-[hsl(var(--fg-faint))]">
            <Clock size={13} className="shrink-0 mt-0.5 text-[hsl(var(--fg-faint))]" />
            <span>
              DNS changes can take 1-10 minutes to propagate. We&apos;ll automatically check every 8 seconds.
              {pollCount > 0 && ` (Check #${pollCount + 1})`}
            </span>
          </div>
        </div>
        <Button onClick={onCheckVerification} isLoading={checkingVerification} size="md" className="w-full">
          Verify TXT record <ArrowRight size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-xl bg-[hsl(var(--success-muted))] border border-[hsl(var(--success)/0.2)] px-3 py-2.5">
        <CheckCircle2 size={16} className="text-[hsl(var(--success))] shrink-0" />
        <span className="text-[13px] font-medium text-[hsl(var(--success))]">Domain verified</span>
      </div>
      <Button onClick={onCheckVerification} isLoading={checkingVerification} size="md" className="w-full">
        Continue <ArrowRight size={14} />
      </Button>
    </div>
  );
}