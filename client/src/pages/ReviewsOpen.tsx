import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Bug, Lightbulb, CheckCircle2, AlertTriangle, Search, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, PillFilter, Dropdown, EmptyState, ListSkeleton, ContentPanel } from "@/components/ds";
import { TextInput } from '@/components/text-input';
import { EscalatedIcon, HumanReviewIcon } from '@/pages/TicketsOpen';

export type Review = {
  id: number;
  userId: number;
  inboxId: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string | null;
  category: string;
  status: string;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'bug': { label: 'Bug', icon: Bug, color: '#DC2B2B' },
  'feature-request': { label: 'Feature Request', icon: Lightbulb, color: '#8b5cf6' },
};

export const REVIEW_STATUSES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'open': { label: 'Open', icon: AlertTriangle, color: '#E78A13' },
  'resolved': { label: 'Resolved', icon: CheckCircle2, color: '#1F9D69' },
  'human_review': { label: 'Human Review', icon: UserCheck, color: '#4682B4' },
  'escalated': { label: 'Escalated', icon: EscalatedIcon, color: '#DC2B2B' },
};

const STATUS_TITLE: Record<string, string> = {
  'open': 'Open',
  'resolved': 'Resolved',
  'human_review': 'Human Review',
  'escalated': 'Escalated',
  'bug': 'Bugs',
  'feature-request': 'Feature Requests',
};

const STATUS_EMPTY: Record<string, { title: string; desc: string }> = {
  'open': { title: 'No open reviews', desc: 'New bugs and feature requests will appear here when created.' },
  'resolved': { title: 'No resolved reviews', desc: 'Resolved bugs and feature requests will appear here.' },
  'human_review': { title: 'No items awaiting review', desc: 'Items requiring human review will appear here.' },
  'escalated': { title: 'No escalated items', desc: 'Escalated items that need immediate attention will show here.' },
  'bug': { title: 'No bugs reported', desc: 'Bugs reported by your team or customers will appear here.' },
  'feature-request': { title: 'No feature requests', desc: 'Feature requests from your team or customers will appear here.' },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfD) / 86400000);
  if (diffDays <= 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Review Row (section-header style) ─────────────────────────────────────

function ReviewRow({ review, isActive, onClick }: { review: Review; isActive: boolean; onClick: () => void }) {
  const catInfo = CATEGORY_CONFIG[review.category] ?? CATEGORY_CONFIG['bug'];
  const statusInfo = REVIEW_STATUSES[review.status] ?? REVIEW_STATUSES['open'];
  const sender = review.fromName || review.fromEmail;
  const time = formatTime(review.createdAt);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-4 sm:px-6 py-2.5 cursor-pointer transition-colors duration-100',
        'hover:bg-surface-active',
        isActive && 'bg-surface-active',
      )}
    >
      {/* Subject — left label */}
      <span className="text-[13px] font-medium text-foreground shrink-0 max-w-[130px] sm:max-w-[220px] truncate">
        {review.subject}
      </span>

      {/* Divider line */}
      <div className="flex-1 h-px bg-border/50 min-w-[12px]" />

      {/* Right: category · status · date · sender */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-[11.5px] font-semibold shrink-0"
          style={{ color: catInfo.color }}
        >
          {catInfo.label}
        </span>
        <span className="w-px h-3 bg-border/60 shrink-0" />
        <span
          className="text-[11.5px] font-semibold shrink-0"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
        <span className="w-px h-3 bg-border/60 shrink-0" />
        <span className="text-[11.5px] text-fg-faint tabular-nums whitespace-nowrap shrink-0">
          {time}
        </span>
        <span className="w-px h-3 bg-border/60 shrink-0 hidden sm:block" />
        <span className="text-[11.5px] text-fg-muted truncate max-w-[90px] hidden sm:block">
          {sender}
        </span>
      </div>
    </div>
  );
}

// ── ReviewsContent ─────────────────────────────────────────────────────

