import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { PricingSection } from "@/components/PricingSection";
import { HeroWave } from "@/components/HeroWave";
import { Eyebrow } from "@/components/ds";
import { SectionHeader, FeatureCard, type FeatureVariant } from "@/components/marketing";
import {
  ArrowRight,
  ChevronDown,
  Code2,
  Download,
  FileCode2,
  Grid3X3,
  Layers,
  MessageSquare,
  MousePointer2,
  PenTool,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";

/* ─── Data ─── */

const steps = [
  {
    num: "01",
    title: "Describe it",
    description: "Type a sentence about your product — the audience, the vibe, the screens you need.",
  },
  {
    num: "02",
    title: "Watch it take shape",
    description: "The agent drafts real, editable screens with considered layout, color, and type.",
  },
  {
    num: "03",
    title: "Make it yours",
    description: "Refine every pixel on the canvas, tune the tokens, and export when it feels right.",
  },
];

const collabPoints = [
  {
    icon: MousePointer2,
    text: "Live cursors so you can see exactly where everyone is working.",
  },
  {
    icon: MessageSquare,
    text: "Comments pinned to any layer, resolved inline as the design evolves.",
  },
  {
    icon: Share2,
    text: "Invite teammates as editors or share a read-only link in one click.",
  },
];

const agentFeatures: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  variant: FeatureVariant;
}[] = [
  {
    icon: Sparkles,
    title: "Prompt to polished screens",
    description: "Type a sentence and get real, editable screens — never a static mockup.",
    variant: "brand",
  },
  {
    icon: Layers,
    title: "Flows, not one-offs",
    description: "Generates whole flows with consistent components and tokens across every screen.",
    variant: "purple",
  },
  {
    icon: PenTool,
    title: "Editable on the canvas",
    description: "Every output lands as layered frames and vectors, ready for your fine-tuning.",
    variant: "amber",
  },
  {
    icon: Grid3X3,
    title: "On-brand from the first draft",
    description: "Screens are sized for your audience and tuned to your brand palette and type.",
    variant: "green",
  },
  {
    icon: Zap,
    title: "First drafts in seconds",
    description: "A full set of screens fast, so you can judge the direction early and iterate in place.",
    variant: "brand",
  },
  {
    icon: FileCode2,
    title: "Export-ready code",
    description: "Clean, semantic CSS and production assets come along with every run.",
    variant: "green",
  },
];

