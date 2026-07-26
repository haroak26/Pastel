import React, { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader, ChevronDown, ChevronUp, ChevronLeft, Pencil, ChevronRight,
  User2, X, AlertCircle, Zap, RefreshCw, Trash2, MoreVertical,
  MessageSquare, FileEdit, Sparkles, AlertTriangle, Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, Dropdown, Badge, ListSkeleton } from '@/components/ds';
import { Button, IconButton } from '@/components/button';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';

import { MessageComposer, type MessageComposerHandle } from '@/components/MessageComposer';
import { Avatar, gravatarUrl } from '@/components/tickets/Avatar';
import { PriorityBadge, StatusBadge } from '@/components/tickets/Badge';
import { ActivityItem } from '@/components/tickets/ActivityItem';
import { PART_OPTIONS, WHERE_OPTIONS } from '@shared/schema';
import { useWorkspace } from '@/contexts/workspace-context';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { TextInput, Textarea } from '@/components/text-input';

type TicketPriority = 'low' | 'medium' | 'high';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

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
  language?: string | null;
  sentiment?: string | null;
  createdAt: string;
  updatedAt: string;
  activities: TicketActivity[];
}

interface Assignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  skills?: Array<{ skill: string; proficiency: number }>;
  maxCapacity?: number;
  currentTicketCount?: number;
  available?: boolean;
  routingKeywords?: string[];
  routingSkills?: string[];
}

const STATUS_STEPS = [
  { value: 'open', label: 'Open', progress: 0 },
  { value: 'in_progress', label: 'In Progress', progress: 50 },
  { value: 'resolved', label: 'Resolved', progress: 100 },
  { value: 'closed', label: 'Closed', progress: 100 },
];

function statusProgress(status: string): number {
  return STATUS_STEPS.find(s => s.value === status)?.progress ?? 0;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d_ = Math.floor(h / 24);
  if (d_ < 30) return `${d_}d ago`;
  return formatDate(s);
}