export function ReviewsContent({ defaultFilter = 'open' }: { defaultFilter?: string }) {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [search, setSearch] = useState('');

  const { data: reviewsData, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
    queryFn: async () => { const res = await fetch('/api/reviews', { credentials: 'include' }); if (!res.ok) throw new Error('Failed'); return res.json(); },
  });

  const allReviews = reviewsData ?? [];

  const uniqueSenders = useMemo(() => {
    const set = new Set(allReviews.map(r => r.fromName || r.fromEmail).filter(Boolean));
    return Array.from(set).sort();
  }, [allReviews]);

  const senderDropdownOptions = useMemo(() => {
    const opts = uniqueSenders.map(s => ({ value: s, label: s }));
    if (senderFilter && !uniqueSenders.includes(senderFilter)) {
      opts.unshift({ value: senderFilter, label: senderFilter });
    }
    return opts;
  }, [uniqueSenders, senderFilter]);

  const items = useMemo(() => {
    let filtered = allReviews;

    if (activeFilter === 'all') {
      // show all
    } else if (activeFilter === 'bug' || activeFilter === 'feature-request') {
      filtered = filtered.filter(r => r.category === activeFilter);
    } else {
      filtered = filtered.filter(r => r.status === activeFilter);
    }

    if (senderFilter) {
      filtered = filtered.filter(r => {
        const name = r.fromName || r.fromEmail;
        return name.toLowerCase().includes(senderFilter.toLowerCase());
      });
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.subject.toLowerCase().includes(q) ||
        (r.body && r.body.toLowerCase().includes(q)) ||
        (r.fromName && r.fromName.toLowerCase().includes(q)) ||
        r.fromEmail.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sort === 'newest' ? db - da : da - db;
    });

    return filtered;
  }, [allReviews, activeFilter, senderFilter, search, sort]);

  const catInfo = CATEGORY_CONFIG[activeFilter];
  const statusInfo = REVIEW_STATUSES[activeFilter];
  const headerInfo = catInfo ?? statusInfo ?? REVIEW_STATUSES['open'];
  const title = STATUS_TITLE[activeFilter] ?? 'Reviews';
  const empty = STATUS_EMPTY[activeFilter] ?? STATUS_EMPTY['open'];

  const categoryFilters = Object.entries(CATEGORY_CONFIG);
  const statusFilters = Object.entries(REVIEW_STATUSES);

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title={title}
            icon={headerInfo.icon}
            iconColor={headerInfo.color}
            className="[&_.lds-app-topbar-row]:min-h-[32px] [&_.lds-app-topbar-row]:px-4 [&_.lds-app-topbar-row]:py-1 [&_.lds-app-title]:text-[14px]"
            actions={
              <div className="hidden sm:flex items-center gap-1.5">
                {categoryFilters.map(([key, cfg]) => (
                  <PillFilter key={key} active={activeFilter === key} onClick={() => setActiveFilter(key)}>
                    {cfg.label}
                  </PillFilter>
                ))}
                <div className="w-px h-4 bg-border/60 mx-1" />
                {statusFilters.map(([key, cfg]) => (
                  <PillFilter key={key} active={activeFilter === key} onClick={() => setActiveFilter(key)}>
                    {cfg.label}
                  </PillFilter>
                ))}
                <div className="w-px h-4 bg-border/60 mx-1" />
                <Dropdown
                  value={senderFilter ?? ''}
                  onChange={(v) => setSenderFilter(v || null)}
                  options={[
                    { value: '', label: 'All senders' },
                    ...senderDropdownOptions,
                  ]}
                  searchable
                  searchPlaceholder="Search senders..."
                  showChevron={false}
                  triggerClassName="flex items-center p-0 border-none bg-transparent cursor-pointer"
                  renderTrigger={(selected, open) => (
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors border cursor-pointer',
                      (selected?.value && selected.value !== '') || open
                        ? 'bg-[hsl(var(--surface-active))] border-[hsl(var(--border-subtle))] text-foreground'
                        : 'bg-transparent text-fg-muted border-border/60 hover:bg-[hsl(var(--surface-active))] hover:border-[hsl(var(--border-subtle)/0.5)] hover:text-foreground',
                    )}>
                      {(selected?.value && selected.value !== '') ? selected.label : 'Sender'}
                    </span>
                  )}
                />
                <div className="w-px h-4 bg-border/60 mx-1" />
                <PillFilter active={sort === 'newest'} onClick={() => setSort('newest')}>
                  Newest
                </PillFilter>
                <PillFilter active={sort === 'oldest'} onClick={() => setSort('oldest')}>
                  Oldest
                </PillFilter>
                <div className="w-px h-5 bg-border/60 mx-1" />
                <div className="relative w-48">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
                  <TextInput
                    placeholder="Search reviews..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8"
                    
                  />
                </div>
              </div>
            }
          />
        }
        maxWidth="full"
      >
        {/* Mobile filter bar */}
        <div className="sm:hidden flex items-center gap-1 px-3 py-1.5 border-b border-border overflow-x-auto no-scrollbar">
          {categoryFilters.map(([key, cfg]) => (
            <PillFilter key={key} active={activeFilter === key} onClick={() => setActiveFilter(key)}>
              {cfg.label}
            </PillFilter>
          ))}
          {statusFilters.map(([key, cfg]) => (
            <PillFilter key={key} active={activeFilter === key} onClick={() => setActiveFilter(key)}>
              {cfg.label}
            </PillFilter>
          ))}
          <div className="w-px h-4 bg-border/60 mx-1 shrink-0" />
          <PillFilter active={sort === 'newest'} onClick={() => setSort('newest')}>
            Newest
          </PillFilter>
          <PillFilter active={sort === 'oldest'} onClick={() => setSort('oldest')}>
            Oldest
          </PillFilter>
          <div className="w-px h-4 bg-border/60 mx-1 shrink-0" />
          <div className="relative min-w-0 flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
            <TextInput
              placeholder="Search reviews..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8"
              
            />
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={10} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={headerInfo.icon}
            iconColor={headerInfo.color}
            title={empty.title}
            description={empty.desc}
          />
        ) : (
          <div className="divide-y divide-border/40">
            {items.map(review => (
              <ReviewRow
                key={review.id}
                review={review}
                isActive={false}
                onClick={() => navigate('/home/review/detail/' + review.id)}
              />
            ))}
          </div>
        )}
      </ContentPanel>
    </AppPage>
  );
}

export default function ReviewsOpen() {
  return <ReviewsContent defaultFilter="open" />;
}
