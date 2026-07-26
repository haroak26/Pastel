import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Star, Reply, Forward, Send, X, Plus, AlertCircle,
  InboxIcon, Paperclip, FileText,
  Clock, Check, Trash2, ChevronRight, ChevronDown, ChevronsUpDown, Loader, RefreshCw,
} from 'lucide-react';
import { FilterAddIcon, Search01Icon } from 'hugeicons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { useLocation } from 'wouter';
import { Button } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { IconButton } from '@/components/button';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';
import { EmailViewer } from '@/components/EmailViewer';
import { EmailInfo } from '@/components/EmailInfo';
import { useSpace } from '@/contexts/space-context';
import { cn } from '@/lib/utils';
import { formatTime, formatFullDate, dayBucketLabel, compactSenderName } from '@/lib/date-utils';
import type { ApiEmail, DisplayEmail } from '@/lib/email-types';
import { adaptEmail } from '@/lib/email-types';
import { useSpaceMutations } from '@/hooks/use-mutations';
import { AppBody, EmptyState, Dropdown, SplitContentPanels, type TagPickerTag } from '@/components/ds';
import { SpaceMailboxList } from '@/components/mail/SpaceMailboxList';
import { ComposeWindow } from '@/components/mail/ComposeWindow';

interface ApiSpace {
  id: number;
  name: string;
  emailAddress: string;
  spaceType: string;
  unreadCount: number;
}

type FilterId = 'all' | 'unread' | 'starred' | 'sent';
type SortId = 'newest' | 'oldest' | 'sender-asc' | 'sender-desc';

