import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PricingSection } from "@/components/PricingSection";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/button";
import { Eyebrow } from "@/components/ds";

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade whenever you need to from your billing page. Changes take effect immediately and your payment is adjusted prorata.",
  },
  {
    q: "What is a workspace?",
    a: "A workspace represents a domain you own (e.g. yourcompany.com). Each workspace has its own inboxes, agents, tickets, and analytics — keeping data completely separate across your different brands or products.",
  },
  {
    q: "Is there a free trial on paid plans?",
    a: "A payment card is required at signup and you can cancel anytime.",
  },
  {
    q: "Is Pastel GDPR compliant?",
    a: "Yes. Pastel stores only what's needed to operate the helpdesk. Data is encrypted at rest and in transit. We are fully GDPR and SOC 2 aligned.",
  },
  {
    q: "Can my whole team use Pastel?",
    a: "Yes — every plan includes unlimited agent seats. Invite your entire support team at no extra cost.",
  },
  {
    q: "What inbox types are available?",
    a: "Support inboxes create tickets from incoming email and work with auto-reply agents. Regular inboxes are for general communication without ticketing. No-reply inboxes are send-only for transactional messages.",
  },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <Layout panel>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="pt-20 pb-10 md:pb-12 hero-grain overflow-hidden">
        <div className="lds-marketing-section">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="NEW">
                Unlimited agents, no per-seat fees
              </Eyebrow>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              Simple pricing.
              <br />
              No games.
            </h1>
            
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────────── */}
      <div className="lds-marketing-section">
        <PricingSection />
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="w-full py-14 md:py-20">
        <div className="lds-marketing-section">
          <div className="space-y-14">
            <div className="space-y-2">
              <h2
                className="text-[#1e1e1e]"
                style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.03em" }}
              >
                Frequently asked questions.
              </h2>
              <p className="text-[13px] text-muted-foreground font-medium">Everything you need to know about Pastel plans and billing.</p>
            </div>

            <div>
              {faqs.map(({ q, a }, i) => (
                <div key={q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full py-5 text-left bg-none border-none cursor-pointer group"
                  >
                    <span className="text-[15px] font-semibold text-[#1e1e1e] tracking-[-0.01em]">{q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-[13px] text-[#86868b] leading-[1.7] font-medium">{a}</p>
                    </div>
                  </div>
                  {i < faqs.length - 1 && <div className="border-b border-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}
