import { Layout } from "@/components/Layout";
import { Eyebrow } from "@/components/ds";
import { Button } from "@/components/button";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function CustomPersonality() {
  return (
    <Layout panel>
      <section className="pt-20 pb-6 hero-grain overflow-hidden">
        <div className="lds-marketing-section">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="Agent">
                Custom Personality
              </Eyebrow>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              Set your agent's tone,
              <br />
              style, and voice.
            </h1>
            <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
              From formal support to casual chat — every reply sounds like it's from your brand. Configure the personality that fits your team and your customers.
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
                How custom personality works.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                Your agent speaks the way your team speaks.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <MessageSquare className="h-[18px] w-[18px] text-amber" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Tone and style</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Configure whether your agent replies with formal language, a casual tone, or something in between. Set greeting styles, sign-off preferences, and response length.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <MessageSquare className="h-[18px] w-[18px] text-amber" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Brand consistency</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Every reply sounds like it's from your brand. The agent follows your writing guidelines, uses your terminology, and maintains a consistent voice across every channel.
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
