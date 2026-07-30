import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { PricingSection } from "@/components/PricingSection";
import { useUser } from "@/hooks/use-user";
import { Eyebrow } from "@/components/ds";
import {
  SectionHeader,
  FeatureIcon,
  FeatureVariant,
} from "@/components/marketing";
import {
  Palette,
  PenTool,
  Layers,
  Share2,
  MousePointer2,
  Frame,
  Grid3X3,
  Type,
  Image,
  Circle,
  ChevronDown,
} from "lucide-react";

const featureHighlights: { icon: typeof Palette; title: string; description: string; variant: FeatureVariant }[] = [
  {
    icon: PenTool,
    title: "Intuitive editor",
    description: "A powerful yet simple canvas for crafting pixel-perfect interfaces. Vector tools, boolean ops, and smart guides.",
    variant: "brand",
  },
  {
    icon: Layers,
    title: "Component system",
    description: "Build reusable components and maintain consistency across your entire design system with auto-sync.",
    variant: "purple",
  },
  {
    icon: Share2,
    title: "Real-time collaboration",
    description: "Design together with your team. See cursors, comments, and changes as they happen — no more version chaos.",
    variant: "amber",
  },
];

const designFeatures: { icon: typeof Palette; title: string; description: string; variant: FeatureVariant }[] = [
  {
    icon: Frame,
    title: "Multi-frame canvas",
    description: "Design multiple screens and variations on an infinite canvas. Organize with frames, sections, and pages.",
    variant: "brand",
  },
  {
    icon: MousePointer2,
    title: "Smart selection",
    description: "Click, hover, and auto-select. Smart snapping, distance guides, and instant layout suggestions.",
    variant: "purple",
  },
  {
    icon: Type,
    title: "Typography system",
    description: "Pair fonts, set type scales, and apply consistent text styles across your entire project with one click.",
    variant: "amber",
  },
  {
    icon: Grid3X3,
    title: "Auto layout",
    description: "Build responsive designs that adapt. Stack, wrap, and space elements automatically — no manual positioning.",
    variant: "green",
  },
  {
    icon: Image,
    title: "Asset library",
    description: "Upload, organize, and reuse images and icons. Optimized for performance with automatic resizing.",
    variant: "purple",
  },
  {
    icon: Circle,
    title: "Vector networks",
    description: "Draw and edit complex vector shapes with ease. Boolean operations, path editing, and smooth curves.",
    variant: "brand",
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade whenever you need to from your billing page. Changes take effect immediately and your payment is adjusted prorata.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The Free plan is available without a payment card and includes 1 project, 3 design files, 100 MB storage, and 15 AI credits per month. Paid plans start at $19/month.",
  },
  {
    q: "Can my whole team use Pastel?",
    a: "Yes — every plan includes unlimited collaborators. Invite your entire design team at no extra cost.",
  },
  {
    q: "What file formats does Pastel support?",
    a: "Pastel supports SVG, PNG, JPG, and PDF imports. You can export designs as SVG, PNG, PDF, or CSS code.",
  },
  {
    q: "Does Pastel work on any platform?",
    a: "Pastel runs entirely in your browser. No downloads needed. It works on Chrome, Firefox, Safari, and Edge.",
  },
  {
    q: "Can I use Pastel for prototyping?",
    a: "Yes — connect frames with interactive flows, add transitions, and share clickable prototypes with stakeholders.",
  },
];

export default function Landing() {
  const { data: user } = useUser();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <Layout panel>
      <div className="landing-grid" />
      {/* ── Hero ── */}
      <section className="w-full pt-24 md:pt-28 pb-14 md:pb-20 hero-grain">
        <div className="px-6 md:px-8 bg-white">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="NEW">
                AI-powered design suggestions
              </Eyebrow>
            </div>

            <h1
              className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7"
            >
              Design beautiful interfaces.
              <br />
              <span className="sm:whitespace-nowrap">Ship faster, together.</span>
            </h1>

            <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
              Pastel is a modern UI design tool for teams who want to create exceptional interfaces. 
              Design, prototype, and collaborate in real-time — all in one place.
            </p>

            <div className="flex items-center gap-3">
              <Link href="/auth/signup">
                <Button size="md">
                  Start Designing
                </Button>
              </Link>
              <Link href="/features">
                <Button design="ghost" size="md">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mt-20 md:mt-24 rounded-2xl mockup-glow">
            <div className="relative border border-border rounded-2xl bg-surface-muted h-[480px] pointer-events-none select-none overflow-hidden flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-fg-muted">
                <Palette className="w-12 h-12 text-brand/40" />
                <p className="text-[15px] font-medium">Canvas preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section className="w-full py-14 md:py-20 border-t border-border">
        <div className="px-6 md:px-8">
          <div className="space-y-14">
            <SectionHeader
              label="Core"
              title="Everything you need to design great products."
              subtitle="A powerful design tool with the simplicity your team will love."
            />
            <div className="grid md:grid-cols-3 gap-x-8 md:gap-x-16 lg:gap-x-24 gap-y-12">
              {featureHighlights.map(({ icon: Icon, title, description, variant }) => (
                <div key={title} className="flex gap-4">
                  <FeatureIcon icon={Icon} variant={variant} />
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">{title}</h3>
                    <p className="text-[13px] text-fg-muted leading-[1.65] font-medium">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Design Features ── */}
      <section className="w-full py-14 md:py-20 border-t border-border">
        <div className="px-6 md:px-8">
          <div className="space-y-14">
            <SectionHeader
              label="Features"
              title="Built for modern design teams."
              subtitle="From vector editing to design systems — Pastel has everything you need."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
              {designFeatures.map(({ icon: Icon, title, description, variant }) => (
                <div key={title} className="flex gap-4">
                  <FeatureIcon icon={Icon} variant={variant} />
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">{title}</h3>
                    <p className="text-[13px] text-fg-muted leading-[1.65] font-medium">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="w-full py-14 md:py-20 border-t border-border">
        <div className="px-6 md:px-8">
          <div className="space-y-14">
            <SectionHeader
              label="Pricing"
              title="Simple, transparent pricing."
              subtitle="Start for free. Upgrade when you grow. No hidden fees."
            />
            <PricingSection />
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="w-full py-14 md:py-20 border-t border-border">
        <div className="px-6 md:px-8">
          <div className="space-y-14">
            <SectionHeader
              label="FAQ"
              title="Frequently asked questions."
              subtitle="Everything you need to know about Pastel plans and features."
            />
            <div>
              {faqs.map(({ q, a }, i) => (
                <div key={q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full py-5 text-left bg-none border-none cursor-pointer group"
                  >
                    <span className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-fg-muted shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-[13px] text-fg-muted leading-[1.7] font-medium">{a}</p>
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
