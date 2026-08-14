import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { Link } from "wouter";
import { ArrowRight, MessageSquare } from "lucide-react";
import { LandingHero } from "@/components/marketing";

export default function CustomPersonality() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="Agent"
        eyebrow="Custom Personality"
        title={
          <>
            Set your agent's tone,
            <br />
            style, and voice.
          </>
        }
        description="From formal support to casual chat — every reply sounds like it's from your brand. Configure the personality that fits your team and your customers."
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
