import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AppPage, PageHeader, ContentPanel } from "@/components/ds";
import { SettingsSection, SettingsRow, SettingsButtonRow } from "@/components/settings-ui";
import { Button } from "@/components/button";
import { TextInput, Textarea } from "@/components/text-input";
import { useWorkspace } from "@/contexts/workspace-context";
import { useSpace } from "@/contexts/space-context";
import { Sparkles, Bot, AlertCircle, Loader2, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  active: boolean;
  model: string;
}

interface PlaygroundResult {
  reply: string;
  confidence: number;
  needsEscalation: boolean;
  language: string;
  toolCalls: { name: string; args: Record<string, unknown> }[];
}

function AgentSelect({ agents, value, onChange }: {
  agents: Agent[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = agents.find(a => a.id === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px] text-left transition-all cursor-pointer",
          "focus:border-foreground/25 focus:ring-1 focus:ring-foreground/[0.05] outline-none",
          !selected && "text-fg-faint",
        )}
      >
        {selected ? (
          <>
            <Bot size={14} className="text-fg-muted shrink-0" />
            <span className="flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-fg-faint">Select an agent...</span>
        )}
        <ChevronDown size={13} className={cn("text-fg-muted shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            {agents.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onChange(a.id); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors cursor-pointer",
                  a.id === value ? "bg-surface-hover text-foreground" : "text-fg-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Bot size={13} className="shrink-0" />
                <span className="flex-1 truncate">{a.name}</span>
                {!a.active && <span className="text-[11px] text-fg-faint">inactive</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "#1F9D69" : pct >= 40 ? "#E78A13" : "#DC2B2B";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

export function AiPlaygroundContent() {
  const { activeWorkspace } = useWorkspace();
  const { activeSpaceId } = useSpace();
  const workspaceId = activeWorkspace?.id ?? "";

  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ["/api/agents", activeSpaceId],
    queryFn: async () => {
      if (!activeSpaceId) return { agents: [] };
      const res = await fetch(`/api/agents?spaceId=${activeSpaceId}`, { credentials: "include" });
      if (!res.ok) return { agents: [] };
      return res.json();
    },
    enabled: !!activeSpaceId,
  });

  const agents = agentsData?.agents ?? [];

  const [agentId, setAgentId] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPlayground() {
    if (!agentId || !fromEmail.trim() || !subject.trim() || !body.trim()) {
      setError("Please fill in all required fields (Agent, From Email, Subject, Message).");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai/playground`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, fromEmail: fromEmail.trim(), fromName: fromName.trim() || undefined, subject: subject.trim(), body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Playground request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run playground");
    } finally {
      setRunning(false);
    }
  }

  const canRun = !!agentId && !!fromEmail && !!subject && !!body && !running;

  return (
    <AppPage>
      <ContentPanel
        header={<PageHeader title="AI Playground" icon={Sparkles} iconColor="#8b5cf6" />}
        maxWidth="narrow"
      >
        <SettingsSection
          title="Test Your AI Agent"
          description="Simulate a customer email and see how your agent would respond in real-time. This uses your agent's actual knowledge base and personality."
        >
          <SettingsRow label="Agent">
            {agents.length === 0 ? (
              <p className="text-[13px] text-fg-muted">No agents found for the active space.</p>
            ) : (
              <AgentSelect agents={agents} value={agentId} onChange={setAgentId} />
            )}
          </SettingsRow>
          <SettingsRow label="From Email *">
            <TextInput
              placeholder="customer@example.com"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              type="email"
            />
          </SettingsRow>
          <SettingsRow label="From Name">
            <TextInput
              placeholder="John Smith (optional)"
              value={fromName}
              onChange={e => setFromName(e.target.value)}
            />
          </SettingsRow>
          <SettingsRow label="Subject *">
            <TextInput
              placeholder="e.g. I can't access my account"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </SettingsRow>
          <SettingsRow label="Message *">
            <Textarea
              placeholder="Type the customer's email message here..."
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
            />
          </SettingsRow>
          <SettingsButtonRow label="">
            <Button onClick={runPlayground} disabled={!canRun}>
              {running ? (
                <><Loader2 size={14} className="animate-spin" /> Running...</>
              ) : (
                <><Sparkles size={14} /> Run Playground</>
              )}
            </Button>
          </SettingsButtonRow>

          {error && (
            <div className="mx-0 mb-1 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </SettingsSection>

        {result && (
          <SettingsSection
            title="Agent Response"
            description=""
            className="mt-6"
          >
            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-2 px-0 py-3 border-b border-border/60">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                result.needsEscalation
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success",
              )}>
                {result.needsEscalation ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                {result.needsEscalation ? "Needs Escalation" : "No Escalation"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-hover text-fg-muted">
                {result.language.toUpperCase()}
              </span>
            </div>

            <div className="py-3 border-b border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-fg-muted">Confidence</span>
              </div>
              <ConfidenceMeter value={result.confidence} />
            </div>

            {result.toolCalls.length > 0 && (
              <div className="py-3 border-b border-border/60">
                <p className="text-[12px] font-medium text-fg-muted mb-2">Tool Calls</p>
                <div className="space-y-1.5">
                  {result.toolCalls.map((tc, i) => (
                    <div key={i} className="rounded-lg bg-surface-hover border border-border px-3 py-2 text-[12px] font-mono">
                      <span className="text-brand font-semibold">{tc.name}</span>
                      <span className="text-fg-muted ml-2">{JSON.stringify(tc.args)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="py-3">
              <p className="text-[12px] font-medium text-fg-muted mb-2">Reply</p>
              <div className="rounded-xl border border-border bg-surface-hover p-4 text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                {result.reply}
              </div>
            </div>
          </SettingsSection>
        )}
      </ContentPanel>
    </AppPage>
  );
}

export default function AiPlayground() {
  return <AiPlaygroundContent />;
}
