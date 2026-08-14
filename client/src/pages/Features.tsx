import { Layout } from "@/components/Layout";
import {
  Inbox,
  MessageSquare,
  Bot,
  Zap,
  Users,
  Shield,
  TrendingUp,
  Clock,
  Star,
  Globe,
  Ticket,
  Settings2,
} from "lucide-react";
import { MarketingFeatureSection, LandingHero } from "@/components/marketing";
import { PrimaryRail } from "@/components/sidebar/PrimaryRail";
import { SecondaryPanel } from "@/components/sidebar/SecondaryPanel";

const coreFeatures = [
  {
    icon: Inbox,
    title: "Unified inbox",
    description:
      "Email, live chat, and social — all in one place. Every conversation lands in a single shared queue your team can action together.",
    variant: "brand" as const,
  },
  {
    icon: Bot,
    title: "AI-powered replies",
    description:
      "Pastel suggests responses, auto-tags tickets, and surfaces knowledge base articles before your agent even starts typing.",
    variant: "purple" as const,
  },
  {
    icon: Zap,
    title: "Automation rules",
    description:
      "Route tickets by keyword, priority, or team. Auto-close resolved conversations and send follow-ups — no code needed.",
    variant: "amber" as const,
  },
  {
    icon: TrendingUp,
    title: "Performance reporting",
    description:
      "Track first-response time, resolution rate, and CSAT across every agent and channel. Know what's working and what isn't.",
    variant: "green" as const,
  },
  {
    icon: MessageSquare,
    title: "Live chat widget",
    description:
      "Add a clean chat widget to your product or website in minutes. Handle conversations in real time, or let AI take the first pass.",
    variant: "red" as const,
  },
  {
    icon: Users,
    title: "Contact management",
    description:
      "Build a full history for every customer — past tickets, notes, and attributes — so context never gets lost.",
    variant: "brand" as const,
  },
];

const operationsFeatures = [
  {
    icon: Clock,
    title: "SLA tracking",
    description:
      "Set response and resolution targets per inbox or priority. Get alerted before an SLA is breached.",
    variant: "brand" as const,
  },
  {
    icon: Shield,
    title: "Role-based access",
    description:
      "Agents, supervisors, and admins each see what they need. Restrict sensitive conversations by team.",
    variant: "green" as const,
  },
  {
    icon: Star,
    title: "CSAT surveys",
    description:
      "Automatically send satisfaction surveys after a ticket resolves. Track scores by agent, team, and channel.",
    variant: "amber" as const,
  },
  {
    icon: Globe,
    title: "Multi-language support",
    description:
      "Serve customers in their language. AI-assisted translation keeps conversations clear across any market.",
    variant: "purple" as const,
  },
  {
    icon: Settings2,
    title: "Webhooks & API",
    description:
      "Integrate Pastel with your CRM, billing, or internal tools. Full REST API and real-time webhooks included.",
    variant: "brand" as const,
  },
  {
    icon: Ticket,
    title: "Custom ticket fields",
    description:
      "Capture the data your team needs. Add dropdowns, checkboxes, and free-text fields to any ticket form.",
    variant: "red" as const,
  },
];

export default function Features() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="NEW"
        eyebrow="All the tools. None of the bloat."
        title={
          <>
            Everything your team needs
            <br />
            to ship great support.
          </>
        }
        description="Unified inbox, AI-powered replies, ticket tracking, automation rules, live chat, performance reporting — all in one platform that scales with you. No complexity. No unnecessary features. Just what works."
      />

      {/* ── Mock App Preview ── */}
      <section className="w-full">
        <div className="lds-marketing-section">
          <div className="relative mt-20 md:mt-24 rounded-2xl mockup-glow">
            <div className="relative border-t border-x border-white/10 dark:border-white/10 rounded-2xl bg-background dark:[--background:0_0%_7%] h-[560px] pointer-events-none select-none overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20" />
              <div className="flex h-full">
                <div className="hidden sm:flex h-full">
                  <PrimaryRail activeId="inbox" isAdmin={false} />
                  <div className="flex flex-col h-full bg-background min-w-0" style={{ width: 200 }}>
                    <div className="flex-1 overflow-y-auto scrollbar-none">
                      <SecondaryPanel activeSectionId="inbox" forceActiveId="inbox" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex-1 flex flex-col">
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <MarketingFeatureSection
        label="Core"
        title="The tools that move your team forward."
        subtitle="Built around what support teams actually need: speed, context, and clarity — not bloat."
        items={coreFeatures}
      />

      <MarketingFeatureSection
        label="Operations"
        title="Built for scale from day one."
        subtitle="SLAs, permissions, integrations, and reporting — everything to run support professionally."
        items={operationsFeatures}
      />
    </Layout>
  );
}