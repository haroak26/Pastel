import { Layout } from "@/components/Layout";
import { Book, MessageSquare, Brain, Settings2, Wrench } from "lucide-react";
import { MarketingFeatureSection, LandingHero } from "@/components/marketing";
import { PrimaryRail } from "@/components/sidebar/PrimaryRail";
import { SecondaryPanel } from "@/components/sidebar/SecondaryPanel";

const agentCapabilities = [
  {
    icon: MessageSquare,
    title: "Custom personality & writing style",
    description:
      "Set your agent's tone, voice, and writing style — from formal support to casual chat. Every reply sounds like it's from your brand.",
    variant: "purple" as const,
  },
  {
    icon: Book,
    title: "Knowledge base integration",
    description:
      "Connect your knowledge base and the agent will pull relevant articles to include in replies. No more copy-pasting answers.",
    variant: "amber" as const,
  },
  {
    icon: Brain,
    title: "Smart auto-respond",
    description:
      "The agent automatically replies to common questions using your knowledge base. Only escalates to your team when it can't find an answer.",
    variant: "brand" as const,
  },
  {
    icon: Settings2,
    title: "Model selection",
    description:
      "Choose between Mistral, OpenAI, or other models for your agent. Pick the right balance of speed, cost, and intelligence for your team.",
    variant: "green" as const,
  },
  {
    icon: Wrench,
    title: "Action workflows",
    description:
      "Define multi-step actions the agent takes — from tagging and assigning to sending follow-up emails and updating ticket statuses.",
    variant: "amber" as const,
  },
];

export default function AgentPage() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="NEW"
        eyebrow="AI that sounds like you"
        title={
          <>
            Your support team,
            <br />
            amplified by AI.
          </>
        }
        description="Pastel's AI agent handles routine support automatically — replying to common questions, routing by intent, and escalating only when a human touch is needed. It learns from your knowledge base and adapts to your brand voice. Your team handles what matters; the agent handles the rest."
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
        label="Capabilities"
        title="What your agent can do."
        subtitle="Configure your agent to handle the work your team shouldn't have to."
        items={agentCapabilities}
        columns={3}
      />
    </Layout>
  );
}