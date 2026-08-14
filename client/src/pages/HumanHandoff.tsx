import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { Link } from "wouter";
import { ArrowRight, Users } from "lucide-react";
import { LandingHero } from "@/components/marketing";

export default function HumanHandoff() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="Agent"
        eyebrow="Human Handoff"
        title={
          <>
            Escalate to your team
            <br />
            with full context.
          </>
        }
        description="When the agent can't resolve a ticket, it escalates to your team with the full conversation history, suggested articles, and why it couldn't answer."
        actions={
          <>
            <Link href="/auth/signup">
              <Button design="pill" size="md" className="h-[44px] px-6 text-[15px]">
                Get Started
              </Button>
            </Link>
            <Link href="/features/agent" className="group flex items-center gap-1.5 text-[15px] font-medium text-fg-muted hover:text-foreground transition-colors">
              Agent Overview
              <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </>
        }
      />

      <section className="w-full py-14 md:py-20">
        <div className="lds-marketing-section">
          <div className="space-y-14">
            <div className="space-y-2">
              <h2 className="text-[#1e1e1e] text-[24px] font-medium leading-[1.2] tracking-[-0.03em]">
                How human handoff works.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                Your team steps in exactly when needed — with everything they need to pick up where the agent left off.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Users className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Context-rich escalation</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Every escalation includes the full conversation, relevant knowledge base articles, and the reason the agent couldn't resolve it. Your team picks up with zero context-switching.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Users className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Collision detection</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    See when another agent is viewing or replying to a ticket. No more accidentally responding to the same customer with duplicate answers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
