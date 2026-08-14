import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { Link } from "wouter";
import { ArrowRight, Inbox } from "lucide-react";
import { LandingHero } from "@/components/marketing";

export default function UnifiedInbox() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="Feature"
        eyebrow="Unified Inbox"
        title={
          <>
            All your conversations
            <br />
            in one place.
          </>
        }
        description="Email, live chat, and social — all in a single shared queue. Your team sees every conversation, responds from one place, and never loses context."
        actions={
          <>
            <Link href="/auth/signup">
              <Button design="pill" size="md" className="h-[44px] px-6 text-[15px]">
                Get Started
              </Button>
            </Link>
            <Link href="/features" className="group flex items-center gap-1.5 text-[15px] font-medium text-fg-muted hover:text-foreground transition-colors">
              All Features
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
                What is the unified inbox?
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                One queue. One response. Zero switching.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Inbox className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Multi-channel inbox</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Connect email, live chat, and social channels into one shared inbox. Every conversation lands in the same queue, automatically tagged by channel so your team knows where it came from.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Inbox className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Shared team queue</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Every agent sees the same queue. Assign conversations, add internal notes, and avoid stepping on each other's replies with collision detection built in.
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
