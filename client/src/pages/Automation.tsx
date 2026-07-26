import { Layout } from "@/components/Layout";
import { Eyebrow } from "@/components/ds";
import { Button } from "@/components/button";
import { ArrowRight, Zap } from "lucide-react";

export default function Automation() {
  return (
    <Layout panel>
      <section className="pt-20 pb-6 hero-grain overflow-hidden">
        <div className="lds-marketing-section">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="Feature">
                Automation
              </Eyebrow>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              Automate the work your
              <br />
              team shouldn't have to do.
            </h1>
            <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
              Route tickets by keyword, priority, or team. Auto-close resolved conversations and send follow-ups — no code needed.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/auth/signup">
                Get Started
              </Button>
              <Button href="/features" design="ghost" className="group">
                All Features <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
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
                What automation can do for you.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                Set up rules once. Save time every day.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Zap className="h-[18px] w-[18px] text-violet-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Smart routing</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Route tickets by keyword, priority, or team. Ensure the right conversations reach the right agents without manual triage.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Zap className="h-[18px] w-[18px] text-violet-500" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Auto-close & follow-ups</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Automatically close resolved conversations after a set time and send follow-up emails to customers — no manual work needed.
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
