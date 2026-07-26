import { Layout } from "@/components/Layout";
import { Eyebrow } from "@/components/ds";
import { Button } from "@/components/button";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function AutoReply() {
  return (
    <Layout panel>
      <section className="pt-20 pb-6 hero-grain overflow-hidden">
        <div className="lds-marketing-section">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="Agent">
                Auto-Reply
              </Eyebrow>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              AI-powered responses for
              <br />
              common questions.
            </h1>
            <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
              The agent automatically replies to common questions using your knowledge base. Only escalates to your team when it can't find an answer.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/auth/signup">
                Get Started
              </Button>
              <Button href="/features/agent" design="ghost" className="group">
                Agent Overview <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>


      <section className="w-full py-14 md:py-20">
        <div className="lds-marketing-section">
          <div className="space-y-14">
            <div className="space-y-2">
              <h2 className="text-[#1e1e1e] text-[24px] font-medium leading-[1.2] tracking-[-0.03em]">
                How auto-reply works.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                Your agent handles the repeat questions so your team doesn't have to.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <MessageSquare className="h-[18px] w-[18px] text-amber" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Instant responses</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    The moment a ticket comes in, your agent scans it against your knowledge base and drafts a reply. Common questions get answered in seconds.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <MessageSquare className="h-[18px] w-[18px] text-amber" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Smart escalation</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    When the agent can't find a confident answer, it escalates the ticket to your team with full context — nothing is lost in translation.
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
