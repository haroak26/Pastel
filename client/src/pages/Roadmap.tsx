import { AppPage, PageHeader, ContentPanel, EmptyState } from '@/components/ds';
import { Route, Sparkles, Globe, Gauge, BarChart3, Smartphone, Puzzle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/button';

interface RoadmapItem {
  title: string;
  description: string;
  status: 'shipping-soon' | 'in-progress' | 'planned';
  timeframe: string;
  icon: typeof Sparkles;
}

const ITEMS: RoadmapItem[] = [
  {
    title: "AI-Powered Response Suggestions",
    description: "Our AI analyzes incoming tickets and suggests contextual responses based on your knowledge base, past resolutions, and customer history — so your team replies faster with consistent quality.",
    status: "shipping-soon",
    timeframe: "June 2026",
    icon: Sparkles,
  },
  {
    title: "Multi-Language Support",
    description: "Full localization for 12 languages across the agent interface, email templates, and customer portal. Automatic language detection routes tickets to the right team.",
    status: "shipping-soon",
    timeframe: "June 2026",
    icon: Globe,
  },
  {
    title: "Advanced SLA Dashboard",
    description: "Real-time SLA tracking with configurable policies, breach alerts, and historical compliance reports. Drill down by team, priority, or customer segment.",
    status: "in-progress",
    timeframe: "July 2026",
    icon: Gauge,
  },
  {
    title: "Custom Report Builder",
    description: "Drag-and-drop report builder with customizable metrics, filters, and visualizations. Save and schedule reports to share with your team automatically.",
    status: "in-progress",
    timeframe: "July 2026",
    icon: BarChart3,
  },
  {
    title: "Mobile App for Agents",
    description: "Native iOS and Android apps for on-the-go ticket management. Push notifications, quick replies, and full inbox access from your phone.",
    status: "planned",
    timeframe: "Q3 2026",
    icon: Smartphone,
  },
  {
    title: "Marketplace & Integrations",
    description: "Extend Pastel with third-party integrations via our open API. Connect Slack, Jira, Salesforce, and more. Community-powered integration marketplace.",
    status: "planned",
    timeframe: "Q4 2026",
    icon: Puzzle,
  },
];

const STATUS_CONFIG = {
  "shipping-soon": { label: "Shipping Soon", color: "#10b981" },
  "in-progress": { label: "In Progress", color: "#4682B4" },
  "planned": { label: "Planned", color: "#f59e0b" },
} as const;

export default function Roadmap() {
  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title="Roadmap"
            icon={Route}
            iconColor="#8b5cf6"
            actions={
              <Button design="primary" size="sm" icon={ArrowRight}>
                Suggest a feature
              </Button>
            }
          />
        }
        maxWidth="narrow"
      >
        {ITEMS.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No roadmap items yet"
            description="See what's coming next and what's in progress."
          />
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-[14px] bottom-[14px] w-px bg-border" />
            <div>
              {ITEMS.map((item) => {
                const status = STATUS_CONFIG[item.status];
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="relative flex gap-4 pb-10 last:pb-0"
                  >
                    <div className="relative z-10 flex w-[30px] shrink-0 justify-center">
                      <div
                        className="mt-[5px] h-3 w-3 rounded-full border-2 bg-background"
                        style={{ borderColor: status.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                          style={{ background: `${status.color}15`, color: status.color }}
                        >
                          <Icon size={10} strokeWidth={2.5} />
                          {status.label}
                        </span>
                        <span className="text-[11.5px] text-fg-muted">{item.timeframe}</span>
                      </div>
                      <h3 className="mb-1 text-[15px] font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="text-[13px] leading-relaxed text-fg-muted">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ContentPanel>
    </AppPage>
  );
}
