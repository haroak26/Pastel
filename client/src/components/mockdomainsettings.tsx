import { CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Badge } from "@/components/ds";

const mockDomain = {
  domain: "getlatte.app",
  mxVerified: true,
  spfVerified: true,
  dkimVerified: true,
  dmarcVerified: true,
  bimiVerified: false,
};

const dnsRecords = [
  { type: "MX", name: "@", value: "mx1.stalwart.email" },
  { type: "SPF", name: "@", value: "v=spf1 include:_spf.latte.app ~all" },
  { type: "DKIM", name: "dkim._domainkey", value: "v=DKIM1; p=MIGfMA0GCSqGSIb3DQEBAQ..." },
  { type: "DMARC", name: "_dmarc", value: "v=DMARC1; p=quarantine; rua=dmarc@..." },
];

function VerBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? "success" : "danger"} size="sm">
      {ok ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      {label}
    </Badge>
  );
}

export function MockDomainSettings() {
  return (
    <div className="border border-border/50 rounded-2xl bg-background pointer-events-none select-none mockup-glow">
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20" />
      <div className="overflow-hidden rounded-2xl">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-foreground">{mockDomain.domain}</h3>
            <span className="text-[10px] text-fg-faint">Created Jan 15</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <VerBadge ok={mockDomain.mxVerified} label="MX" />
            <VerBadge ok={mockDomain.spfVerified} label="SPF" />
            <VerBadge ok={mockDomain.dkimVerified} label="DKIM" />
            <VerBadge ok={mockDomain.dmarcVerified} label="DMARC" />
            <VerBadge ok={mockDomain.bimiVerified} label="BIMI" />
            <span className="text-[10px] text-fg-faint ml-auto">4/5 verified</span>
          </div>
          <div className="border-t border-border/40 pt-3">
            <h4 className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wide mb-2">DNS Records</h4>
            <div className="space-y-[3px]">
              {dnsRecords.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface-muted/60">
                  <span className="text-[10px] font-semibold text-[hsl(var(--brand))] bg-[hsl(var(--brand-muted))] px-1.5 py-0.5 rounded shrink-0">{rec.type}</span>
                  <span className="text-[11px] font-mono text-fg-muted truncate shrink-0">{rec.name}</span>
                  <span className="text-[11px] font-mono text-fg-subtle truncate min-w-0 flex-1">{rec.value}</span>
                  <Copy size={10} className="text-fg-faint shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
