import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UndoToast } from '@/components/email/UndoToast';
import { InboxIcon } from 'hugeicons-react';
import {
  Star, Forward, X, Mail, Lock,
  Paperclip, Sparkles, Trash2, AlertCircle, Plus, RotateCcw,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, IconButton } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';
import { cn } from '@/lib/utils';
import { formatTime, formatFullDate, displayName } from '@/lib/date-utils';
import type { ApiEmail, DisplayEmail } from '@/lib/email-types';
import { adaptEmail } from '@/lib/email-types';
import { useSpace } from '@/contexts/space-context';
import { buildThreadTimeline } from '@/lib/thread-timeline';
import type { ThreadTimelineEntry } from '@/lib/thread-timeline';
import { TagChip, TagPicker, type TagPickerTag } from '@/components/ds';
import { MessageComposer, type MessageComposerHandle } from '@/components/MessageComposer';

// ── Sub-components ─────────────────────────────────────────────────────

function EmailBodyRenderer({ email }: { email: DisplayEmail }) {
  if (email.bodyHtml) {
    const sanitized = DOMPurify.sanitize(email.bodyHtml, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'span', 'div', 'sup', 'sub', 'strike', 'del', 'ins'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'width', 'height', 'target', 'rel', 'align', 'valign', 'colspan', 'rowspan', 'border', 'cellpadding', 'cellspacing'],
      ALLOW_DATA_ATTR: false,
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset'],
    });
    return (
      <div className="email-html-body text-[14px] leading-[1.75] text-foreground overflow-x-auto max-w-full"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }
  const mdHtml = DOMPurify.sanitize(
    marked.parse(email.bodyText || '', { breaks: true, gfm: true }) as string
  );
  return (
    <div className="email-html-body text-[14px] leading-[1.75] text-foreground"
      dangerouslySetInnerHTML={{ __html: mdHtml || '<em>(no content)</em>' }}
    />
  );
}

// ── Email Chip Input (used by forward composer) ────────────────────────

