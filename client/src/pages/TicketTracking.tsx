import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { Link } from "wouter";
import { ArrowRight, Ticket } from "lucide-react";
import { LandingHero } from "@/components/marketing";

export default function TicketTracking() {
  return (
    <Layout fullWidth>
      <LandingHero
        eyebrowLabel="Feature"
        eyebrow="Ticket Tracking"
        title={
          <>
            Track every ticket from
            <br />
            open to resolved.
          </>
        }
        description="Automatically create tickets from incoming email, track their status through every stage, and never lose sight of a customer request."
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
                How ticket tracking works.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">
                Every customer conversation becomes a trackable ticket.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Ticket className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Automatic ticket creation</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Incoming emails in support inboxes automatically create tickets with a unique ID and full conversation history. No manual entry required.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Ticket className="h-[18px] w-[18px] text-brand" />
                </div>
                <div className="space-y-1.5">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1e1e1e", letterSpacing: "-0.01em" }}>Status tracking</h3>
                  <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                    Track every ticket through open, pending, and resolved stages. Filter by status, inbox, and sender to find exactly what you need.
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
