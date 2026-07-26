import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader, Bug } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AppPage, PageHeader, ListSkeleton } from "@/components/ds";
import { Button } from '@/components/button';
import { CATEGORY_CONFIG, REVIEW_STATUSES, type Review } from '@/pages/ReviewsOpen';

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ReviewDetail() {
  const [, params] = useRoute('/home/review/detail/:id');
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const id = params?.id;

  const { data: review, isLoading } = useQuery<Review>({
    queryKey: [`/api/reviews/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
    enabled: !!id,
  });

  const patchMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/${id}`] });
    },
  });

  if (isLoading) {
    return (
      <div className="ml-0 mt-3 flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-background md:border md:border-border/60 md:rounded-tl-[16px] flex flex-col overflow-hidden p-4">
          <ListSkeleton rows={10} />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="ml-0 mt-3 flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-background md:border md:border-border/60 md:rounded-tl-[16px] flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[14px] font-semibold text-foreground">Review not found</p>
              <Button onClick={() => navigate('/home/review/bug')} design="ghost" size="xs" className="hover:underline mt-1">Back to reviews</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORY_CONFIG[review.category] ?? CATEGORY_CONFIG['bug'];
  const statusInfo = REVIEW_STATUSES[review.status] ?? REVIEW_STATUSES['open'];
  const CatIcon = catInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
      <div className="ml-0 mt-3 flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-background md:border md:border-border/60 md:rounded-tl-[16px] flex flex-col overflow-hidden">
        <PageHeader
          title={review.subject}
          icon={Bug}
          iconColor={catInfo.color}
          actions={
            <div className="flex items-center gap-2">
              <Button design="ghost" size="xs" onClick={() => navigate('/home/review/bug')}>
                <ArrowLeft size={13} /> Back
              </Button>
              {review.status !== 'resolved' ? (
                <Button size="xs" onClick={() => patchMutation.mutate('resolved')} isLoading={patchMutation.isPending}>
                  <CheckCircle2 size={13} /> Resolve
                </Button>
              ) : (
                <Button onClick={() => patchMutation.mutate('open')} isLoading={patchMutation.isPending}>
                  Reopen review
                </Button>
              )}
            </div>
          }
        />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-3xl mx-auto">
            {/* Subject header */}
            <div className="px-5 pt-6 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: `${catInfo.color}15`, color: catInfo.color }}
                >
                  <CatIcon size={12} />
                  {catInfo.label}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
                >
                  <StatusIcon size={12} />
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-[20px] font-semibold text-foreground leading-snug break-words">{review.subject}</h1>
            </div>

            {/* Meta row */}
            <div className="px-5 pb-4 flex items-center gap-4 flex-wrap">
              <span className="text-[12px] text-fg-muted">
                From <span className="font-medium text-foreground">{review.fromName || review.fromEmail}</span>
              </span>
              {review.fromName && review.fromName !== review.fromEmail && (
                <span className="text-[12px] font-mono text-fg-faint">{review.fromEmail}</span>
              )}
              <span className="text-[12px] text-fg-faint">{formatDateTime(review.createdAt)}</span>
            </div>

            {/* Description body */}
            {review.body ? (
              <div className="px-5 py-5 border-t border-border/40">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                    <span className="text-white text-[11px] font-bold">
                      {(review.fromName || review.fromEmail)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13.5px] font-semibold text-foreground leading-none">
                        {review.fromName || review.fromEmail}
                      </span>
                      <span className="text-[11.5px] text-fg-faint tabular-nums">{formatDateTime(review.createdAt)}</span>
                    </div>
                    <p className="text-[12px] text-fg-muted mt-0.5">{review.fromEmail}</p>
                  </div>
                </div>
                <div className="pl-[44px] text-[14px] leading-[1.75] text-foreground whitespace-pre-wrap break-words">
                  {review.body}
                </div>
              </div>
            ) : (
              <div className="px-5 py-16 text-center border-t border-border/40">
                <p className="text-[13px] text-fg-muted">No description</p>
              </div>
            )}

            {/* Bottom action */}
            <div className="px-5 py-6 border-t border-border/40">
              {review.status !== 'resolved' ? (
                <Button onClick={() => patchMutation.mutate('resolved')} isLoading={patchMutation.isPending}>
                  <CheckCircle2 size={15} /> Resolve review
                </Button>
              ) : (
                <Button onClick={() => patchMutation.mutate('open')} isLoading={patchMutation.isPending}>
                  Reopen review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}
