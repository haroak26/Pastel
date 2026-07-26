import { useState } from "react";
import { Check, Copy, RefreshCw, Loader, ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import type { DnsRecord } from "./types";

function StatusDot({ status }: { status?: string }) {
  const base = "inline-block w-2 h-2 rounded-full shrink-0 mt-0.5";
  switch (status) {
    case "verified": return <span className={`${base} bg-success`} title="Verified" />;
    case "missing":  return <span className={`${base} bg-danger`}  title="Missing" />;
    case "mismatch": return <span className={`${base} bg-warning`} title="Mismatch" />;
    default:         return <span className={`${base} bg-border`}  title="Not checked" />;
  }
}

function CopyValue({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 text-fg-faint hover:text-foreground transition-colors"
      title="Copy value"
    >
      {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="px-3 py-2.5 border-b border-border last:border-0 animate-pulse space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-surface-hover shrink-0" />
        <span className="w-12 h-3.5 rounded bg-surface-hover" />
        <span className="flex-1 h-3 rounded bg-surface-hover" />
      </div>
      <div className="ml-4 h-3 rounded bg-surface-hover w-3/4" />
    </div>
  );
}

type Props = {
  canonicalDomain: string;
  records: DnsRecord[];
  allVerified: boolean;
  isLoading: boolean;
  onCheckAgain: () => void;
  onContinue: () => void;
};

export function DnsRecordsStep({
  canonicalDomain,
  records,
  allVerified,
  isLoading,
  onCheckAgain,
  onContinue,
}: Props) {
  const isChecking = records.length > 0 && records.every((r) => r.status === "pending");
  const hasRecords = records.length > 0;
  const verifiedCount = records.filter((r) => r.status === "verified").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-fg-faint">
          Records for <strong className="text-foreground font-mono">{canonicalDomain}</strong>
        </p>
        {hasRecords && (
          <span className={`text-[11px] font-semibold ${allVerified ? "text-success" : "text-fg-faint"}`}>
            {verifiedCount}/{records.length} verified
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
        {isChecking ? (
          <>
            <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
          </>
        ) : hasRecords ? (
          records.map((record) => {
            const typeLabel = (record.kind ?? record.type ?? "").toUpperCase();
            const expectedValue = record.expected ?? record.value;
            return (
              <div key={`${record.type}-${record.name}`} className="px-3 py-2.5 space-y-1">
                <div className="flex items-start gap-2">
                  <StatusDot status={record.status} />
                  <span className="w-12 shrink-0 text-[11px] font-bold font-mono text-brand uppercase leading-[1.4]">
                    {typeLabel}
                  </span>
                  <span className="flex-1 min-w-0 text-[12px] text-foreground font-mono break-all leading-[1.4]">
                    {record.name}
                  </span>
                </div>
                {expectedValue ? (
                  <div className="flex items-start gap-2 pl-[22px]">
                    <code className="flex-1 min-w-0 text-[11px] text-fg-muted font-mono break-all leading-relaxed">
                      {expectedValue}
                    </code>
                    <CopyValue text={expectedValue} />
                  </div>
                ) : (
                  <div className="pl-[22px]">
                    <span className="text-[11px] text-fg-faint italic">
                      {record.status === "verified" ? "Configured" : record.message || "Pending..."}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader className="h-4 w-4 animate-spin text-fg-faint" />
            <p className="text-[12px] text-fg-faint">Loading DNS records…</p>
          </div>
        )}
      </div>

      <p className="text-[11px] text-fg-faint leading-relaxed">
        DNS changes can take 1–10 minutes to propagate. Click <Copy size={10} className="inline" /> to copy a value.
      </p>

      <div className="space-y-2">
        <Button onClick={onCheckAgain} isLoading={isLoading} size="md" className="w-full" design="secondary">
          <RefreshCw size={14} />
          Check again
        </Button>
        {allVerified && (
          <Button onClick={onContinue} size="md" className="w-full">
            Continue <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
