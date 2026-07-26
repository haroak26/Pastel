import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/button';
import { AppPage, AppBodyPadded, PageHeader, EmptyState, ListSkeleton } from "@/components/ds";
import { BarChart3, Bot, Users, TrendingUp, Clock, CheckCircle2, AlertTriangle, MessageSquare, Globe, Loader, ArrowUpRight } from 'lucide-react';
import { useSpace } from '@/contexts/space-context';

interface AnalyticsData {
  totalReplies: number;
  avgResponseTimeMs: number;
  resolutionRate: number;
  escalations: number;
  sentiments: { positive: number; neutral: number; negative: number };
  topTopics: { topic: string; count: number }[];
  dailyActivity: { date: string; replies: number; escalations: number }[];
  languages: { lang: string; count: number }[];
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function StatCard({ label, value, icon: Icon, color, subtitle }: {
  label: string; value: string; icon: React.ElementType; color: string; subtitle?: string;
}) {
  return (
    <div className="border border-border/60 rounded-xl p-4 bg-surface-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-foreground leading-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-fg-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-surface-muted rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative;
  if (total === 0) return <p className="text-[12px] text-fg-faint">No data yet</p>;
  return (
    <div className="flex h-4 rounded-full overflow-hidden">
      <div className="bg-emerald-500" style={{ width: `${(positive / total) * 100}%` }} />
      <div className="bg-amber" style={{ width: `${(neutral / total) * 100}%` }} />
      <div className="bg-red-400" style={{ width: `${(negative / total) * 100}%` }} />
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; replies: number; escalations: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.replies + d.escalations));
  return (
    <div className="flex items-end gap-1 h-[100px]">
      {data.slice(-30).map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 min-w-[2px]">
          <div className="w-full flex flex-col justify-end gap-px" style={{ height: '80px' }}>
            <div
              className="w-full rounded-t-sm bg-emerald-400/60"
              style={{ height: `${(d.replies / max) * 80}px` }}
              title={`${d.date}: ${d.replies} replies`}
            />
            {d.escalations > 0 && (
              <div
                className="w-full rounded-t-sm bg-red-400/60"
                style={{ height: `${Math.max(1, (d.escalations / max) * 80)}px` }}
                title={`${d.date}: ${d.escalations} escalations`}
              />
            )}
          </div>
          {data.length <= 7 && (
            <span className="text-[8px] text-fg-faint mt-1 rotate-45 origin-left whitespace-nowrap">{d.date.slice(5)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AgentAnalytics() {
  const { activeSpace } = useSpace();
  const [days, setDays] = useState(30);

  // Get all agents for per-agent tabs
  const { data: agentsData } = useQuery<{ agents: { id: string; name: string }[] }>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents', { credentials: 'include' });
      if (!res.ok) return { agents: [] };
      return res.json();
    },
  });

  const { data: teamsData } = useQuery<{ teams: { id: string; name: string }[] }>({
    queryKey: ['/api/agent-teams'],
    queryFn: async () => {
      const res = await fetch('/api/agent-teams', { credentials: 'include' });
      if (!res.ok) return { teams: [] };
      return res.json();
    },
  });

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?days=${days}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: true,
  });

  const langNames: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese',
    zh: 'Chinese', pt: 'Portuguese', it: 'Italian', ru: 'Russian', ar: 'Arabic',
    ko: 'Korean', nl: 'Dutch', sv: 'Swedish', no: 'Norwegian', da: 'Danish',
    fi: 'Finnish', pl: 'Polish', tr: 'Turkish', hi: 'Hindi', vi: 'Vietnamese',
  };

  return (
      <AppPage>
        <PageHeader
          title="Agent Analytics"
          icon={BarChart3}
          iconColor="#8b5cf6"
        />
        <AppBodyPadded>
          {isLoading ? (
            <ListSkeleton rows={8} />
          ) : !analytics || analytics.totalReplies === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No analytics data yet"
              description="Analytics will appear once your agents start replying to emails. Activate an agent and wait for incoming mail."
            />
          ) : (
            <div className="space-y-6">
              {/* Time range selector */}
              <div className="flex items-center gap-2">
                {[7, 14, 30, 60, 90].map(d => (
                  <Button
                    key={d}
                    onClick={() => setDays(d)}
                    design="ghost"
                    size="xs"
                    className={`rounded-full ${
                      days === d
                        ? '!bg-brand/10 !border-brand/30 !text-brand'
                        : '!border-border !text-fg-muted'
                    }`}
                  >
                    {d}d
                  </Button>
                ))}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Replies"
                  value={String(analytics.totalReplies)}
                  icon={MessageSquare}
                  color="#8b5cf6"
                  subtitle={`Last ${days} days`}
                />
                <StatCard
                  label="Avg Response Time"
                  value={formatMs(analytics.avgResponseTimeMs)}
                  icon={Clock}
                  color="#3b82f6"
                />
                <StatCard
                  label="Resolution Rate"
                  value={`${analytics.resolutionRate}%`}
                  icon={CheckCircle2}
                  color="#22c55e"
                  subtitle={`${analytics.escalations} escalated`}
                />
                <StatCard
                  label="Escalations"
                  value={String(analytics.escalations)}
                  icon={AlertTriangle}
                  color="#ef4444"
                  subtitle="Handed off to human"
                />
              </div>

              {/* Daily activity chart */}
              <div className="border border-border/60 rounded-xl p-5">
                <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-fg-muted" />
                  Daily Activity
                </h3>
                {analytics.dailyActivity.length > 0 ? (
                  <DailyChart data={analytics.dailyActivity} />
                ) : (
                  <p className="text-[12px] text-fg-faint">No daily data available</p>
                )}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/60" />
                    <span className="text-[11px] text-fg-muted">Replies</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-red-400/60" />
                    <span className="text-[11px] text-fg-muted">Escalations</span>
                  </div>
                </div>
              </div>

              {/* Sentiment + Languages */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border/60 rounded-xl p-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-fg-muted" />
                    Customer Sentiment
                  </h3>
                  <SentimentBar positive={analytics.sentiments.positive} neutral={analytics.sentiments.neutral} negative={analytics.sentiments.negative} />
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className="text-[11px] text-fg-muted">Positive ({analytics.sentiments.positive})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber" />
                      <span className="text-[11px] text-fg-muted">Neutral ({analytics.sentiments.neutral})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                      <span className="text-[11px] text-fg-muted">Negative ({analytics.sentiments.negative})</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border/60 rounded-xl p-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Globe size={14} className="text-fg-muted" />
                    Languages Detected
                  </h3>
                  {analytics.languages.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.languages.slice(0, 5).map(l => (
                        <div key={l.lang} className="flex items-center gap-2">
                          <span className="text-[12px] text-fg-muted w-20 truncate">{langNames[l.lang] ?? l.lang}</span>
                          <span className="text-[12px] font-mono text-fg-muted w-8 text-right">{l.count}</span>
                          <MiniBar value={l.count} max={analytics.languages[0].count} color="#8b5cf6" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-fg-faint">No language data</p>
                  )}
                </div>
              </div>

              {/* Top topics */}
              {analytics.topTopics.length > 0 && (
                <div className="border border-border/60 rounded-xl p-5">
                  <h3 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare size={14} className="text-fg-muted" />
                    Top Topics
                  </h3>
                  <div className="space-y-2">
                    {analytics.topTopics.slice(0, 10).map(t => (
                      <div key={t.topic} className="flex items-center gap-2">
                        <span className="text-[12px] text-foreground flex-1 truncate">{t.topic}</span>
                        <span className="text-[12px] font-mono text-fg-muted w-8 text-right">{t.count}</span>
                        <MiniBar value={t.count} max={analytics.topTopics[0].count} color="#E78A13" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AppBodyPadded>
      </AppPage>
  );
}