function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border border-border rounded-[16px] p-5 shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold">Keyboard Shortcuts</span>
          <button onClick={onClose} className="text-fg-muted hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-2 text-[13px]">
          {[
            ['j / k', 'Move up / down threads'],
            ['Enter', 'Open selected thread'],
            ['#', 'Trash thread'],
            ['s', 'Star / unstar'],
            ['r', 'Reply to thread'],
            ['u', 'Mark unread'],
            ['?', 'Toggle this menu'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-muted border border-border">{key}</span>
              <span className="text-fg-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpaceMailboxPage({ mailbox: initialMailbox }: { mailbox?: 'inbox' | 'starred' | 'sent' | 'trash' | 'drafts' }) {
  const queryClient = useQueryClient();
  const { activeSpaceId, activeSpace } = useSpace();
  const mailbox = initialMailbox ?? 'inbox';
  const [sort, setSort] = useState<SortId>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState<"compose" | "reply">("compose");
  const aiSetBodyRef = useRef<((draft: string) => void) | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [loadOffset, setLoadOffset] = useState(0);
  const [allThreads, setAllThreads] = useState<{ threadId: string; messages: ApiEmail[] }[]>([]);

  useEffect(() => { setSelectedId(null); setSenderFilter(null); setLoadOffset(0); setAllThreads([]); }, [activeSpaceId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchVisible && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchVisible(false);
        setSearch('');
      }
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchVisible, filterOpen]);

  const requestMailbox = mailbox === 'sent' ? 'sent'
    : mailbox === 'trash' ? 'trash'
    : mailbox === 'drafts' ? 'draft'
    : 'inbox';

  const queryKey: unknown[] = ['/api/spaces', activeSpaceId, 'threads', requestMailbox];
  const loadMoreKey: unknown[] = ['/api/spaces', activeSpaceId, 'threads', requestMailbox, 'offset', loadOffset];

  const { data: emailData, isLoading, isError, refetch } = useQuery<{ threads: { threadId: string; messages: ApiEmail[] }[] }>({
    queryKey: loadMoreKey,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', offset: String(loadOffset) });
      if (requestMailbox !== 'inbox') params.set('mailbox', requestMailbox);
      const res = await fetch(`/api/spaces/${activeSpaceId}/threads?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeSpaceId,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (emailData?.threads) {
      setAllThreads(prev => {
        if (loadOffset === 0) return emailData.threads;
        const existing = new Set(prev.map(t => t.threadId));
        const merged = [...prev];
        for (const t of emailData.threads) {
          if (!existing.has(t.threadId)) {
            merged.push(t);
            existing.add(t.threadId);
          }
        }
        return merged;
      });
    }
  }, [emailData, loadOffset]);

  const { data: allTags = [] } = useQuery<TagPickerTag[]>({
    queryKey: ['/api/spaces', activeSpaceId, 'tags'],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${activeSpaceId}/tags`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeSpaceId,
  });

  const uniqueSenders = useMemo(() => {
    const base = allThreads;
    const set = new Set<string>();
    for (const t of base) {
      for (const m of t.messages) {
        const inboxEmail = activeSpace?.emailAddress?.toLowerCase();
        if (m.fromAddress.toLowerCase() !== inboxEmail) {
          set.add(m.fromAddress);
        }
      }
    }
    return Array.from(set).sort();
  }, [allThreads, activeSpace?.emailAddress]);

  const threads = useMemo(() => {
    const base = allThreads;
    const q = search.trim().toLowerCase();

    let filtered = base
      .map(t => {
        const latest = t.messages[t.messages.length - 1];
        const adapted = adaptEmail(latest);
        return { ...t, adapted };
      })
      .filter(t => {
        if (!q) return true;
        const haystack = `${t.adapted.sender} ${t.adapted.senderEmail} ${t.adapted.subject} ${t.adapted.preview}`.toLowerCase();
        return haystack.includes(q);
      });

    if (senderFilter) {
      filtered = filtered.filter(t =>
        t.messages.some(m => m.fromAddress.toLowerCase() === senderFilter.toLowerCase())
      );
    }

    if (tagFilter.length > 0) {
      filtered = filtered.filter(t =>
        t.messages.some(m => (m.labels ?? []).some(l => tagFilter.includes(l)))
      );
    }

    if (mailbox === 'starred') {
      filtered = filtered.filter(t => t.messages.some(m => m.isStarred));
    } else if (mailbox === 'inbox') {
    }

    filtered.sort((a, b) => {
      const aLatest = a.messages[a.messages.length - 1];
      const bLatest = b.messages[b.messages.length - 1];
      if (sort === 'oldest') {
        return new Date(aLatest.sentAt).getTime() - new Date(bLatest.sentAt).getTime();
      } else if (sort === 'sender-asc') {
        return (a.adapted.sender || '').localeCompare(b.adapted.sender || '');
      } else if (sort === 'sender-desc') {
        return (b.adapted.sender || '').localeCompare(a.adapted.sender || '');
      }
      return new Date(bLatest.sentAt).getTime() - new Date(aLatest.sentAt).getTime();
    });

    return filtered;
  }, [allThreads, search, mailbox, sort, senderFilter, tagFilter]);

  const allEmails = useMemo(() => threads.flatMap(t => t.messages.map(adaptEmail)), [threads]);

  const selectedEmailRef = useRef<DisplayEmail | null>(null);
  const selectedEmail = useMemo(() => {
    const email = selectedId ? allEmails.find(e => e.id === selectedId) ?? null : null;
    if (email) selectedEmailRef.current = email;
    return email ?? (selectedId ? selectedEmailRef.current : null);
  }, [selectedId, allEmails]);

  useEffect(() => {
    if (threads.length > 0 && !selectedId) {
      const firstId = String(threads[0].messages[threads[0].messages.length - 1].id);
      setSelectedId(firstId);
    }
  }, [threads, selectedId]);

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
    if (activeSpaceId) {
      fetch(`/api/spaces/${activeSpaceId}/sync`, {
        method: 'POST',
        credentials: 'include'
      })
        .then(() => queryClient.invalidateQueries({ queryKey }))
        .catch(() => {});
    }
  };

  const headerConfig = mailbox === 'trash' ? { title: 'Trash', icon: Trash2, iconColor: '#4682B4' }
    : mailbox === 'starred' ? { title: 'Starred', icon: Star, iconColor: '#E78A13' }
    : mailbox === 'sent' ? { title: 'Sent', icon: Send, iconColor: '#4682B4' }
    : mailbox === 'drafts' ? { title: 'Drafts', icon: FileText, iconColor: '#4682B4' }
    : {
        title: activeSpace?.spaceType === 'chat' ? 'Chat' : 'Inbox',
        icon: InboxIcon,
        iconColor: '#4682B4',
      };

  const senderDropdownOptions = useMemo(() => {
    const opts = uniqueSenders.map(s => ({ value: s, label: s }));
    if (senderFilter && !uniqueSenders.includes(senderFilter)) {
      opts.unshift({ value: senderFilter, label: senderFilter });
    }
    return opts;
  }, [uniqueSenders, senderFilter]);

  const aiPanelWidth = '500px';

  const selectedThreadIdx = useMemo(() => {
    if (!selectedId) return -1;
    return threads.findIndex(t =>
      t.messages.some(m => String(m.id) === selectedId)
    );
  }, [threads, selectedId]);

  const hasPrev = selectedThreadIdx > 0;
  const hasNext = selectedThreadIdx >= 0 && selectedThreadIdx < threads.length - 1;

  const handleNavigatePrev = useCallback(() => {
    if (!hasPrev || selectedThreadIdx < 0) return;
    const prevThread = threads[selectedThreadIdx - 1];
    const latestId = String(prevThread.messages[prevThread.messages.length - 1].id);
    setSelectedId(latestId);
  }, [hasPrev, selectedThreadIdx, threads]);

  const handleNavigateNext = useCallback(() => {
    if (!hasNext || selectedThreadIdx < 0) return;
    const nextThread = threads[selectedThreadIdx + 1];
    const latestId = String(nextThread.messages[nextThread.messages.length - 1].id);
    setSelectedId(latestId);
  }, [hasNext, selectedThreadIdx, threads]);

  useEffect(() => {
    const onCompose = () => setComposeOpen(true);
    window.addEventListener('open-compose', onCompose);
    return () => window.removeEventListener('open-compose', onCompose);
  }, []);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (composeOpen || showShortcuts) return;

      const idx = selectedThreadIdx;

      const navigateToIdx = async (targetIdx: number) => {
        if (targetIdx < 0 || targetIdx >= threads.length) return;
        const t = threads[targetIdx];
        const latestId = String(t.messages[t.messages.length - 1].id);
        setSelectedId(latestId);
      };

      const actOnSelected = async (action: string, value?: unknown) => {
        if (idx < 0) return;
        const t = threads[idx];
        const latestId = String(t.messages[t.messages.length - 1].id);
        await fetch(`/api/emails/${latestId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [action]: value ?? true }),
        });
        queryClient.invalidateQueries({ queryKey: ['/api/spaces', activeSpaceId, 'threads'] });
      };

      switch (e.key) {
        case 'j':
          e.preventDefault();
          navigateToIdx(Math.min(idx + 1, threads.length - 1));
          break;
        case 'k':
          e.preventDefault();
          navigateToIdx(Math.max(idx - 1, 0));
          break;
        case 'Enter':
          if (idx >= 0) {
            const t = threads[idx];
            const latestId = String(t.messages[t.messages.length - 1].id);
            setSelectedId(latestId);
          }
          break;
        case '#':
          if (mailbox !== 'trash') {
            e.preventDefault();
            await actOnSelected('mailbox', 'trash');
            if (idx >= 0 && idx < threads.length - 1) {
              const next = threads[idx + 1];
              setSelectedId(String(next.messages[next.messages.length - 1].id));
            } else if (idx > 0) {
              const prev = threads[idx - 1];
              setSelectedId(String(prev.messages[prev.messages.length - 1].id));
            } else {
              setSelectedId(null);
            }
          }
          break;
        case 's':
          e.preventDefault();
          if (idx >= 0) {
            const t = threads[idx];
            const latestId = String(t.messages[t.messages.length - 1].id);
            const isStarred = t.messages.some(m => m.isStarred);
            await fetch(`/api/emails/${latestId}`, {
              method: 'PATCH', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isStarred: !isStarred }),
            });
            queryClient.invalidateQueries({ queryKey: ['/api/spaces', activeSpaceId, 'threads'] });
          }
          break;
        case 'r':
          e.preventDefault();
          if (idx >= 0) setComposeOpen(true);
          break;
        case 'u':
          e.preventDefault();
          await actOnSelected('isRead', false);
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(!showShortcuts);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedThreadIdx, threads, activeSpaceId, composeOpen, showShortcuts, mailbox]);

  const handleLoadMore = useCallback(() => {
    setLoadOffset(prev => prev + 50);
  }, []);

  const hasMore = emailData?.threads && emailData.threads.length >= 50;

  return (
    <>
    <SplitContentPanels
      leftSize={30}
      rightSize={70}
      left={
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 md:pt-1 md:pb-1.5 border-b border-border/40 shrink-0 md:min-h-[32px] max-md:min-h-[52px]">
            <div ref={searchRef} className="flex items-center flex-1 min-w-0">
              {searchVisible ? (
                <div className="flex items-center gap-2 flex-1 min-w-0 animate-in fade-in slide-in-from-right-2 duration-200">
                  <Search01Icon size={13} strokeWidth={1.5} className="max-md:hidden text-fg-faint shrink-0" />
                  <Search01Icon size={18} strokeWidth={1.5} className="md:hidden text-fg-faint shrink-0" />
                  <TextInput
                    placeholder="Search emails..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-0 max-md:h-10 h-7 text-[13px] px-0 border-0 bg-transparent focus:ring-0"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="inline-flex items-center justify-center max-md:h-7 max-md:w-7 h-5 w-5 rounded text-fg-faint hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <X size={12} className="max-md:hidden" />
                      <X size={18} className="md:hidden" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[14px] font-medium text-foreground animate-in fade-in duration-200">{headerConfig.title}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setSearchVisible(!searchVisible)}
                className="inline-flex items-center justify-center max-md:h-8 max-md:w-8 h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
              >
                {searchVisible ? <X size={14} className="max-md:hidden" /> : <Search01Icon size={14} strokeWidth={1.5} className="max-md:hidden" />}
                {searchVisible ? <X size={18} className="md:hidden" /> : <Search01Icon size={18} strokeWidth={1.5} className="md:hidden" />}
              </button>
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={cn(
                    'inline-flex items-center justify-center max-md:h-8 max-md:w-8 h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer',
                    filterOpen ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'
                  )}
                >
                  <FilterAddIcon size={14} strokeWidth={1.5} className="max-md:hidden" />
                  <FilterAddIcon size={18} strokeWidth={1.5} className="md:hidden" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] bg-background border border-border/60 rounded-[12px] p-2.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-medium text-fg-muted px-1">Sort</span>
                        <button
                          onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
                          className="flex items-center gap-2 w-full mt-1 px-2.5 py-1.5 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <ChevronsUpDown size={13} />
                          {sort === 'newest' ? 'Newest' : 'Oldest'}
                        </button>
                      </div>
                      {uniqueSenders.length > 0 && (
                        <div>
                          <span className="text-[11px] font-medium text-fg-muted px-1">Sender</span>
                          <Dropdown
                            value={senderFilter ?? ''}
                            onChange={(v) => setSenderFilter(v || null)}
                            options={[
                              { value: '', label: 'All senders' },
                              ...senderDropdownOptions,
                            ]}
                            menuAlign="left"
                            showChevron={true}
                            className="mt-1"
                            portaled
                          />
                        </div>
                      )}
                      {allTags.length > 0 && (
                        <div>
                          <span className="text-[11px] font-medium text-fg-muted px-1">Tags</span>
                          <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                            {allTags.map(tag => (
                              <button
                                key={tag.id}
                                onClick={() => setTagFilter(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                                className={cn(
                                  'text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors border-none bg-transparent cursor-pointer',
                                  tagFilter.includes(tag.id) ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground'
                                )}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(senderFilter || tagFilter.length > 0 || sort !== 'newest') && (
                        <button
                          onClick={() => { setSenderFilter(null); setTagFilter([]); setSort('newest'); }}
                          className="text-[11px] text-fg-muted hover:text-foreground font-medium px-2.5 py-1 transition-colors border-none bg-transparent cursor-pointer w-full text-left rounded-[8px] hover:bg-surface-hover"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <AppBody>
            {isError ? (
              <EmptyState
                icon={AlertCircle}
                title="Failed to load emails"
                description="Could not fetch your inbox. Check your connection and try again."
                actions={
                  <Button size="xs" onClick={() => refetch()}>
                    <RefreshCw size={12} /> Retry
                  </Button>
                }
              />
            ) : (
              <>
              <SpaceMailboxList
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                threads={threads}
                isLoading={isLoading}
                allTags={allTags}
              />
              {hasMore && threads.length > 0 && (
                <div className="flex justify-center py-4 border-t border-border/60">
                  <Button size="xs" design="ghost" onClick={handleLoadMore}>
                    <ChevronDown size={14} /> Load More
                  </Button>
                </div>
              )}
              </>
            )}
          </AppBody>
        </div>
      }
      right={
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 max-w-[700px]">
            <EmailViewer
              email={selectedEmail}
              onUpdate={handleUpdate}
              onAiClick={(setter) => { aiSetBodyRef.current = setter; setAiPanelMode("reply"); setAiPanelOpen(true); }}
              aiPanelOpen={aiPanelOpen}
              aiPanelWidth={aiPanelWidth}
              onBack={() => setSelectedId(null)}
            />
          </div>
          {selectedEmail && (
            <EmailInfo email={selectedEmail} className="flex-1 min-w-[220px]" />
          )}
        </div>
      }
    />

    <style>{`
      .email-html-body { max-width: 100%; }
      .email-html-body img { max-width: 100%; height: auto; border-radius: 6px; }
      .email-html-body a { color: hsl(var(--brand)); }
      .email-html-body p { margin: 0 0 10px; }
      .email-html-body table { border-collapse: collapse; max-width: 100%; }
      .email-html-body pre { max-width: 100%; overflow-x: auto; white-space: pre-wrap; word-break: break-all; font-size: 12px; background: hsl(var(--surface-muted)); padding: 10px; border-radius: 8px; }
      .email-html-body * { overflow-wrap: break-word; word-break: break-word; }
      .email-html-body blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 12px; margin-left: 0; color: hsl(var(--fg-muted)); }
    `}</style>
    <ShortcutHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    {composeOpen && activeSpace && (
      <ComposeWindow
        spaceId={activeSpace.id}
        spaceName={activeSpace.name !== activeSpace.emailAddress ? activeSpace.name : undefined}
        onClose={() => setComposeOpen(false)}
        contacts={uniqueSenders}
      />
    )}

    <AIAssistantPanel
      open={aiPanelOpen}
      onClose={() => setAiPanelOpen(false)}
      onUseDraft={(draft) => { aiSetBodyRef.current?.(draft); setAiPanelOpen(false); }}
      mode={aiPanelMode}
      width={aiPanelWidth}
    />
  </>);
}

export default function SpaceMailbox() {
  return (
    <AppLayout>
      <SpaceMailboxPage mailbox="inbox" />
    </AppLayout>
  );
}
