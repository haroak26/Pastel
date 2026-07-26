import { useState } from 'react';
import { AppPage, PageHeader, ContentPanel, EmptyState, OptionsSelector } from '@/components/ds';
import { GitCommit, Sparkles, Wrench, Bug, Dot } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix';
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "v2.5.0",
    date: "May 15, 2026",
    title: "Smart Categories",
    description: "AI-powered ticket categorization that automatically tags and routes incoming tickets based on content, sentiment, and customer history.",
    type: "feature",
  },
  {
    version: "v2.4.0",
    date: "April 28, 2026",
    title: "Team Inbox",
    description: "Shared team inbox with collision detection, assignment workflows, and real-time presence indicators so your team never drops a ball.",
    type: "feature",
  },
  {
    version: "v2.3.1",
    date: "April 10, 2026",
    title: "Reply performance improvements",
    description: "Reduced reply composer load time by 60%. Macros and saved replies now render instantly, even with large knowledge bases attached.",
    type: "improvement",
  },
  {
    version: "v2.3.0",
    date: "March 25, 2026",
    title: "Automation Triggers",
    description: "Visual workflow builder for triggers, conditions, and actions. Automate assignment, tagging, escalation, and follow-up reminders.",
    type: "feature",
  },
  {
    version: "v2.2.0",
    date: "March 5, 2026",
    title: "Custom Fields",
    description: "Add custom fields to tickets and customer profiles. Use them in automations, reports, and portal forms.",
    type: "feature",
  },
  {
    version: "v2.1.1",
    date: "February 18, 2026",
    title: "Email threading fix",
    description: "Fixed an issue where replies from the same customer thread were sometimes split into separate tickets.",
    type: "fix",
  },
  {
    version: "v2.1.0",
    date: "February 1, 2026",
    title: "Knowledge Base",
    description: "Built-in knowledge base with rich text editor, version history, and public/private articles. Integrated directly into the reply composer.",
    type: "feature",
  },
  {
    version: "v2.0.0",
    date: "January 15, 2026",
    title: "Complete Redesign",
    description: "New interface with improved navigation, dark mode, and customizable layouts. Faster load times and a more modern feel across the board.",
    type: "feature",
  },
];

const TYPE_CONFIG = {
  feature: { label: "Feature", color: "#10b981", icon: Sparkles },
  improvement: { label: "Improvement", color: "#4682B4", icon: Wrench },
  fix: { label: "Fix", color: "#f59e0b", icon: Bug },
} as const;

export default function Changelog() {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? ENTRIES : ENTRIES.filter(e => e.type === filter);

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title="Changelog"
            icon={GitCommit}
            iconColor="#4682B4"
            actions={
              <OptionsSelector
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'feature', label: 'Features' },
                  { value: 'improvement', label: 'Improvements' },
                  { value: 'fix', label: 'Fixes' },
                ]}
              />
            }
          />
        }
        maxWidth="narrow"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={GitCommit}
            title="No entries found"
            description="No changelog entries match the selected filter."
          />
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-[14px] bottom-[14px] w-px bg-border" />
            <div>
              {filtered.map((entry) => {
                const type = TYPE_CONFIG[entry.type];
                const TypeIcon = type.icon;
                return (
                  <div
                    key={entry.version}
                    className="relative flex gap-4 pb-10 last:pb-0"
                  >
                    <div className="relative z-10 flex w-[30px] shrink-0 justify-center">
                      <div className="mt-[5px] h-3 w-3 rounded-full border-2 border-border bg-background" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                          style={{ background: `${type.color}15`, color: type.color }}
                        >
                          <TypeIcon size={10} strokeWidth={2.5} />
                          {type.label}
                        </span>
                        <span className="text-[11.5px] font-medium text-foreground">{entry.version}</span>
                        <Dot size={12} className="text-fg-faint" />
                        <span className="text-[11.5px] text-fg-muted">{entry.date}</span>
                      </div>
                      <h3 className="mb-1 text-[15px] font-semibold tracking-tight text-foreground">{entry.title}</h3>
                      <p className="text-[13px] leading-relaxed text-fg-muted">{entry.description}</p>
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
