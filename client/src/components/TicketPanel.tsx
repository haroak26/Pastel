import { useState, useEffect, useRef } from "react";
import {
  ChevronsRight, ChevronUp, ChevronDown, Mail, Lock, Sparkles, AlertCircle,
  RefreshCw, User2, Zap, Eye, Plus, Loader, AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, IconButton } from "@/components/button";
import { cn } from "@/lib/utils";
import { TagChip, TagPicker, ListSkeleton, type TagPickerTag } from "@/components/ds";
import { useSpace } from "@/contexts/space-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

type TicketPriority = "low" | "medium" | "high";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface TicketActivity {
  id: string;
  ticketId: string;
  userId?: string | null;
  type: string;
  content: string;
  authorName?: string | null;
  authorEmail?: string | null;
  isInternal: boolean;
  emailMessageId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketId: string;
  publicId: number | null;
  inboxId: string;
  fromEmail: string;
  fromName?: string | null;
  subject: string;
  body?: string | null;
  status: TicketStatus;
  threadId?: string | null;
  priority: TicketPriority;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  tags: string[];
  description?: string | null;
  category?: string | null;
  platform?: string | null;
  part?: string | null;
  upvotes: number;
  usersAffected?: number;
  escalated: boolean;
  createdAt: string;
  updatedAt: string;
  activities: TicketActivity[];
}

interface Assignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

const STATUS_STEPS: Array<{ value: TicketStatus; label: string; progress: number }> = [
  { value: "open", label: "Open", progress: 0 },
  { value: "in_progress", label: "In Progress", progress: 50 },
  { value: "resolved", label: "Resolved", progress: 100 },
  { value: "closed", label: "Closed", progress: 100 },
];

function statusProgress(status: TicketStatus): number {
  return STATUS_STEPS.find((s) => s.value === status)?.progress ?? 0;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatRelative(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d_ = Math.floor(h / 24);
  if (d_ < 30) return `${d_}d ago`;
  return formatDate(s);
}

function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function avatarBg(name: string) {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const bg = avatarBg(name);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {avatarInitials(name)}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, { label: string; color: string; bg: string }> = {
    low: { label: "LOW", color: "#6B6F76", bg: "#6B6F7615" },
    medium: { label: "MEDIUM", color: "#E78A13", bg: "#E78A1315" },
    high: { label: "HIGH", color: "#DC2B2B", bg: "#DC2B2B15" },
  };
  const { label, color, bg } = map[priority] ?? map.medium;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md"
      style={{ color, background: bg }}
    >
      {priority === "high" && <AlertCircle size={9} />}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: "Open", color: "#eab308", bg: "#eab30818" },
    in_progress: { label: "In Progress", color: "#f97316", bg: "#f9731618" },
    resolved: { label: "Resolved", color: "#1F9D69", bg: "#1F9D6918" },
    closed: { label: "Closed", color: "#6B6F76", bg: "#6B6F7618" },
  };
  const info = map[status] ?? map.open;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ color: info.color, background: info.bg }}
    >
      {info.label}
    </span>
  );
}

type Props = {
  ticketId: string;
  allTickets: { id: number; status: string; createdAt: string }[];
  onClose: () => void;
  onUpdate: () => void;
};