const exportPoints = [
  {
    icon: Code2,
    text: "Clean, semantic CSS and markup you can hand straight to engineers.",
  },
  {
    icon: Download,
    text: "SVG, PNG, PDF, and CSS export — all free, all the time.",
  },
  {
    icon: FileCode2,
    text: "Export one screen or your whole flow in a single pass.",
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade whenever you need to from your billing page. Changes take effect immediately and your payment is adjusted prorata.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The Free plan is available without a payment card and includes 10 projects, 10 design files, 100 MB storage, and 150 AI credits per month. Paid plans start at $15/month.",
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

/* ─── Motion helper ─── */

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page ─── */

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* Support /#features navigation from the header on other pages. */
  useEffect(() => {
    if (window.location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }, []);

  return (
    <Layout fullWidth logo="/PastelLogoNew.svg">
      <div className="landing-grid" />

      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden pt-20 md:pt-32 pb-36 md:pb-64">
        <div className="relative px-6 md:px-10">
          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal>
              <div className="mb-8 flex justify-center">
                <Eyebrow label="NEW">Export design code for free</Eyebrow>
              </div>

              <h1 className="text-[40px] sm:text-[50px] md:text-[58px] lg:text-[66px] text-foreground font-medium leading-[1.04] tracking-[-0.04em] mb-8 text-pretty">
                Describe your idea.
                <br />
                Design your product.
              </h1>

              <p className="mx-auto mb-10 max-w-[560px] text-[15.5px] md:text-[17px] text-fg-secondary font-normal leading-[1.7] text-pretty">
                One sentence is all it takes to get real, editable screens. Then refine
                every pixel on a real canvas, with components, vectors, and your whole team.
              </p>

              <div className="flex items-center justify-center gap-6">
                <Link href="/auth/signup">
                  <Button design="pill" size="md" className="h-[46px] px-6 text-[15px]">
                    Start designing free
                  </Button>
                </Link>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="group flex items-center gap-1.5 text-[15px] font-medium text-fg-muted hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                >
                  See it in action
                  <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </Reveal>
          </div>
        </div>

        <HeroWave variant="hero" className="h-[150px] md:h-[190px]" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative w-full scroll-mt-[64px] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <Reveal>
            <SectionHeader
              label="Features"
              title="From sentence to shipped design."
              subtitle="No blank canvas anxiety. No wrestling with tools before the idea is clear."
            />
          </Reveal>
          <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-x-12 gap-y-10">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div className="border-t border-border pt-6">
                  <p className="text-[13px] font-semibold text-[#FF7A6E] tracking-[0.06em]">{step.num}</p>
                  <h3 className="mt-3 text-[18px] font-semibold text-foreground tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-2 text-[14px] text-fg-muted leading-[1.65] font-medium">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team collaboration ── */}
      <section className="w-full bg-surface-muted py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <Reveal>
              <div className="space-y-9">
                <SectionHeader
                  label="Team collaboration"
                  title="Design in the same room, even when you're apart."
                  subtitle="Cursors, comments, and live edits mean your whole team shapes the design together — no exports back and forth, no version confusion."
                />
                <ul className="space-y-4">
                  {collabPoints.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 text-brand shrink-0 mt-0.5">
                        <Icon size={13} strokeWidth={2} />
                      </span>
                      <span className="text-[14px] text-fg-muted font-medium leading-[1.65]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="relative rounded-2xl border border-border bg-white shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)] overflow-hidden">
                <div className="flex items-center justify-between px-4 h-11 border-b border-border">
                  <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">Marketing site — Home</span>
                  <span className="flex -space-x-1.5">
                    {["bg-sky-400", "bg-fuchsia-400", "bg-amber-400", "bg-emerald-400"].map((c, i) => (
                      <span key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white`} />
                    ))}
                  </span>
                </div>

                <div className="relative p-5 md:p-7 bg-[radial-gradient(80%_70%_at_30%_0%,hsl(var(--brand)/0.07),transparent_70%)]">
                  <div className="mx-auto max-w-[300px] rounded-lg border border-border bg-white p-3 shadow-sm">
                    <div className="h-2 w-3/5 rounded-full bg-[linear-gradient(90deg,#2a77f8,#fa778c)] mb-2" />
                    <div className="h-1.5 w-full rounded-full bg-border/70 mb-1.5" />
                    <div className="h-1.5 w-11/12 rounded-full bg-border/70 mb-1.5" />
                    <div className="h-1.5 w-4/5 rounded-full bg-border/70" />
                    <div className="mt-2.5 h-6 w-20 rounded-md bg-gradient-to-r from-[#2a77f8] to-[#6373e5]" />
                  </div>

                  <div className="absolute left-[18%] top-[22%]">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-border shadow-sm">
                      <MousePointer2 size={12} className="text-fuchsia-500" />
                      <span className="text-[11px] font-semibold text-foreground">Ava</span>
                    </span>
                  </div>
                  <div className="absolute right-[16%] top-[48%]">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-border shadow-sm">
                      <MousePointer2 size={12} className="text-sky-500" />
                      <span className="text-[11px] font-semibold text-foreground">Liam</span>
                    </span>
                  </div>
                  <div className="absolute right-[8%] bottom-[16%] max-w-[190px]">
                    <div className="rounded-xl rounded-br-sm bg-white border border-border shadow-md px-3 py-2">
                      <p className="text-[11.5px] text-foreground font-medium leading-snug">Love this gradient — let's use it on the pricing cards too</p>
                      <p className="mt-1 text-[10.5px] text-fg-muted font-medium">Ava · just now</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 h-11 border-t border-border bg-surface-subtle/50">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-fg-muted font-medium">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    4 collaborators online
                  </span>
                  <span className="text-[11.5px] text-fg-muted font-medium">Changes sync live</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Maxi Agent ── */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <Reveal>
              <div className="space-y-9">
                <SectionHeader
                  label="Maxi Agent"
                  title="One sentence. A full product UI."
                  subtitle="Maxi turns a plain-language brief into a complete set of real, editable screens — sized for your audience, tuned to your brand, ready to refine."
                />
                <div className="space-y-5">
                  {agentFeatures.map(({ icon, title, description, variant }) => (
                    <FeatureCard
                      key={title}
                      icon={icon}
                      title={title}
                      description={description}
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="rounded-2xl bg-white border border-border shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 h-11 border-b border-border">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 text-brand">
                    <Sparkles size={13} strokeWidth={2} />
                  </span>
                  <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">Maxi AI</span>
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="p-4 md:p-5 space-y-4">
                  <div className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand/10 px-4 py-2.5 text-[13px] text-foreground font-medium leading-[1.6]">
                      Design a landing page for a plant-based cafe — warm, minimal, earthy.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        "bg-[#fdf6ee]",
                        "bg-[#eef5ef]",
                        "bg-[#f6f1ff]",
                      ].map((c, i) => (
                        <div key={i} className={`rounded-lg border border-border ${c} p-2.5`}>
                          <div className="h-1.5 w-3/5 rounded-full bg-[#c9b8a0] mb-1.5" />
                          <div className="h-1 w-full rounded-full bg-border/70 mb-1" />
                          <div className="h-1 w-4/5 rounded-full bg-border/70" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-subtle/70">
                      <span className="text-[12px] text-fg-muted font-medium">Home, Menu, About, Contact</span>
                      <span className="text-[11.5px] font-semibold text-emerald-600">4 screens · 6s</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Export code for free ── */}
      <section className="w-full bg-surface-muted py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <Reveal>
              <div className="rounded-2xl bg-[#0d1117] border border-white/10 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.45)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 h-10 border-b border-white/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-auto text-[11px] text-[#8b949e] font-medium">export.css</span>
                </div>
                <div className="p-5 md:p-6 font-mono text-[12.5px] leading-[1.9]">
                  <p><span className="text-[#ff7b72]">.hero</span> <span className="text-[#79c0ff]">{'{'}</span></p>
                  <p className="pl-5"><span className="text-[#79c0ff]">display</span><span className="text-[#8b949e]">:</span> <span className="text-[#a5d6ff]">flex</span><span className="text-[#8b949e]">;</span></p>
                  <p className="pl-5"><span className="text-[#79c0ff]">gap</span><span className="text-[#8b949e]">:</span> <span className="text-[#a5d6ff]">16px</span><span className="text-[#8b949e]">;</span></p>
                  <p className="pl-5"><span className="text-[#79c0ff]">padding</span><span className="text-[#8b949e]">:</span> <span className="text-[#a5d6ff]">24px</span><span className="text-[#8b949e]">;</span></p>
                  <p className="pl-5"><span className="text-[#79c0ff]">border-radius</span><span className="text-[#8b949e]">:</span> <span className="text-[#a5d6ff]">16px</span><span className="text-[#8b949e]">;</span></p>
                  <p className="pl-5"><span className="text-[#79c0ff]">background</span><span className="text-[#8b949e]">:</span> <span className="text-[#a5d6ff]">#ffffff</span><span className="text-[#8b949e]">;</span></p>
                  <p><span className="text-[#ff7b72]">{'}'}</span></p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="space-y-9">
                <SectionHeader
                  label="Export code for free"
                  title="Design to code, without the export paywall."
                  subtitle="Every plan — including Free — can export clean, semantic CSS and production-ready assets. No watermark, no upgrade nag, no cost."
                />
                <ul className="space-y-4">
                  {exportPoints.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                        <Icon size={13} strokeWidth={2} />
                      </span>
                      <span className="text-[14px] text-fg-muted font-medium leading-[1.65]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <Reveal>
            <SectionHeader
              centered
              label="Pricing"
              title="Simple, transparent pricing."
              subtitle="Start for free. Upgrade when you grow. No hidden fees."
            />
          </Reveal>
          <div className="mt-10">
            <PricingSection />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="w-full bg-surface-muted py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <Reveal>
            <SectionHeader
              label="FAQ"
              title="Frequently asked questions."
              subtitle="Everything you need to know about Pastel plans and features."
            />
          </Reveal>
          <div className="mt-12">
            {faqs.map(({ q, a }, i) => (
              <div key={q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full py-6 text-left bg-none border-none cursor-pointer group"
                >
                  <span className="text-[16px] font-semibold text-foreground tracking-[-0.01em] group-hover:text-brand transition-colors">{q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-fg-muted shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 max-w-3xl text-[14px] text-fg-muted leading-[1.7] font-medium">{a}</p>
                  </div>
                </div>
                {i < faqs.length - 1 && <div className="border-b border-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="w-full py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-[34px] sm:text-[44px] md:text-[52px] text-foreground font-medium leading-[1.06] tracking-[-0.04em] text-pretty">
                Your next interface is one sentence away.
              </h2>
              <p className="mx-auto mt-6 max-w-[540px] text-[15.5px] md:text-[17px] text-fg-secondary leading-[1.7] text-pretty">
                Describe your idea and get real, editable screens in seconds. Start free —
                no card, no watermark, no catch.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/auth/signup">
                  <Button design="pill" size="md" className="h-[42px] px-5 text-[14.5px]">
                    Start designing free
                  </Button>
                </Link>
                <Link href="/pricing" className="group flex items-center gap-1.5 text-[14px] font-medium text-fg-muted hover:text-foreground transition-colors">
                  See plans &amp; pricing
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