export default function TicketDetail() {
  const [, params] = useRoute('/home/tickets/detail/:id');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const confidenceThreshold = activeWorkspace?.confidenceThreshold ?? 60;
  const id = params?.id;

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [contactPanelOpen, setContactPanelOpen] = useState(false);

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [editPart, setEditPart] = useState('');
  const [editPlatform, setEditPlatform] = useState('');
  const collapsedInitRef = useRef(false);
  const composerRef = useRef<MessageComposerHandle>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activitiesRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!id,
  });

  const { data: allTicketsData } = useQuery<{ tickets: { id: string; createdAt: string; fromEmail: string; subject: string; status: string }[] }>({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets', { credentials: 'include' });
      if (!res.ok) return { tickets: [] };
      return res.json();
    },
  });

  const allTickets = allTicketsData?.tickets ?? [];
  const senderTickets = ticket ? allTickets.filter(t => t.fromEmail === ticket.fromEmail) : [];
  const senderTicketTotal = senderTickets.length;
  const senderTicketOpen = senderTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const sortedTickets = [...allTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const currentIdx = sortedTickets.findIndex(t => t.id === id);
  const hasPrev = currentIdx < sortedTickets.length - 1;
  const hasNext = currentIdx > 0;

  const { data: assigneesData } = useQuery<{ assignees: Assignee[] }>({
    queryKey: [`/api/tickets/${id}/assignees`],
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${id}/assignees`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!id,
  });

  const patchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      const res = await fetch(`/api/tickets/${id}/activities`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ activityId, content }: { activityId: string; content: string }) => {
      const res = await fetch(`/api/tickets/${id}/activities/${activityId}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await fetch(`/api/tickets/${id}/activities/${activityId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      navigate('/home/tickets/open');
    },
  });

  useEffect(() => {
    const el = descTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [descDraft]);

  useEffect(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [titleDraft]);

  useEffect(() => {
    if (!collapsedInitRef.current && ticket?.activities && ticket.activities.length > 0) {
      setCollapsedIds(new Set(
        ticket.activities
          .filter(a => a.type === 'reply' || a.type === 'internal_note')
          .map(a => a.id)
      ));
      collapsedInitRef.current = true;
    }
  }, [ticket?.activities]);

  useEffect(() => {
    setEditPart(ticket?.part ?? '');
    setEditPlatform(ticket?.platform ?? '');
  }, [ticket?.part, ticket?.platform]);

  const activities = (ticket?.activities ?? []).filter(a => a.type !== 'email');
  const visibleActivities = showAllActivities ? activities : activities.slice(0, 4);
  const hasManyActivities = activities.length > 4;

  useEffect(() => {
    if (activitiesRef.current) {
      const el = activitiesRef.current;
      requestAnimationFrame(() => {
        if (!showAllActivities) {
          const items = el.children;
          let h = 0;
          for (let i = 0; i < Math.min(items.length, 4); i++) {
            h += items[i].getBoundingClientRect().height;
          }
          el.style.maxHeight = h + 'px';
        } else {
          el.style.maxHeight = el.scrollHeight + 'px';
        }
      });
    }
  }, [showAllActivities, activities]);

  if (isLoading) {
    return (
        <AppPage>
          <ListSkeleton rows={12} />
        </AppPage>
    );
  }

  if (!ticket) {
    return (
        <AppPage>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[14px] font-semibold text-foreground">Ticket not found</p>
              <Button
                onClick={() => navigate('/home/tickets/open')}
                design="ghost"
                size="xs"
                className="mt-2 block hover:underline"
              >Back to tickets</Button>
            </div>
          </div>
        </AppPage>
    );
  }

  const progress = statusProgress(ticket.status);

  const latestAgentActivity = [...(ticket.activities ?? [])].reverse().find(
    (a) => a.type === 'reply' && a.metadata?.agentId,
  );
  const handledByName = latestAgentActivity
    ? (latestAgentActivity.authorName || (latestAgentActivity.metadata?.agentName as string | undefined) || latestAgentActivity.authorEmail || 'AI Agent')
    : null;
  const handledByConfidence = latestAgentActivity?.metadata?.confidence as number | undefined;
  const handledByPct = handledByConfidence != null ? Math.round(handledByConfidence * 100) : null;

  const handleSaveDescription = () => {
    if (descDraft !== (ticket?.description ?? '')) {
      patchMutation.mutate({ description: descDraft || null });
    }
    setEditingDesc(false);
  };

  const handleGenerateDescription = async () => {
    if (!ticket) return;
    setIsGeneratingDesc(true);
    try {
      const res = await fetch(`/api/tickets/${id}/generate-description`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setDescDraft(data.description ?? '');
      setEditingDesc(true);
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      toast({ title: 'Description generated with AI' });
    } catch {
      toast({ title: 'Failed to generate description', variant: 'destructive' });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSaveTitle = () => {
    if (titleDraft !== ticket?.subject) {
      patchMutation.mutate({ subject: titleDraft });
    }
    setEditingTitle(false);
  };

  const handleSend = (content: string, type: 'reply' | 'internal_note') => {
    if (!content.trim()) return;
    activityMutation.mutate({ type, content });
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

  const goToPrev = () => {
    if (hasPrev) navigate('/home/tickets/detail/' + sortedTickets[currentIdx + 1].id);
  };

  const goToNext = () => {
    if (hasNext) navigate('/home/tickets/detail/' + sortedTickets[currentIdx - 1].id);
  };

  return (
    <>
      <AppPage>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 bg-background border-x border-t border-border/60 rounded-tl-[16px] flex flex-col overflow-hidden">
            <header className="lds-app-topbar">
              <div className="lds-app-topbar-row">
                <div className="flex min-w-0 items-center">
                  <div className="flex min-w-0 items-center gap-2 flex-1">
                    <IconButton icon={ChevronLeft} size="sm" design="secondary" onClick={() => navigate('/home/tickets/open')} title="Back to home" />
                    <span className="lds-app-title truncate font-mono text-[13px] text-fg-muted">#{ticket.publicId ?? ticket.ticketId}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon={ChevronUp} size="sm" design="secondary" onClick={goToPrev} disabled={!hasPrev} title="Previous ticket" />
                  <IconButton icon={ChevronDown} size="sm" design="secondary" onClick={goToNext} disabled={!hasNext} title="Next ticket" />
                  <div className="w-px h-4 bg-border/60 mx-1" />
                  <IconButton icon={contactPanelOpen ? X : User2} size="sm" design="secondary" onClick={() => setContactPanelOpen(!contactPanelOpen)} title={contactPanelOpen ? 'Close contact info' : 'Contact info'} />
                  <IconButton icon={Trash2} size="sm" design="secondary" onClick={() => { if (window.confirm('Delete this ticket?')) deleteMutation.mutate(); }} title="Delete ticket" />
                </div>
              </div>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mx-auto w-full p-0">
            <CollisionBannerInline ticketId={ticket.id} />

            <div className="mx-auto w-full px-4 sm:px-8 py-6" style={{ maxWidth: '860px' }}>

              {/* Header */}
              <div className="mb-8">
                  <div className="group relative mb-1.5">
                    {editingTitle ? (
                      <div>
                        <TextInput
                          value={titleDraft}
                          onChange={e => setTitleDraft(e.target.value)}
                          className="w-full text-[22px] font-medium leading-snug bg-transparent px-3 py-2 min-w-0"
                          autoFocus
                          onBlur={handleSaveTitle}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <h1 className="text-[22px] font-medium text-foreground leading-snug break-words flex-1">{ticket.subject}</h1>
                        <IconButton icon={Pencil} size="xs" design="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => { setTitleDraft(ticket.subject); setEditingTitle(true); }} />
                      </div>
                    )}
                  </div>

                  {/* Meta: date opened + part + where */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-5 text-[13px] text-foreground">
                    <span>Opened {formatDate(ticket.createdAt)}</span>
                    {ticket.part && <><span className="text-fg-faint">·</span><span>{ticket.part}</span></>}
                    {ticket.platform && <><span className="text-fg-faint">·</span><span>{ticket.platform}</span></>}
                  </div>

                  <div className="group relative">
                    {editingDesc ? (
                      <div>
                        <div className="border border-border/40 rounded-lg p-3">
                          <Textarea
                            ref={descTextareaRef}
                            value={descDraft}
                            onChange={e => setDescDraft(e.target.value)}
                            placeholder="Add a description…"
                            autoFocus
                            onBlur={handleSaveDescription}
                            variant="ghost"
                            className="text-[13px] leading-relaxed min-h-[80px] p-0"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button design="ghost" size="xs" onClick={handleSaveDescription}>Save</Button>
                          <Button design="ghost" size="xs" onClick={() => setEditingDesc(false)}>Cancel</Button>
                          <span className="flex-1" />
                          <Button design="ghost" size="xs" icon={Sparkles} onClick={handleGenerateDescription} disabled={isGeneratingDesc} isLoading={isGeneratingDesc}>Generate</Button>
                        </div>
                      </div>
                    ) : ticket.description ? (
                      <div>
                        <div className="flex items-start gap-2">
                          <div className="text-[13px] text-fg-muted leading-relaxed flex-1 prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(ticket.description) as string) }} />
                          <IconButton icon={Pencil} size="xs" design="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => { setDescDraft(ticket.description ?? ''); setEditingDesc(true); }} />
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => { setDescDraft(ticket.description ?? ''); setEditingDesc(true); }}
                            className="text-[11px] text-fg-muted hover:text-foreground bg-none border-none cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-fg-faint">·</span>
                          <button
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc}
                            className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline disabled:opacity-50 bg-none border-none cursor-pointer"
                          >
                            {isGeneratingDesc ? (
                              <><Loader size={10} className="animate-spin" /> Generating…</>
                            ) : (
                              <><Sparkles size={10} /> Regenerate with AI</>
                            )}
                          </button>
                          {(ticket.language || ticket.sentiment) && (
                            <>
                              <span className="text-fg-faint">·</span>
                              {ticket.language && ticket.language !== 'en' && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand/5 text-brand font-medium">
                                  {ticket.language.toUpperCase()}
                                </span>
                              )}
                              {ticket.sentiment && ticket.sentiment !== 'neutral' && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                                  ticket.sentiment === 'frustrated' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                                }`}>
                                  {ticket.sentiment === 'frustrated' ? '😠 Frustrated' : '😊 Positive'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setDescDraft(''); setEditingDesc(true); }}
                          className="text-[12px] text-fg-faint italic hover:text-fg-muted transition-colors bg-none border-none cursor-pointer p-0"
                        >
                          Add a description…
                        </button>
                        <button
                          onClick={handleGenerateDescription}
                          disabled={isGeneratingDesc}
                          className="inline-flex items-center gap-1.5 text-[12px] text-brand hover:underline disabled:opacity-50 bg-none border-none cursor-pointer"
                        >
                          {isGeneratingDesc ? (
                            <><Loader size={11} className="animate-spin" /> Generating…</>
                          ) : (
                            <><Sparkles size={11} /> Generate with AI</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Language + Sentiment row (when no description) */}
                  {!ticket.description && !editingDesc && (ticket.language || ticket.sentiment) && (
                    <div className="flex items-center gap-2 mt-2">
                      {ticket.language && ticket.language !== 'en' && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-brand/5 text-brand font-medium">
                          {ticket.language.toUpperCase()}
                        </span>
                      )}
                      {ticket.sentiment && ticket.sentiment !== 'neutral' && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                          ticket.sentiment === 'frustrated' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                        }`}>
                          {ticket.sentiment === 'frustrated' ? '😠 Frustrated' : '😊 Positive'}
                        </span>
                      )}
                    </div>
                  )}


                </div>

                {/* Activity */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-medium text-foreground leading-none">
                      Activity
                    </p>
                    {activities.length > 4 && (
                      <Button
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        design="ghost"
                        size="xs"
                      >
                        {showAllActivities ? 'Show Less' : 'Show All'}
                      </Button>
                    )}
                  </div>
                  <div className="h-px bg-border/60 mb-4" />
                  <div>
                    {visibleActivities.length === 0 && (
                      <p className="text-[13px] text-fg-faint italic py-4 text-center">No activity yet.</p>
                    )}
                    <div
                      ref={activitiesRef}
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                    >
                      {visibleActivities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        collapsed={collapsedIds.has(activity.id)}
                        onExpand={() => {
                          const next = new Set(collapsedIds);
                          next.delete(activity.id);
                          setCollapsedIds(next);
                        }}
                        onCollapse={() => setCollapsedIds(prev => new Set([...prev, activity.id]))}
                        onEdit={activity.type === 'internal_note' ? (id, content) => updateActivityMutation.mutate({ activityId: id, content }) : undefined}
                        onDelete={activity.type === 'internal_note' ? (id) => deleteActivityMutation.mutate(id) : undefined}
                        confidenceThreshold={confidenceThreshold}
                      />
                    ))}

                  </div>
                </div>

                <div className="border-t border-border/60 my-6" />

                {/* Message composer */}
                <div className="sticky bottom-0 bg-background pt-4 pb-6 -mx-4 sm:-mx-8 px-4 sm:px-8">
                  <MessageComposer
                    ref={composerRef}
                    onSend={handleSend}
                    isPending={activityMutation.isPending}
                    isAiOpen={aiPanelOpen}
                    onAiClick={() => setAiPanelOpen(true)}
                  />
                </div>

              </div>
            </div>
            </div>
            </div>

          {/* ── Right sidebar — desktop only ── */}
          <DesktopSidebarContent
            ticket={ticket}
            senderTicketTotal={senderTicketTotal}
            senderTicketOpen={senderTicketOpen}
            confidenceThreshold={confidenceThreshold}
            handledByName={handledByName}
            handledByPct={handledByPct}
            editPart={editPart}
            setEditPart={setEditPart}
            editPlatform={editPlatform}
            setEditPlatform={setEditPlatform}
            handleStatusChange={handleStatusChange}
            handlePriorityChange={handlePriorityChange}
            handleAssign={handleAssign}
            handleUnassign={() => patchMutation.mutate({ assignedToId: null, assignedToName: null, assignedToEmail: null })}
            assigneesData={assigneesData}
            navigate={navigate}
            patchMutation={patchMutation}
          />

        </div>
      </AppPage>
      <AIAssistantPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        onUseDraft={(draft) => { composerRef.current?.setMessage(draft); setAiPanelOpen(false); }}
        mode="reply"
      />
    </>
  );
}

// ── Sidebar content components (shared between desktop + mobile drawer) ──

interface SidebarContentProps {
  ticket: Ticket;
  senderTicketTotal: number;
  senderTicketOpen: number;
  confidenceThreshold: number;
  handledByName: string | null;
  handledByPct: number | null;
  editPart: string;
  setEditPart: (v: string) => void;
  editPlatform: string;
  setEditPlatform: (v: string) => void;
  handleStatusChange: (s: TicketStatus) => void;
  handlePriorityChange: (p: TicketPriority) => void;
  handleAssign: (a: Assignee) => void;
  handleUnassign: () => void;
  assigneesData: { assignees: Assignee[] } | undefined;
  navigate: (path: string) => void;
  patchMutation: { mutate: (data: Record<string, unknown>) => void };
}

function SidebarContentInner(props: SidebarContentProps) {
  const { ticket, senderTicketTotal, senderTicketOpen, confidenceThreshold,
    handledByName, handledByPct, editPart, setEditPart, editPlatform,
    setEditPlatform, handleStatusChange, handlePriorityChange, handleAssign, handleUnassign,
    assigneesData, navigate, patchMutation } = props;

  return (
    <>
      <div className="flex items-start gap-2.5">
        <img src={gravatarUrl(ticket.fromEmail, 36)} alt=""
          className="w-[36px] h-[36px] rounded-full object-cover shrink-0 bg-surface-hover mt-0.5"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="min-w-0">
          <p className="text-[13px] text-foreground font-medium truncate">{ticket.fromName || ticket.fromEmail}</p>
          {ticket.fromName && ticket.fromEmail !== ticket.fromName && (
            <p className="text-[12.5px] text-fg-muted truncate">{ticket.fromEmail}</p>
          )}
        </div>
      </div>
      {/* Ticket counts */}
      <div className="flex gap-3">
        <div className="flex-1 bg-surface-hover rounded-[10px] p-2.5 text-center">
          <p className="text-[18px] font-semibold text-foreground tabular-nums">{senderTicketTotal}</p>
          <p className="text-[11px] text-fg-muted">Total tickets</p>
        </div>
        <div className="flex-1 bg-surface-hover rounded-[10px] p-2.5 text-center">
          <p className="text-[18px] font-semibold text-foreground tabular-nums">{senderTicketOpen}</p>
          <p className="text-[11px] text-fg-muted">Open</p>
        </div>
      </div>
      <div className="h-px bg-border/60" />
      <div className="space-y-3 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Status</span>
          <div className="flex-1">
            <Dropdown value={ticket.status} onChange={(val) => handleStatusChange(val as TicketStatus)}
              options={STATUS_STEPS.map(s => ({ value: s.value, label: <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.value === 'open' ? '#eab308' : s.value === 'in_progress' ? '#f97316' : s.value === 'resolved' ? '#14b8a6' : '#6b7280' }} />{s.label}</div> }))}
              placeholder="Set status…" className="w-full" menuAlign="center"
              triggerClassName="inline-flex items-center justify-between gap-2 cursor-pointer text-[13px] h-8 px-2.5 rounded-[14px] bg-transparent border border-border/60 hover:border-border transition-colors w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Priority</span>
          <div className="flex-1">
            <Dropdown value={ticket.priority} onChange={(val) => handlePriorityChange(val as TicketPriority)}
              options={[
                { value: 'low', label: <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6b7280' }} />Low</div> },
                { value: 'medium', label: <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'hsl(var(--amber))' }} />Medium</div> },
                { value: 'high', label: <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#ef4444' }} />High</div> },
              ]}
              placeholder="Set priority…" className="w-full" menuAlign="center"
              triggerClassName="inline-flex items-center justify-between gap-2 cursor-pointer text-[13px] h-8 px-2.5 rounded-[14px] bg-transparent border border-border/60 hover:border-border transition-colors w-full" />
          </div>
        </div>
      </div>
      <div className="h-px bg-border/60" />
      <div className="space-y-3 text-[13px]">
        <div className="flex items-start gap-2">
          <span className="text-fg-muted w-[72px] shrink-0 pt-0.5">Assignee</span>
          <div className="flex-1">
            <Dropdown value={ticket.assignedToId ?? ''} onChange={(val) => { if (!val) { handleUnassign(); return; } const a = assigneesData?.assignees.find(a => a.id === val); if (a) handleAssign(a); }}
              options={[
                ...(ticket.assignedToId ? [{ value: '', label: 'Unassign' }] : []),
                ...(assigneesData?.assignees.map(a => ({ value: a.id, label: <div className="flex items-center gap-2 min-w-0 py-0.5"><div className="relative shrink-0"><Avatar name={a.name || a.email || '?'} size={18} />{a.available !== undefined && <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${a.available ? 'bg-green-500' : 'bg-gray-300'}`} />}</div><div className="min-w-0"><div className="text-[12px] font-medium text-foreground truncate">{a.name}</div>{a.skills && a.skills.length > 0 && <div className="text-[10px] text-fg-muted truncate">{a.skills.slice(0, 2).map((s: any) => s.skill).join(', ')}</div>}</div>{a.maxCapacity !== undefined && a.currentTicketCount !== undefined && <span className={`text-[10px] shrink-0 ml-auto ${(a.currentTicketCount / a.maxCapacity) > 0.8 ? 'text-destructive' : 'text-fg-muted'}`}>{a.currentTicketCount}/{a.maxCapacity}</span>}</div> as any })) ?? []),
              ]}
              placeholder="Assign"
              renderTrigger={() => <div className="flex items-center gap-1.5 cursor-pointer">{ticket.assignedToId ? <><Avatar name={ticket.assignedToName || ticket.assignedToEmail || '?'} size={20} /><span className="text-foreground font-medium truncate">{ticket.assignedToName || ticket.assignedToEmail}</span></> : <span className="text-brand hover:underline text-[12px]">Assign</span>}</div>}
              showChevron={false} className="inline-flex" triggerClassName="bg-none border-none p-0 cursor-pointer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Reporter</span>
          <span className="text-foreground truncate">{ticket.fromName || ticket.fromEmail}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Created</span>
          <span className="text-foreground">{formatDate(ticket.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Updated</span>
          <span className="text-foreground">{formatRelative(ticket.updatedAt)}</span>
        </div>
        {handledByName && (
          <div className="flex items-center gap-2">
            <span className="text-fg-muted w-[72px] shrink-0">Handled by</span>
            <div className="flex items-center gap-1 min-w-0">
              <Sparkles size={11} className={handledByPct != null && handledByPct < confidenceThreshold ? "text-amber shrink-0" : "text-violet-500 shrink-0"} />
              <span className="text-foreground font-medium truncate">{handledByName}</span>
              {handledByPct != null && (handledByPct < confidenceThreshold ? <span className="inline-flex items-center gap-0.5 font-normal shrink-0 text-amber"><AlertTriangle size={10} />{handledByPct}%</span> : <span className="text-fg-muted font-normal shrink-0">· {handledByPct}%</span>)}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-fg-muted w-[72px] shrink-0">Affected</span>
          <span className="text-foreground font-semibold tabular-nums">{ticket.usersAffected ?? ticket.upvotes}</span>
          <span className="text-[12px] text-fg-muted">users</span>
        </div>
        <div className="h-px bg-border/60 -mx-3" />
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Category</span>
          <div className="flex-1">
            <Dropdown value={editPart} onChange={(val) => { setEditPart(val); patchMutation.mutate({ part: val || null }); }} options={[{ value: '', label: '—' }, ...PART_OPTIONS.map(o => ({ value: o, label: o }))]}
              placeholder="Set category…" className="w-full" menuAlign="center"
              triggerClassName="inline-flex items-center justify-between gap-2 cursor-pointer text-[13px] h-8 px-2.5 rounded-[14px] bg-transparent border border-border/60 hover:border-border transition-colors w-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-fg-muted w-[72px] shrink-0">Platform</span>
          <div className="flex-1">
            <Dropdown value={editPlatform} onChange={(val) => { setEditPlatform(val); patchMutation.mutate({ platform: val || null }); }} options={[{ value: '', label: '—' }, ...WHERE_OPTIONS.map(o => ({ value: o, label: o === 'Both' ? 'Web & Mobile' : o }))]}
              placeholder="Set platform…" className="w-full" menuAlign="center"
              triggerClassName="inline-flex items-center justify-between gap-2 cursor-pointer text-[13px] h-8 px-2.5 rounded-[14px] bg-transparent border border-border/60 hover:border-border transition-colors w-full" />
          </div>
        </div>
        {/* Tags */}
        {ticket.tags.length > 0 && (
          <>
            <div className="h-px bg-border/60 -mx-3" />
            <div>
              <p className="text-[13px] text-fg-muted mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-surface-hover text-fg-muted">{tag}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DesktopSidebarContent(props: SidebarContentProps) {
  return (
    <div className="fixed top-0 right-0 bottom-0 w-[280px] hidden md:flex flex-col gap-5 pt-20 pr-4 pl-5 overflow-y-auto bg-background border-l border-border/60 z-10">
      <SidebarContentInner {...props} />
    </div>
  );
}

// ── Collision Banner (inline, self-contained) ────────────────────────────

interface CollisionViewer {
  id: string;
  name: string;
  email: string;
}

function CollisionBannerInline({ ticketId }: { ticketId: string }) {
  const [viewers, setViewers] = useState<CollisionViewer[]>([]);

  useEffect(() => {
    const beat = async () => {
      try {
        await fetch(`/api/tickets/${ticketId}/collision/heartbeat`, { method: 'POST' });
        const res = await fetch(`/api/tickets/${ticketId}/collision`);
        const data = await res.json();
        setViewers(data.viewers ?? []);
      } catch { /* ignore */ }
    };
    beat();
    const interval = setInterval(beat, 15000);
    return () => clearInterval(interval);
  }, [ticketId]);

  if (viewers.length === 0) return null;

  const MAX_VISIBLE = 3;
  const visible = viewers.slice(0, MAX_VISIBLE);
  const overflow = viewers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2 px-4 py-3 mb-2">
      <div className="flex items-center">
        {visible.map((viewer, i) => (
          <div
            key={viewer.id}
            className="relative -ml-1.5 first:ml-0 ring-2 ring-background rounded-full transition-all duration-200"
            style={{ zIndex: MAX_VISIBLE - i }}
            title={viewer.name || viewer.email}
          >
            <Avatar name={viewer.name || viewer.email || '?'} size={20} />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="relative -ml-1.5 ring-2 ring-background rounded-full flex items-center justify-center bg-surface-hover text-fg-muted font-semibold"
            style={{ width: 20, height: 20, zIndex: 0 }}
            title={`${overflow} more viewer${overflow !== 1 ? 's' : ''}`}
          >
            <span className="text-[9px]">+{overflow}</span>
          </div>
        )}
      </div>
      <span className="text-[12px] text-fg-muted font-medium">
        {viewers.length === 1 ? '1 agent viewing' : `${viewers.length} agents viewing`}
      </span>
    </div>
  );
}