export default function TicketPanel({ ticketId, allTickets, onClose, onUpdate }: Props) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const CONFIDENCE_THRESHOLD = activeWorkspace?.confidenceThreshold ?? 60;
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [visible, setVisible] = useState(false);

  const [tab, setTab] = useState<"reply" | "internal_note">("reply");
  const [message, setMessage] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // tag state
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const tagsExpandTimer = useRef<ReturnType<typeof setTimeout>>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    return () => clearTimeout(tagsExpandTimer.current);
  }, []);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!ticketId,
  });

  const { data: assigneesData } = useQuery<{ assignees: Assignee[] }>({
    queryKey: [`/api/tickets/${ticketId}/assignees`],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/assignees`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!ticketId,
  });

  const { activeSpaceId } = useSpace();

  const { data: allTags = [] } = useQuery<TagPickerTag[]>({
    queryKey: ["/api/spaces", activeSpaceId, "ticket-tags"],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${activeSpaceId}/ticket-tags`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeSpaceId,
  });

  const ticketTagIds = ticket?.tags ?? [];
  const appliedTags = allTags.filter((t: TagPickerTag) => ticketTagIds.includes(t.id));

  const patchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      if (!ticket) return;
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticket.subject,
          fromEmail: ticket.fromEmail,
          fromName: ticket.fromName,
          body: ticket.description || ticket.body,
          category: "bug",
          status: "escalated",
          spaceId: (ticket as any).spaceId || ticket.inboxId,
          threadId: ticket.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      const res = await fetch(`/api/tickets/${ticketId}/activities`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      onUpdate();
    },
  });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  // Navigation
  const sorted = [...allTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const currentIdx = sorted.findIndex((t) => String(t.id) === ticketId);
  const hasPrev = currentIdx < sorted.length - 1;
  const hasNext = currentIdx > 0;

  const handleNavigatePrev = () => {
    if (hasPrev) {
      const prev = sorted[currentIdx + 1];
      if (prev) {
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${prev.id}`] });
      }
    }
  };

  const handleNavigateNext = () => {
    if (hasNext) {
      const next = sorted[currentIdx - 1];
      if (next) {
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${next.id}`] });
      }
    }
  };

  const handleSend = () => {
    const content = message.trim();
    if (!content) return;
    activityMutation.mutate({ type: tab, content });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    patchMutation.mutate({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    patchMutation.mutate({ priority: newPriority });
  };

  const handleAssign = (assignee: Assignee) => {
    patchMutation.mutate({
      assignedToId: assignee.id,
      assignedToName: assignee.name,
      assignedToEmail: assignee.email,
    });
  };

  const handleUnassign = () => {
    patchMutation.mutate({ assignedToId: null, assignedToName: null, assignedToEmail: null });
  };

  const handleTagToggle = async (tagId: string) => {
    // Toggle tag on ticket - basic implementation
    const currentTags = ticket?.tags ?? [];
    const updated = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId];
    await patchMutation.mutateAsync({ tags: updated });
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
  };

  const handleRemoveTag = async (tagId: string) => {
    const currentTags = ticket?.tags ?? [];
    const updated = currentTags.filter((id) => id !== tagId);
    await patchMutation.mutateAsync({ tags: updated });
    queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
  };

  const norm = ticket?.status ?? "new";
  const activities = ticket?.activities ?? [];
  const contentActivities = activities.filter((a) => ["email", "reply", "internal_note"].includes(a.type));

  const latestAgentActivity = [...activities].reverse().find(
    (a) => a.type === "reply" && a.metadata?.agentId,
  );
  const handledByName = latestAgentActivity
    ? (latestAgentActivity.authorName || latestAgentActivity.authorEmail || "AI Agent")
    : null;
  const handledByConfidence = latestAgentActivity?.metadata?.confidence as number | undefined;
  const handledByPct = handledByConfidence != null ? Math.round(handledByConfidence * 100) : null;

  function isCondensed(activity: TicketActivity): boolean {
    const idx = contentActivities.findIndex((a) => a.id === activity.id);
    return idx >= 5 && !expandedIds.has(activity.id);
  }

  return (
    <>
      <div
        ref={panelRef}
        className="fixed top-0 bottom-0 z-40 bg-background border-l border-border shadow-2xl flex flex-col right-0"
        style={{
          width: "calc((100vw - 236px) / 2)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {isLoading ? (
          <ListSkeleton rows={10} />
        ) : !ticket ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] font-semibold text-foreground">Ticket not found</p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-border/50 gap-3">
              <div className="flex items-center gap-1 min-w-0">
                <IconButton icon={ChevronsRight} size="sm" design="ghost" onClick={onClose} title="Close" />
                <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />
                <IconButton icon={ChevronUp} size="sm" design="ghost" onClick={handleNavigatePrev} title="Previous ticket" disabled={!hasPrev} />
                <IconButton icon={ChevronDown} size="sm" design="ghost" onClick={handleNavigateNext} title="Next ticket" disabled={!hasNext} />
                <div className="w-px h-5 bg-border/60 mx-2 shrink-0" />
                <span className="text-[12px] font-mono text-fg-faint shrink-0">#{ticket.publicId ?? ticket.ticketId}</span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                {appliedTags.map((tag: TagPickerTag) => (
                  <TagChip
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    size="sm"
                    onRemove={() => handleRemoveTag(tag.id)}
                    className="ring-2 ring-background"
                  />
                ))}
                <IconButton icon={Plus} size="xs" design="ghost" onClick={() => setTagPickerOpen(!tagPickerOpen)} title="Add tag" className="h-[18px] w-[18px] p-0" />
                <TagPicker
                  open={tagPickerOpen}
                  onClose={() => setTagPickerOpen(false)}
                  tags={allTags}
                  selectedIds={ticketTagIds}
                  spaceId={activeSpaceId ?? undefined}
                  tagApiPrefix={`/api/spaces/${activeSpaceId}/ticket-tags`}
                  tagApiIdPrefix="/api/ticket-tags/"
                  onToggle={handleTagToggle}
                  onTagCreated={(tag) => {
                    handleTagToggle(tag.id);
                    queryClient.setQueryData(["/api/spaces", activeSpaceId, "ticket-tags"], (old: TagPickerTag[] = []) => {
                      if (old.some((t) => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase())) return old;
                      return [...old, tag];
                    });
                  }}
                  onTagUpdated={(tag) => {
                    queryClient.setQueryData(["/api/spaces", activeSpaceId, "ticket-tags"], (old: TagPickerTag[] = []) =>
                      old.map((t) => (t.id === tag.id ? tag : t)),
                    );
                  }}
                  onClear={async () => {
                    for (const tagId of ticketTagIds) {
                      await handleRemoveTag(tagId);
                    }
                  }}
                />
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-[720px] mx-auto px-8 py-6">

                {/* Subject */}
                <div className="mb-7">
                  <h1 className="text-[22px] font-bold text-foreground leading-snug break-words mb-1.5">
                    {ticket.subject}
                  </h1>
                  <p className="text-[13px] text-fg-muted">
                    {ticket.fromName || ticket.fromEmail} — opened {formatDate(ticket.createdAt)}
                    {ticket.category && <> · <span className="text-foreground capitalize">{ticket.category}</span></>}
                  </p>
                </div>

                {/* Description */}
                {ticket.description && (
                  <div className="mb-7 p-4 rounded-xl bg-surface-muted text-[14px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {ticket.description}
                  </div>
                )}

                {/* Details */}
                <div className="mb-7 flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
                  <div>
                    <span className="text-fg-faint">Assignee</span>
                    <div className="mt-0.5">
                      {ticket.assignedToId ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={ticket.assignedToName || ticket.assignedToEmail || "?"} size={18} />
                          <span className="text-foreground font-medium">{ticket.assignedToName || ticket.assignedToEmail}</span>
                        </div>
                      ) : (
                        <span className="text-brand text-[12px]">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-fg-faint">Status</span>
                    <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                      {STATUS_STEPS.map((step) => {
                        const isActive = norm === step.value;
                        return (
                          <button
                            key={step.value}
                            onClick={() => handleStatusChange(step.value)}
                            className={`text-[11px] px-2 py-0.5 rounded font-semibold transition-all ${
                              isActive
                                ? "bg-foreground text-background"
                                : "text-fg-muted hover:text-foreground hover:bg-border/40"
                            }`}
                          >
                            {step.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-fg-faint">Priority</span>
                    <div className="mt-0.5 flex items-center gap-1">
                      {(["low", "medium", "high"] as TicketPriority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePriorityChange(p)}
                          className={`text-[11px] px-2 py-0.5 rounded font-semibold capitalize transition-all ${
                            ticket.priority === p
                              ? p === "high"
                                ? "bg-red-100 text-red-600 dark:bg-red-950/40"
                                : p === "medium"
                                  ? "bg-amber-muted text-amber dark:bg-amber-muted"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                              : "text-fg-faint hover:text-fg-muted"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-fg-faint">Updated</span>
                    <div className="mt-0.5 text-foreground">{formatRelative(ticket.updatedAt)}</div>
                  </div>
                  <div>
                    <span className="text-fg-faint">Affected users</span>
                    <div className="mt-0.5 text-foreground font-semibold tabular-nums">{ticket.usersAffected ?? ticket.upvotes}</div>
                  </div>
                  {handledByName && (
                    <div>
                      <span className="text-fg-faint">Handled by</span>
                      <div className="mt-0.5 flex items-center gap-1">
                        <Sparkles size={11} className={handledByPct != null && handledByPct < CONFIDENCE_THRESHOLD ? "text-amber-500 shrink-0" : "text-violet-500 shrink-0"} />
                        <span className="text-foreground font-medium">
                          {handledByName}
                          {handledByPct != null && (
                            handledByPct < CONFIDENCE_THRESHOLD ? (
                              <span className="inline-flex items-center gap-0.5 ml-1 font-normal text-amber-500">
                                <AlertTriangle size={10} />
                                {handledByPct}%
                              </span>
                            ) : (
                              <span className="text-fg-muted font-normal"> · {handledByPct}%</span>
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mb-7 flex gap-2">
                  <Button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={ticket.status === "in_progress"}
                    design="secondary"
                    size="xs"
                  >
                    <Eye size={14} />
                    In Progress
                  </Button>
                  <Button
                    onClick={() => {
                      if (ticket.escalated) {
                        patchMutation.mutate({ escalated: false });
                      } else {
                        patchMutation.mutate(
                          { escalated: true, priority: "high" },
                          { onSuccess: () => createReviewMutation.mutate() },
                        );
                      }
                    }}
                    design="secondary"
                    size="xs"
                    className={ticket.escalated ? "!border-red-200 !bg-red-50 dark:!bg-red-950/20 !text-red-600" : ""}
                  >
                    <Zap size={14} />
                    {ticket.escalated ? "De-escalate" : "Escalate"}
                  </Button>
                </div>

                {/* Activity */}
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold tracking-widest text-fg-muted uppercase mb-4">
                    Activity
                    <span className="text-[11px] text-fg-faint font-normal ml-2">
                      {contentActivities.length} message{contentActivities.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div>
                    {activities.length === 0 && (
                      <p className="text-[13px] text-fg-faint italic py-4 text-center">No activity yet.</p>
                    )}
                    {activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        condensed={isCondensed(activity)}
                        onExpand={() => setExpandedIds((prev) => new Set([...prev, activity.id]))}
                        onCollapse={() =>
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            next.delete(activity.id);
                            return next;
                          })
                        }
                      />
                    ))}
                    {contentActivities.length > 5 && expandedIds.size < contentActivities.length - 5 && (
                      <Button
                        onClick={() => setExpandedIds(new Set(contentActivities.map((a) => a.id)))}
                        design="ghost"
                        size="xs"
                        className="hover:underline mt-1"
                      >
                        Show all {contentActivities.length} messages
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reply composer */}
                <div className="border border-border/60 rounded-xl bg-surface/30">
                  <div className="flex gap-1 p-1 border-b border-border/40">
                    <button
                      onClick={() => setTab("reply")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                        tab === "reply"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-fg-muted hover:text-foreground"
                      }`}
                    >
                      <Mail size={13} /> Reply
                    </button>
                    <button
                      onClick={() => setTab("internal_note")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-lg transition-all ${
                        tab === "internal_note"
                          ? "bg-amber-muted shadow-sm text-amber-border border border-amber-border"
                          : "text-fg-muted hover:text-foreground"
                      }`}
                    >
                      <Lock size={13} /> Internal Note
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                      }}
                      placeholder={tab === "reply" ? "Write a reply to the customer…" : "Add an internal note (not visible to customer)…"}
                      className="w-full text-[13.5px] text-foreground placeholder:text-fg-faint bg-transparent resize-none min-h-[100px] outline-none border-0 shadow-none ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0"
                    />
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-fg-faint">⌘↵ to send</span>
                        <Button design="ghost" size="xs" onClick={() => setAiPanelOpen(true)} title="AI draft">
                          <Sparkles size={12} />
                          AI
                        </Button>
                      </div>
                      <Button
                        onClick={handleSend}
                        disabled={!message.trim() || activityMutation.isPending}
                        size="xs"
                        isLoading={activityMutation.isPending}
                        className={tab === "internal_note" ? "bg-amber text-white border-0 shadow-sm" : "shadow-sm"}
                      >
                        {tab === "reply" ? "Send reply" : "Save note"}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {ticket && (
        <AIAssistantPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          onUseDraft={(draft) => {
            setMessage(draft);
            setAiPanelOpen(false);
          }}
          mode="reply"
        />
      )}
    </>
  );
}

function ActivityItem({
  activity,
  condensed,
  onExpand,
  onCollapse,
}: {
  activity: TicketActivity;
  condensed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  const { type, content, authorName, authorEmail, createdAt } = activity;
  const displayName = authorName || authorEmail || "Unknown";

  if (type === "status_change" || type === "assignment" || type === "system") {
    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-border/60 last:border-b-0">
        <div className="w-6 h-6 rounded-full bg-border/60 flex items-center justify-center shrink-0">
          {type === "status_change" && <RefreshCw size={10} className="text-fg-muted" />}
          {type === "assignment" && <User2 size={10} className="text-fg-muted" />}
          {type === "system" && <Zap size={10} className="text-fg-muted" />}
        </div>
        <span className="text-[12px] text-fg-muted flex-1">{content}</span>
        <span className="text-[11px] text-fg-faint shrink-0">{formatRelative(createdAt)}</span>
      </div>
    );
  }

  if (condensed) {
    const actionLabel =
      type === "email" ? "sent original email" : type === "reply" ? "sent a reply" : "added a note";
    return (
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-2.5 py-3 border-b border-border/60 last:border-b-0 text-left group hover:bg-fg-muted/5 transition-colors"
      >
        <Avatar name={displayName} size={24} />
        <span className="text-[12.5px] text-fg-muted flex-1">
          <span className="font-medium text-foreground">{displayName}</span>
          {" "}{actionLabel}
        </span>
        <ChevronDown size={13} className="text-fg-faint group-hover:text-fg-muted transition-colors" />
      </button>
    );
  }

  const badgeLabel = type === "email" ? "Reporter" : type === "internal_note" ? "Internal" : "Support";
  const isAmber = type === "internal_note";
  const badgeColor = {
    color: type === "email" ? "var(--brand)" : isAmber ? "var(--amber)" : "var(--success)",
    bg: type === "email" ? "var(--brand-muted)" : isAmber ? "var(--amber-muted)" : "var(--success-muted)",
  };

  return (
    <div className="py-4 border-b border-border/60 last:border-b-0">
      <div className="flex items-start gap-2.5 mb-3">
        <Avatar name={displayName} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-foreground leading-none">{displayName}</span>
            <span
              className="inline-flex items-center text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: badgeColor.color, background: badgeColor.bg }}
            >
              {badgeLabel}
            </span>
          </div>
          {authorEmail && authorEmail !== displayName && (
            <p className="text-[11.5px] text-fg-faint mt-0.5">{authorEmail}</p>
          )}
        </div>
        <span className="text-[11.5px] text-fg-faint shrink-0 tabular-nums">{formatRelative(createdAt)}</span>
        <button
          onClick={onCollapse}
          className="ml-1 p-1 rounded hover:bg-fg-muted/10 text-fg-faint hover:text-fg-muted transition-colors"
          title="Collapse message"
        >
          <ChevronDown size={13} className="rotate-180" />
        </button>
      </div>
      <div className="text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
        {content}
      </div>
    </div>
  );
}
