import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput, Textarea } from "@/components/text-input";
import { cn } from "@/lib/utils";

type PortalTicket = {
  id: string;
  ticketId: string;
  publicId: number | null;
  subject: string;
  status: string;
  priority: string;
  fromEmail: string;
  createdAt: string;
  updatedAt: string;
};

type PortalActivity = {
  id: string;
  type: string;
  content: string;
  authorName: string | null;
  authorEmail: string | null;
  isInternal: boolean;
  createdAt: string;
};

type TicketDetail = {
  ticket: PortalTicket & { body: string | null; fromName: string | null };
  activities: PortalActivity[];
};

const STATUS_COLORS: Record<string, string> = {
  open: "#E78A13",
  in_progress: "#4682B4",
  resolved: "#1F9D69",
  closed: "#6B6F76",
  pending: "#E78A13",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  pending: "Pending",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: color + "20", color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Auth Gate (magic link request + verify) ─────────────────────────────

function AuthView({ workspaceId, onAuthenticated }: { workspaceId: string; onAuthenticated: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "sent">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's a token in the URL
  const [, params] = useRoute("/portal/:wid/verify");
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tokenFromUrl = searchParams.get("token");

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  async function verifyToken(token: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${workspaceId}/auth/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Verification failed");
      onAuthenticated(data.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setLoading(false);
    }
  }

  async function requestLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${workspaceId}/auth/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to send link");
      setStep("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  }

  if (tokenFromUrl && loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 size={32} className="animate-spin text-fg-muted" />
        <p className="text-[14px] text-fg-muted">Verifying your link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-12 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Mail size={22} className="text-brand" />
        </div>
        <h1 className="text-[20px] font-semibold text-foreground">Customer Support Portal</h1>
        <p className="text-[13px] text-fg-muted">
          {step === "request"
            ? "Enter your email address and we'll send you a magic link to access your support tickets."
            : "Check your inbox for a magic link. Click it to access your tickets instantly."}
        </p>
      </div>

      {step === "request" ? (
        <div className="w-full space-y-3">
          <TextInput
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && requestLink()}
            className="w-full"
          />
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-destructive">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <Button className="w-full" onClick={requestLink} disabled={!email.trim() || loading}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : "Send Magic Link"}
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
            <CheckCircle2 size={24} className="text-success mx-auto mb-2" />
            <p className="text-[13px] font-medium text-foreground">Magic link sent to <span className="text-brand">{email}</span></p>
            <p className="text-[12px] text-fg-muted mt-1">Link expires in 15 minutes.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-destructive">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <Button design="outline" className="w-full" onClick={() => setStep("request")}>
            Use a different email
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Ticket list ─────────────────────────────────────────────────────────

function TicketListView({ workspaceId, email, onSelectTicket, onLogout }: {
  workspaceId: string;
  email: string;
  onSelectTicket: (id: string) => void;
  onLogout: () => void;
}) {
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${workspaceId}/tickets`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? "Failed");
        return r.json();
      })
      .then(data => { setTickets(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [workspaceId]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground">Your Support Tickets</h1>
          <p className="text-[13px] text-fg-muted mt-0.5">{email}</p>
        </div>
        <Button size="sm" design="ghost" onClick={onLogout}>Sign out</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-fg-muted" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertCircle size={28} className="text-destructive" />
          <p className="text-[14px] text-fg-muted">{error}</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageSquare size={32} className="text-fg-faint" />
          <p className="text-[15px] font-medium text-foreground">No tickets yet</p>
          <p className="text-[13px] text-fg-muted">When you contact support, your tickets will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <button
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-surface-hover transition-colors text-left cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-medium text-foreground truncate">{t.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <span className="text-[11px] text-fg-muted flex items-center gap-1">
                    <Clock size={10} /> {formatDate(t.createdAt)}
                  </span>
                  {t.publicId && (
                    <span className="text-[11px] text-fg-faint font-mono">#{t.publicId}</span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} className="text-fg-muted shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ticket detail ───────────────────────────────────────────────────────

function TicketDetailView({ workspaceId, ticketId, onBack }: {
  workspaceId: string;
  ticketId: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  function fetchDetail() {
    fetch(`/api/portal/${workspaceId}/tickets/${ticketId}`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message ?? "Failed");
        return r.json();
      })
      .then(d => { setDetail(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }

  useEffect(() => { fetchDetail(); }, [workspaceId, ticketId]);

  async function submitReply() {
    if (!replyBody.trim()) return;
    setReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/portal/${workspaceId}/tickets/${ticketId}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyBody.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Failed to send reply");
      setReplyBody("");
      fetchDetail();
    } catch (e) {
      setReplyError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setReplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-fg-muted" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <AlertCircle size={28} className="text-destructive" />
        <p className="text-[14px] text-fg-muted">{error ?? "Ticket not found"}</p>
        <Button size="sm" design="ghost" onClick={onBack}><ArrowLeft size={13} /> Back</Button>
      </div>
    );
  }

  const { ticket, activities } = detail;
  const isClosed = ticket.status === "closed";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-foreground transition-colors mb-5 cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={14} /> Back to tickets
      </button>

      <div className="mb-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-semibold text-foreground mb-1">{ticket.subject}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              {ticket.publicId && <span className="text-[12px] text-fg-faint font-mono">#{ticket.publicId}</span>}
              <span className="text-[12px] text-fg-muted">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Original message */}
      {ticket.body && (
        <div className="rounded-xl border border-border bg-surface-hover p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide">Original Message</span>
          </div>
          <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
        </div>
      )}

      {/* Activities / thread */}
      <div className="space-y-3 mb-6">
        {activities.filter(a => a.type === "reply").map(a => {
          const isSupport = a.authorEmail !== ticket.fromEmail;
          return (
            <div key={a.id} className={cn("rounded-xl border p-4", isSupport ? "border-brand/20 bg-brand/5" : "border-border bg-background")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-foreground">{isSupport ? "Support Team" : (a.authorName || "You")}</span>
                <span className="text-[11px] text-fg-muted">{formatTime(a.createdAt)}</span>
              </div>
              <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">{a.content}</p>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[12px] font-semibold text-fg-muted uppercase tracking-wide mb-3">Add a Reply</p>
          <Textarea
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Type your reply here..."
            rows={4}
            className="w-full mb-3"
          />
          {replyError && (
            <p className="text-[12px] text-destructive mb-2">{replyError}</p>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={submitReply} disabled={!replyBody.trim() || replying}>
              {replying ? <><Loader2 size={13} className="animate-spin" /> Sending...</> : "Send Reply"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface-hover p-4 text-center">
          <p className="text-[13px] text-fg-muted">This ticket is closed. Please contact support if you need further assistance.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Portal Page ────────────────────────────────────────────────────

export default function PortalPage() {
  const [, params] = useRoute("/portal/:workspaceId/:rest*");
  const workspaceId = params?.workspaceId ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) { setCheckingSession(false); return; }
    fetch(`/api/portal/${workspaceId}/auth/me`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) { setCheckingSession(false); return; }
        const d = await r.json();
        setEmail(d.email);
        setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [workspaceId]);

  async function logout() {
    await fetch(`/api/portal/${workspaceId}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setEmail(null);
    setSelectedTicketId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-[17px] font-bold tracking-tight text-foreground">Pastel</span>
        <span className="text-[12px] text-fg-muted">Customer Portal</span>
      </header>

      <main>
        {checkingSession ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-fg-muted" />
          </div>
        ) : !email ? (
          <AuthView workspaceId={workspaceId} onAuthenticated={setEmail} />
        ) : selectedTicketId ? (
          <TicketDetailView
            workspaceId={workspaceId}
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : (
          <TicketListView
            workspaceId={workspaceId}
            email={email}
            onSelectTicket={setSelectedTicketId}
            onLogout={logout}
          />
        )}
      </main>
    </div>
  );
}