function EmailChipInput({
  value, onChange, contacts, placeholder, readOnly,
}: {
  value: string; onChange: (v: string) => void; contacts: string[]; placeholder?: string; readOnly?: boolean;
}) {
  const emails = useMemo(() => value.split(',').map(s => s.trim()).filter(Boolean), [value]);
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = contacts.filter(c => c.toLowerCase().includes(inputValue.toLowerCase()) && !emails.includes(c));

  const addEmail = (email: string) => {
    if (readOnly) return;
    const trimmed = email.trim();
    if (trimmed && !emails.includes(trimmed)) onChange([...emails, trimmed].join(', '));
    setInputValue(''); setDropdownOpen(false);
  };
  const removeEmail = (email: string) => { if (!readOnly) onChange(emails.filter(e => e !== email).join(', ')); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'Enter') { e.preventDefault(); if (filtered.length > 0) addEmail(filtered[0]); else if (inputValue.trim()) addEmail(inputValue); }
    else if (e.key === 'Backspace' && !inputValue && emails.length > 0) onChange(emails.slice(0, -1).join(', '));
    else if (e.key === ',' && inputValue.trim()) { e.preventDefault(); addEmail(inputValue); }
  };

  return (
    <div ref={ref} className="flex-1 min-w-0 relative">
      <div className="flex flex-wrap items-center gap-1">
        {emails.map(email => (
          <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[14px] bg-brand/10 text-brand font-medium whitespace-nowrap max-w-full">
            <span className="truncate">{email}</span>
            <button onClick={() => removeEmail(email)} type="button" className="flex items-center justify-center border-none bg-transparent cursor-pointer p-0 text-brand/50 hover:text-brand shrink-0"><X size={11} /></button>
          </span>
        ))}
        <TextInput
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setDropdownOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setDropdownOpen(true)}
          placeholder={emails.length === 0 ? placeholder : ''}
          variant="ghost"
          className="flex-1 min-w-[80px] py-2 px-0 h-auto text-[14px]"
        />
      </div>
      {dropdownOpen && inputValue && filtered.length > 0 && (
        <div className="absolute left-0 top-full mt-0.5 z-50 w-full bg-background border border-border rounded-xl p-1 max-h-48 overflow-y-auto">
          {filtered.map(email => (
            <button key={email} onClick={() => addEmail(email)} type="button" className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] text-foreground hover:bg-surface-hover transition-colors bg-none border-none cursor-pointer">{email}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel Props ────────────────────────────────────────────────────────

type EmailViewerProps = {
  email: DisplayEmail | null;
  onUpdate: () => void;
  onAiClick?: (setBody: (draft: string) => void) => void;
  aiPanelOpen?: boolean;
  aiPanelWidth?: string;
  onBack?: () => void;
};

// ── Bubble rounding helper ─────────────────────────────────────────────

function getBubbleRounding(idx: number, groupSize: number, isOut: boolean) {
  const outer = isOut ? 'rounded-tr-[4px]' : 'rounded-tl-[4px]';
  if (groupSize === 1) return `rounded-[14px] ${outer}`;
  if (idx === 0) return `rounded-t-[14px] rounded-b-[6px] ${outer}`;
  if (idx === groupSize - 1) return `rounded-t-[6px] rounded-b-[14px] ${outer}`;
  return `rounded-[6px] ${outer}`;
}

// ── Panel Component ────────────────────────────────────────────────────

export function EmailViewer({ email, onUpdate, onAiClick: onAiClickProp, aiPanelOpen, aiPanelWidth = "500px", onBack }: EmailViewerProps) {
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const messageComposerRef = useRef<MessageComposerHandle>(null);

  // star state
  const [starred, setStarred] = useState(email?.starred ?? false);

  // composer state
  const [messageSending, setMessageSending] = useState(false);

  // forward state
  const [showForward, setShowForward] = useState(false);
  const [forwardTo, setForwardTo] = useState('');
  const [forwardCc, setForwardCc] = useState('');
  const [forwardBcc, setForwardBcc] = useState('');
  const [forwardShowCc, setForwardShowCc] = useState(false);
  const [forwardShowBcc, setForwardShowBcc] = useState(false);
  const [forwardBody, setForwardBody] = useState('');
  const [forwardSending, setForwardSending] = useState(false);
  const [forwardError, setForwardError] = useState('');
  const [forwardFrom, setForwardFrom] = useState('');

  // tag state
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [emailTags, setEmailTags] = useState<string[]>(email?.raw.labels ?? []);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const tagsExpandTimer = useRef<ReturnType<typeof setTimeout>>();
  const [extraTagsOpen, setExtraTagsOpen] = useState(false);
  const [senderInfoOpen, setSenderInfoOpen] = useState<string | null>(null);
  const extraTagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (extraTagsRef.current && !extraTagsRef.current.contains(e.target as Node)) {
        setExtraTagsOpen(false);
      }
    };
    if (extraTagsOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [extraTagsOpen]);

  useEffect(() => { setEmailTags(email?.raw.labels ?? []); }, [email?.raw.id, email?.raw.labels]);

  useEffect(() => { return () => clearTimeout(tagsExpandTimer.current); }, []);

  const { data: allTags = [] } = useQuery<TagPickerTag[]>({
    queryKey: ['/api/spaces', email?.raw.spaceId, 'tags'],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${email?.raw.spaceId}/tags`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!email?.raw.spaceId,
  });

  const handleAddTag = async (tagId: string) => {
    if (!email || emailTags.includes(tagId)) return;
    const updated = [...emailTags, tagId];
    setEmailTags(updated);
    await fetch(`/api/emails/${email.raw.id}/tags`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds: [tagId] }),
    });
    onUpdate();
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!email) return;
    const updated = emailTags.filter(id => id !== tagId);
    setEmailTags(updated);
    await fetch(`/api/emails/${email.raw.id}/tags/${tagId}`, {
      method: 'DELETE', credentials: 'include',
    });
    onUpdate();
  };

  const handleToggleTag = (tagId: string) => {
    if (emailTags.includes(tagId)) {
      handleRemoveTag(tagId);
    } else {
      handleAddTag(tagId);
    }
  };

  const appliedTags = allTags.filter(t => emailTags.includes(t.id));
  const DISPLAY_TAG_LIMIT = 3;
  const displayTags = appliedTags.slice(0, DISPLAY_TAG_LIMIT);
  const extraTagCount = appliedTags.length - DISPLAY_TAG_LIMIT;

  // thread data
  const { data: threadData, isLoading: threadLoading } = useQuery<{ emails: ApiEmail[] }>({
    queryKey: ['/api/emails', email?.raw.id, 'thread'],
    queryFn: async () => {
      const res = await fetch(`/api/emails/${email?.raw.id}/thread`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!email?.raw.id,
  });

  const { activeSpace } = useSpace();
  const inboxEmail = activeSpace?.emailAddress ?? email?.raw.toAddress ?? '';

  const threadEmails: DisplayEmail[] = email ? (threadData?.emails ?? [email.raw])
    .slice()
    .sort((a, b) => {
      const timeDelta = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
      if (timeDelta !== 0) return timeDelta;
      return a.id - b.id;
    })
    .map(adaptEmail) : [];

  const threadTimeline: ThreadTimelineEntry[] = buildThreadTimeline(threadEmails, inboxEmail);
  const threadContext = email ? `From: ${email.sender} <${email.senderEmail}>\nSubject: ${email.subject}\nDate: ${email.fullDate}\n${email.bodyText || email.preview || ""}` : '';

  // group consecutive messages by direction for smart bubble rounding
  const bubbleGroups = useMemo(() => {
    const groups: { direction: 'incoming' | 'outgoing'; entries: ThreadTimelineEntry[] }[] = [];
    for (const entry of threadTimeline) {
      const last = groups[groups.length - 1];
      if (last && last.direction === entry.direction) {
        last.entries.push(entry);
      } else {
        groups.push({ direction: entry.direction, entries: [entry] });
      }
    }
    return groups;
  }, [threadTimeline]);

  // mark as read
  const patchEmail = async (data: Record<string, boolean>) => {
    if (!email) return;
    await fetch(`/api/emails/${email.raw.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    onUpdate();
  };

  useEffect(() => { if (email && !email.raw.isRead) patchEmail({ isRead: true }); }, [email?.raw.id]);

  const handleStar = () => { const ns = !starred; setStarred(ns); patchEmail({ isStarred: ns }); };
  const handleTrash = async () => {
    if (!email) return;
    await fetch(`/api/emails/${email.raw.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mailbox: 'trash' }),
    });
    onUpdate();
  };
  const handleRestore = async () => {
    if (!email) return;
    await fetch(`/api/emails/${email.raw.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mailbox: 'inbox' }),
    });
    onUpdate();
  };
  const handleDeleteForever = async () => {
    if (!email) return;
    if (!window.confirm('Permanently delete this email? This cannot be undone.')) return;
    await fetch(`/api/emails/${email.raw.id}`, { method: 'DELETE', credentials: 'include' });
    onUpdate();
  };

  const isTrash = email?.raw.mailbox === 'trash';

  // forward prefill
  useEffect(() => {
    if (showForward && !forwardBody && email) {
      setForwardFrom(inboxEmail);
      const cleanText = (email.raw.bodyHtml || '')
        .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n').trim() || email.raw.bodyText || '';
      const quoted = `\n\n\n---------- Forwarded message ---------\nFrom: ${email.sender} <${email.senderEmail}>\nSubject: ${email.subject}\nDate: ${email.fullDate}\nTo: ${email.raw.toAddress}\n\n${cleanText}`;
      setForwardBody(quoted);
    }
  }, [showForward, email]);

  const [showReplyUndo, setShowReplyUndo] = useState(false);
  const [showForwardUndo, setShowForwardUndo] = useState(false);
  const replyPayloadRef = useRef('');
  const forwardPayloadRef = useRef<{ to: string; body: string; cc: string; bcc: string; from: string }>({ to: '', body: '', cc: '', bcc: '', from: '' });

  const handleComposerSend = async (content: string, type: 'reply' | 'internal_note') => {
    if (!email || !content.trim() || messageSending) return;
    setMessageSending(true);
    if (type === 'reply') {
      replyPayloadRef.current = content;
      setShowReplyUndo(true);
    } else {
      try {
        const res = await fetch(`/api/emails/${email.raw.id}/internal-note`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: content }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? 'Failed to create internal note');
        }
        queryClient.invalidateQueries({ queryKey: ['/api/emails', email.raw.id, 'thread'] });
        onUpdate();
      } catch (e: any) { /* swallow */ }
      setMessageSending(false);
    }
  };

  const executeReplySend = async () => {
    if (!email) return;
    const body = replyPayloadRef.current;
    if (!body.trim()) return;
    try {
      const res = await fetch(`/api/emails/${email.raw.id}/reply`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      setShowReplyUndo(false);
      queryClient.invalidateQueries({ queryKey: ['/api/emails', email.raw.id, 'thread'] });
      onUpdate();
    } catch (e: any) { /* swallow */ }
    setMessageSending(false);
  };

  const executeForwardSend = async () => {
    if (!email) return;
    const p = forwardPayloadRef.current;
    if (!p.to.trim() || !p.body.trim()) return;
    try {
      const res = await fetch(`/api/emails/${email.raw.id}/forward`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: p.to.trim(), subject: `Fwd: ${email.subject}`, body: p.body, cc: p.cc || undefined, bcc: p.bcc || undefined, from: p.from || undefined }),
      });
      if (!res.ok) throw new Error('Failed to forward');
      setForwardBody(''); setShowForward(false);
      setForwardTo(''); setForwardCc(''); setForwardBcc(''); setForwardShowCc(false); setForwardShowBcc(false);
      queryClient.invalidateQueries({ queryKey: ['/api/emails', email.raw.id, 'thread'] });
      onUpdate();
    } catch (e: any) { setForwardError(e.message ?? 'Failed to forward'); }
  };

  const handleForwardSend = async () => {
    if (!forwardTo.trim() || !forwardBody.trim() || forwardSending) return;
    setForwardSending(true);
    forwardPayloadRef.current = { to: forwardTo, body: forwardBody, cc: forwardCc, bcc: forwardBcc, from: forwardFrom };
    setShowForwardUndo(true);
  };

  const handleReplyUndo = () => {
    setShowReplyUndo(false);
    setMessageSending(false);
    messageComposerRef.current?.setMessage(replyPayloadRef.current);
    replyPayloadRef.current = '';
  };

  const handleForwardUndo = () => {
    setShowForwardUndo(false);
    setForwardSending(false);
    forwardPayloadRef.current = { to: '', body: '', cc: '', bcc: '', from: '' };
  };

  const handleAiClick = useCallback(() => {
    onAiClickProp?.((draft: string) => messageComposerRef.current?.setMessage(draft));
  }, [onAiClickProp]);

  if (!email) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center mb-3">
          <InboxIcon size={24} className="text-fg-faint" />
        </div>
        <p className="text-[14px] font-medium text-fg-muted">Select an email to read</p>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="h-full flex flex-col bg-background"
    >
      {/* ── Header toolbar ── */}
      <div className="flex items-center px-3 md:pt-1 md:pb-1.5 shrink-0 border-b border-border/40 max-md:min-h-[52px]">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-foreground hover:bg-surface-hover transition-colors shrink-0 mr-2 border-none bg-transparent cursor-pointer"
            aria-label="Back to inbox"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
        )}
        {/* Tags in toolbar */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-0">
          <div className="flex items-center gap-1 flex-nowrap self-center leading-none overflow-hidden">
            {appliedTags.length > 1 ? (
              <div
                className="flex items-center cursor-pointer relative self-center my-auto"
                onClick={() => {
                  setTagsExpanded(true);
                  clearTimeout(tagsExpandTimer.current);
                  tagsExpandTimer.current = setTimeout(() => setTagsExpanded(false), 3000);
                }}
              >
                {displayTags.map((tag, i) => {
                  const isLast = i === displayTags.length - 1;
                  return (
                    <div
                      key={tag.id}
                      className="relative my-auto transition-all duration-300 ease-out whitespace-nowrap"
                      style={{
                        marginLeft: i === 0 ? 0 : (tagsExpanded ? 4 : -20),
                        zIndex: i,
                        maxWidth: tagsExpanded || isLast ? 250 : 48,
                      }}
                    >
                      <TagChip
                        name={tag.name}
                        color={tag.color}
                        size="sm"
                        onRemove={() => handleRemoveTag(tag.id)}
                        className="ring-2 ring-background transition-all duration-300 ease-out"
                      />
                    </div>
                  );
                })}
                {extraTagCount > 0 && (
                  <div
                    ref={extraTagsRef}
                    className="relative my-auto transition-all duration-300 ease-out cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setExtraTagsOpen(!extraTagsOpen); }}
                    style={{
                      marginLeft: tagsExpanded ? 4 : -20,
                      zIndex: displayTags.length,
                    }}
                  >
                    <span className="inline-flex items-center gap-1 font-medium h-[18px] px-1.5 py-0 rounded-[6px] text-[10.5px] leading-none shrink-0 select-none bg-muted text-fg-muted ring-2 ring-background whitespace-nowrap">
                      +{extraTagCount}
                    </span>
                    {extraTagsOpen && (
                      <div className="absolute z-50 left-0 top-full mt-1.5 min-w-[200px] bg-background border border-border rounded-[16px] p-1.5 space-y-0.5 shadow-lg">
                        <div className="max-h-56 overflow-y-auto space-y-0.5">
                          {appliedTags.map(tag => (
                            <div
                              key={tag.id}
                              className="flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-left text-[13px] font-medium transition-all duration-100 ease-out text-fg-muted cursor-default"
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
                              <span className="truncate">{tag.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              appliedTags.map(tag => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} size="sm" onRemove={() => handleRemoveTag(tag.id)} />
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isTrash ? (
            <>
              <button
                onClick={handleDeleteForever}
                title="Delete forever"
                className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={handleRestore}
                title="Restore"
                className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStar}
                title={starred ? 'Unstar' : 'Star'}
                className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Star size={14} className={starred ? 'fill-amber text-amber' : ''} />
              </button>
              <button
                onClick={() => { setShowForward(true); }}
                title="Forward"
                className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
              >
                <Forward size={14} />
              </button>
              <button
                onClick={handleTrash}
                title="Trash"
                className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <div className="relative flex items-center">
            <button
              onClick={() => setTagPickerOpen(!tagPickerOpen)}
              title="Add tag"
              className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
            <TagPicker
              open={tagPickerOpen}
              onClose={() => setTagPickerOpen(false)}
              tags={allTags}
              selectedIds={emailTags}
              spaceId={email.raw.spaceId}
              onToggle={handleToggleTag}
              onTagCreated={(tag) => {
                handleAddTag(tag.id);
                queryClient.setQueryData(['/api/spaces', email.raw.spaceId, 'tags'], (old: TagPickerTag[] = []) => {
                  if (old.some(t => t.id === tag.id || t.name.toLowerCase() === tag.name.toLowerCase())) return old;
                  return [...old, tag];
                });
              }}
              onTagUpdated={(tag) => {
                queryClient.setQueryData(['/api/spaces', email.raw.spaceId, 'tags'], (old: TagPickerTag[] = []) =>
                  old.map(t => t.id === tag.id ? tag : t)
                );
              }}
              onClear={async () => {
                for (const tagId of emailTags) {
                  await fetch(`/api/emails/${email.raw.id}/tags/${tagId}`, { method: 'DELETE', credentials: 'include' });
                }
                setEmailTags([]);
                onUpdate();
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Subject - subtle header */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[13px] font-medium text-fg-muted">{email.subject}</span>
        </div>

        {/* Chat bubbles */}
        {!threadLoading ? (
          <div className="px-4 pb-2 space-y-0.5">
            {bubbleGroups.map((group, gi) => {
              const isOut = group.direction === 'outgoing';
              const lastEntry = group.entries[group.entries.length - 1];
              const lastMsg = lastEntry.email as DisplayEmail;
              return (
                <div key={gi} className={cn('flex flex-col mb-3', isOut ? 'items-end' : 'items-start')}>
                  {group.entries.map((entry, ei) => {
                    const msg = entry.email as DisplayEmail;
                    return (
                      <div key={msg.id} className={cn(
                        'bg-surface-muted px-3 py-2 max-w-[85%] text-[13.5px] leading-[1.7] text-foreground break-words',
                        getBubbleRounding(ei, group.entries.length, isOut),
                      )}>
                        <EmailBodyRenderer email={msg} />
                      </div>
                    );
                  })}
                  {/* Sender name below the last bubble in the group */}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 mt-1.5',
                      isOut ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    {isOut ? (
                      <span className="text-[11px] font-medium text-fg-muted">
                        <Mail size={10} className="inline mr-0.5 -mt-0.5" />
                        You
                      </span>
                    ) : (
                      <button
                        onClick={() => setSenderInfoOpen(senderInfoOpen === lastMsg.id ? null : lastMsg.id)}
                        className="text-[11px] font-medium text-fg-muted hover:underline bg-none border-none p-0 cursor-pointer"
                      >
                        {lastMsg.sender || lastMsg.senderEmail}
                      </button>
                    )}
                    <span className="text-[10px] text-fg-faint">{lastMsg.time}</span>
                    {senderInfoOpen === lastMsg.id && !isOut && (
                      <div className="absolute z-10 mt-6 p-2.5 rounded-[10px] bg-surface-muted border border-border/60 text-[11px] space-y-0.5 shadow-lg">
                        <div><span className="text-fg-subtle">From:</span> <span className="text-foreground font-medium">{lastMsg.sender} &lt;{lastMsg.senderEmail}&gt;</span></div>
                        <div><span className="text-fg-subtle">To:</span> <span className="text-foreground">{lastMsg.raw.toAddress}</span></div>
                        <div><span className="text-fg-subtle">Date:</span> <span className="text-foreground">{lastMsg.fullDate}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 space-y-4 py-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-3 w-40 bg-surface-hover rounded" />
                <div className="h-3 w-full bg-surface-hover rounded" />
                <div className="h-3 w-3/4 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Reply / Forward undo toast */}
        {showReplyUndo && (
          <UndoToast message="Sending reply..." onUndo={handleReplyUndo} onComplete={executeReplySend} />
        )}
        {showForwardUndo && (
          <UndoToast message="Forwarding..." onUndo={handleForwardUndo} onComplete={executeForwardSend} />
        )}

        {/* Composer area */}
        <div ref={composerRef} className="px-4 pb-4 pt-2">
          {showForward ? (
            <ForwardComposer
              to={forwardTo} setTo={setForwardTo}
              cc={forwardCc} setCc={setForwardCc}
              bcc={forwardBcc} setBcc={setForwardBcc}
              showCc={forwardShowCc} setShowCc={setForwardShowCc}
              showBcc={forwardShowBcc} setShowBcc={setForwardShowBcc}
              body={forwardBody} setBody={setForwardBody}
              sending={forwardSending} error={forwardError}
              onSend={handleForwardSend}
              onDiscard={() => { setShowForward(false); setForwardBody(''); setForwardTo(''); setForwardCc(''); setForwardBcc(''); setForwardShowCc(false); setForwardShowBcc(false); }}
              threadContext={threadContext}
              onAiClick={(setter) => onAiClickProp?.(setter)}
              from={forwardFrom}
              setFrom={setForwardFrom}
            />
          ) : (
            <MessageComposer
              ref={messageComposerRef}
              onSend={handleComposerSend}
              isPending={messageSending}
              onAiClick={handleAiClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline Forward Composer ────────────────────────────────────────────

function ForwardComposer({ to, setTo, cc, setCc, bcc, setBcc, showCc, setShowCc, showBcc, setShowBcc, body, setBody, sending, error, onSend, onDiscard, threadContext, onAiClick, from, setFrom }: {
  to: string; setTo: (v: string) => void;
  cc: string; setCc: (v: string) => void;
  bcc: string; setBcc: (v: string) => void;
  showCc: boolean; setShowCc: (v: boolean) => void;
  showBcc: boolean; setShowBcc: (v: boolean) => void;
  body: string; setBody: (v: string) => void;
  sending: boolean; error: string;
  onSend: () => void; onDiscard: () => void;
  threadContext?: string;
  onAiClick?: (setBody: (draft: string) => void) => void;
  from: string; setFrom: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input ref={fileInputRef} type="file" multiple className="hidden" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] text-foreground shrink-0">From:</span>
        <TextInput
          value={from}
          onChange={e => setFrom(e.target.value)}
          placeholder="sender@example.com"
          variant="ghost"
          className="flex-1 px-2 py-1 border border-border/60"
        />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] text-foreground shrink-0">To</span>
        <EmailChipInput value={to} onChange={setTo} contacts={[]} placeholder="Recipient email" />
        <div className="flex gap-1.5 shrink-0">
          {!showCc && <Button design="ghost" size="xs" onClick={() => setShowCc(true)}>Cc</Button>}
          {!showBcc && <Button design="ghost" size="xs" onClick={() => setShowBcc(true)}>Bcc</Button>}
        </div>
      </div>
      {showCc && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] text-foreground shrink-0">Cc</span>
          <EmailChipInput value={cc} onChange={setCc} contacts={[]} placeholder="Cc recipient" />
        </div>
      )}
      {showBcc && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] text-foreground shrink-0">Bcc</span>
          <EmailChipInput value={bcc} onChange={setBcc} contacts={[]} placeholder="Bcc recipient" />
        </div>
      )}
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your message..."
        autoFocus
        className="border border-border/60 rounded-[10px] bg-background resize-none min-h-[200px] text-[13px] leading-[1.7] py-2.5 px-3 w-full"
      />
      {error && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertCircle size={12} className="text-danger shrink-0" />
          <span className="text-[13px] text-danger">{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <Button size="xs" onClick={onSend} disabled={!to.trim() || !body.trim() || sending} isLoading={sending} className="px-3">
          Send
        </Button>
        <div className="flex items-center gap-1">
          <IconButton icon={Paperclip} size="sm" design="ghost" onClick={() => fileInputRef.current?.click()} title="Attach" />
          <IconButton icon={Trash2} size="sm" design="ghost" onClick={onDiscard} title="Discard" className="hover:text-destructive" />
        </div>
      </div>
    </div>
  );
}
