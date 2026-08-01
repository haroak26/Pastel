import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { PricingSection } from "@/components/PricingSection";
import { useUser } from "@/hooks/use-user";
import { Eyebrow } from "@/components/ds";
import {
  SectionHeader,
  SoftCard,
  FeatureVariant,
} from "@/components/marketing";
import {
  ChevronDown,
  Coffee,
  Frame,
  Grid3X3,
  Image,
  Layers,
  MousePointer2,
  PenTool,
  Share2,
  Sparkles,
  Square,
  Type,
} from "lucide-react";

/* ─── Data ─── */

const examplePrompts = [
  "A landing page for an indie coffee brand",
  "An analytics dashboard for a finance app",
  "A mobile onboarding flow for a fitness app",
  "A pricing page for a design tool",
];

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

const features: { icon: typeof PenTool; title: string; description: string; variant: FeatureVariant }[] = [
  {
    icon: Sparkles,
    title: "Prompt to polished UI",
    description: "Describe the product you're imagining and get real, editable screens in seconds — not a static mockup.",
    variant: "brand",
  },
  {
    icon: PenTool,
    title: "A real canvas",
    description: "Vector tools, frames, and boolean ops to refine every detail once the first draft lands.",
    variant: "purple",
  },
  {
    icon: Layers,
    title: "Components in sync",
    description: "Build once, reuse everywhere. Edit the source and every instance follows along.",
    variant: "amber",
  },
  {
    icon: Share2,
    title: "Real-time collaboration",
    description: "Cursors, comments, and live edits. Design in the same room, even when you're not sharing one.",
    variant: "green",
  },
  {
    icon: Grid3X3,
    title: "Auto layout",
    description: "Stacks, wraps, and spacing that adapt as content changes — no more nudging by hand.",
    variant: "brand",
  },
  {
    icon: Type,
    title: "Typography system",
    description: "Pair fonts, set scales, and apply consistent text styles across every screen in one click.",
    variant: "purple",
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

/* Pastel accent dots scattered through the hero — a nod to the palette. */
const heroDots = [
  { color: "#FFD66E", size: 12, style: { top: "14%", right: "9%" }, delay: "0s" },
  { color: "#C7B9FF", size: 14, style: { top: "38%", right: "4%" }, delay: "0.8s" },
  { color: "#A8E6CF", size: 10, style: { top: "58%", right: "24%" }, delay: "1.6s" },
  { color: "#FFB3A7", size: 9, style: { top: "8%", right: "38%" }, delay: "2.2s" },
  { color: "#8ED1FF", size: 11, style: { top: "68%", right: "10%" }, delay: "1.2s" },
];

const variantText: Record<FeatureVariant, string> = {
  brand: "text-sky-500",
  amber: "text-amber-500",
  red: "text-rose-500",
  green: "text-emerald-500",
  purple: "text-fuchsia-500",
};

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

/* ─── Hero prompt bar — stores the prompt and carries it into the app ─── */

function HeroPromptBar() {
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const paused = reduceMotion || focused || value.length > 0;
  useEffect(() => {
    if (paused) return;
    let swap: ReturnType<typeof setTimeout>;
    const t = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIdx((i) => (i + 1) % examplePrompts.length);
        setVisible(true);
      }, 220);
    }, 3400);
    return () => {
      clearInterval(t);
      clearTimeout(swap);
    };
  }, [paused]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) sessionStorage.setItem("pastel-landing-prompt", q);
    setLocation(user ? "/home" : "/auth/signup");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[600px]">
      <div className="relative flex items-center h-[54px] md:h-[58px] rounded-full border border-border bg-white pl-5 pr-2 shadow-[0_10px_36px_rgba(0,0,0,0.08)] transition-colors focus-within:border-[hsl(var(--brand)/0.45)]">
        <Sparkles size={17} className="text-brand shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Describe what you want to design"
          className="peer flex-1 min-w-0 bg-transparent outline-none border-none text-[15px] font-medium text-foreground px-3"
        />
        {!value && (
          <span
            aria-hidden
            className={`absolute left-[46px] right-[130px] text-[15px] text-fg-faint pointer-events-none truncate transition-opacity duration-200 ${visible && !focused ? "opacity-100" : "opacity-50"}`}
          >
            {examplePrompts[idx]}
          </span>
        )}
        <button
          type="submit"
          className="shrink-0 h-[42px] px-5 rounded-full bg-brand text-white text-[14px] font-semibold transition-colors hover:bg-[hsl(var(--brand-hover))] active:scale-[0.97]"
        >
          Generate
        </button>
      </div>
      <p className="mt-3 pl-5 text-[12.5px] text-fg-faint font-medium">
        Free plan · 15 AI credits a month · No card required
      </p>
    </form>
  );
}

/* ─── Hand-crafted editor mockup ─── */

function EditorMockup() {
  return (
    <div className="relative">
      {/* Floating palette card */}
      <div
        aria-hidden
        className="hidden lg:block absolute -top-12 right-[6%] z-10 rotate-[4deg] rounded-2xl border border-border bg-white p-3.5 shadow-[0_10px_36px_rgba(0,0,0,0.09)] animate-float-slow"
      >
        <p className="text-[11px] font-semibold text-foreground mb-2">Palette</p>
        <div className="flex items-center gap-1.5">
          {["#4A2C1A", "#FFB3A7", "#FFD66E", "#A8E6CF"].map((c) => (
            <span key={c} className="w-7 h-7 rounded-md border border-black/5" style={{ backgroundColor: c }} />
          ))}
        </div>
        <p className="mt-2 text-[10px] font-medium text-fg-faint">Picked by the agent</p>
      </div>

      {/* Floating agent toast */}
      <div
        aria-hidden
        className="hidden lg:flex absolute bottom-[10%] left-[2%] z-10 -rotate-[3deg] items-center gap-2.5 rounded-full border border-border bg-white pl-2 pr-4 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.09)] animate-float-slow"
        style={{ animationDelay: "1.4s" }}
      >
        <span className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
          <Sparkles size={14} className="text-brand" />
        </span>
        <span>
          <span className="block text-[12px] font-semibold text-foreground leading-tight">Generated 3 screens</span>
          <span className="block text-[10.5px] text-fg-muted font-medium leading-tight mt-0.5">Landing · Pricing · Onboarding</span>
        </span>
      </div>

      <div className="relative border border-border rounded-2xl bg-white mockup-glow overflow-hidden select-none">
        {/* Chrome bar */}
        <div className="flex items-center justify-between h-11 px-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <img src="/PastelIcon.svg" alt="" width={16} height={16} />
            <span className="text-[12px] font-medium text-fg-muted">pastel.app/canvas/untitled</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Draft ready
            </span>
          </div>
        </div>

        <div className="flex h-[420px] md:h-[460px]">
          {/* Toolbar rail */}
          <div className="hidden sm:flex flex-col items-center gap-1 w-[52px] py-2.5 border-r border-border/70">
            {[MousePointer2, Frame, Square, Type, Image, Sparkles].map((Icon, i) => (
              <span
                key={i}
                className={`flex items-center justify-center w-8 h-8 rounded-[9px] ${i === 5 ? "text-brand bg-brand/10" : "text-fg-muted"}`}
              >
                <Icon size={15} strokeWidth={1.75} />
              </span>
            ))}
          </div>

          {/* Layers panel */}
          <div className="hidden md:flex flex-col w-[196px] border-r border-border/70 py-3 px-2.5 gap-0.5">
            <p className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-faint">Layers</p>
            {[
              { d: 0, label: "Landing", active: false },
              { d: 1, label: "Nav", active: false },
              { d: 1, label: "Hero", active: true },
              { d: 2, label: "Headline", active: false },
              { d: 2, label: "CTA / Shop beans", active: false },
              { d: 1, label: "Features", active: false },
              { d: 0, label: "Pricing", active: false },
              { d: 0, label: "Onboarding", active: false },
            ].map((row) => (
              <span
                key={row.label}
                style={{ paddingLeft: `${row.d * 14 + 6}px` }}
                className={`flex items-center gap-1.5 py-[5px] pr-1.5 rounded-md text-[11.5px] font-medium ${row.active ? "bg-brand/10 text-brand" : "text-fg-muted"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-[2px] ${row.active ? "bg-brand" : "bg-fg-faint/60"}`} />
                {row.label}
              </span>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative flex-1 bg-surface-muted flex items-center justify-center overflow-hidden">
            {/* Second screen peeking in */}
            <div aria-hidden className="hidden lg:block absolute -right-14 top-16 rotate-[7deg] w-[210px] rounded-[14px] border border-border/60 bg-white p-4 space-y-2 opacity-90">
              <div className="h-2 w-16 rounded bg-black/10" />
              <div className="h-6 w-32 rounded bg-black/[0.14]" />
              <div className="h-2 w-24 rounded bg-black/10" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-14 rounded-full bg-brand/80" />
                <div className="h-5 w-14 rounded-full bg-black/10" />
              </div>
            </div>

            {/* The generated screen — matches example prompt #1 */}
            <div className="relative w-[min(430px,84%)] rounded-[14px] border border-border/70 bg-white px-6 py-5 md:px-8 md:py-6">
              {/* mini nav */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: "#4A2C1A" }} />
                  <span className="text-[12px] font-semibold text-foreground">Sunday Roast</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-medium text-fg-muted">
                  <span>Beans</span>
                  <span>Story</span>
                  <span>Wholesale</span>
                </div>
              </div>
              {/* mini hero */}
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "#C4562F" }}>New roast · Huila, Colombia</p>
              <p className="text-[20px] md:text-[23px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground mb-2">
                Brew better coffee at home.
              </p>
              <p className="text-[10.5px] leading-[1.6] text-fg-muted mb-4 max-w-[260px]">
                Small-batch beans, roasted every Sunday and shipped while they're still singing.
              </p>
              <div className="flex items-center gap-3 mb-5">
                <span className="relative inline-flex">
                  <span className="rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: "#4A2C1A" }}>Shop beans</span>
                  {/* selection outline */}
                  <span className="absolute -inset-[5px] rounded-full border border-brand pointer-events-none">
                    <span className="absolute -top-[3.5px] -left-[3.5px] w-[7px] h-[7px] rounded-[2px] bg-white border border-brand" />
                    <span className="absolute -top-[3.5px] -right-[3.5px] w-[7px] h-[7px] rounded-[2px] bg-white border border-brand" />
                    <span className="absolute -bottom-[3.5px] -left-[3.5px] w-[7px] h-[7px] rounded-[2px] bg-white border border-brand" />
                    <span className="absolute -bottom-[3.5px] -right-[3.5px] w-[7px] h-[7px] rounded-[2px] bg-white border border-brand" />
                  </span>
                </span>
                <span className="rounded-full px-3.5 py-1.5 text-[10px] font-semibold text-foreground border border-border">Our story</span>
              </div>
              <div className="flex items-center gap-3 rounded-[10px] px-4 py-3" style={{ backgroundColor: "#F5EFE6" }}>
                <span className="flex items-center justify-center w-9 h-9 rounded-full" style={{ backgroundColor: "#FFD66E" }}>
                  <Coffee size={16} style={{ color: "#4A2C1A" }} />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold text-foreground leading-tight">Roasted this week</p>
                  <p className="text-[9.5px] text-fg-muted font-medium leading-tight mt-0.5">Order by Friday, sip by Monday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    <Layout panel>
      <div className="landing-grid" />

      {/* ── Hero ── */}
      <section className="relative w-full pt-16 md:pt-24 pb-16 md:pb-24 hero-grain overflow-hidden">
        <div className="px-6 md:px-8">
          <div className="relative">
            {/* Pastel color dots — playful, desktop only */}
            {heroDots.map((dot) => (
              <span
                key={dot.color}
                aria-hidden
                className="hidden lg:block absolute rounded-full animate-float-slow"
                style={{ ...dot.style, width: dot.size, height: dot.size, backgroundColor: dot.color, animationDelay: dot.delay }}
              />
            ))}

            <Reveal className="max-w-3xl">
            <div className="mb-7">
              <Eyebrow label="NEW">Meet the Pastel design agent</Eyebrow>
            </div>

            <h1 className="text-[36px] sm:text-[46px] md:text-[52px] lg:text-[58px] text-foreground font-semibold leading-[1.04] tracking-[-0.03em] mb-6">
              Design beautiful interfaces.
              <br />
              Start with a sentence.
            </h1>

            <p className="mb-8 max-w-[560px] text-[15px] md:text-[16px] text-fg-secondary font-sans font-medium leading-[1.65]">
              Describe your product in plain language and Pastel drafts polished, editable
              UI in seconds. Then refine every pixel on a real canvas — vectors, components,
              and your whole team included.
            </p>

            <div className="flex items-center gap-3 mb-7">
              <Link href="/auth/signup">
                <Button design="pill" size="md" className="h-[44px] px-6 text-[15px]">
                  Start Designing
                </Button>
              </Link>
              <Button
                design="pill-ghost"
                size="md"
                className="h-[44px] px-5 text-[15px]"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Learn more
              </Button>
            </div>

              <HeroPromptBar />
            </Reveal>
          </div>

          <Reveal className="mt-16 md:mt-24 pb-14 lg:pb-20" delay={0.15}>
            <EditorMockup />
          </Reveal>
        </div>

        <div className="hero-glow" />
      </section>

      {/* ── How it works ── */}
      <section className="w-full py-16 md:py-24 border-t border-border">
        <div className="px-6 md:px-8">
          <Reveal>
            <SectionHeader
              label="How it works"
              title="From sentence to shipped design."
              subtitle="No blank canvas anxiety. No wrestling with tools before the idea is clear."
            />
          </Reveal>
          <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-x-12 gap-y-10">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div className="border-t border-border pt-5">
                  <p className="text-[12px] font-semibold text-brand tracking-[0.06em]">{step.num}</p>
                  <h3 className="mt-2.5 text-[16px] font-semibold text-foreground tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] text-fg-muted leading-[1.65] font-medium">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="w-full py-16 md:py-24 border-t border-border scroll-mt-[64px]">
        <div className="px-6 md:px-8">
          <Reveal>
            <SectionHeader
              label="Features"
              title="Everything you need to design great products."
              subtitle="The agent gets you to a strong first draft. The editor makes it precisely yours."
            />
          </Reveal>
          <div className="mt-12 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map(({ icon: Icon, title, description, variant }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.08}>
                <SoftCard className="p-6 h-full flex flex-col gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-white border border-border/70 shrink-0">
                    <Icon size={17} strokeWidth={1.75} className={variantText[variant]} />
                  </span>
                  <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{title}</h3>
                  <p className="text-[13px] text-fg-muted leading-[1.65] font-medium">{description}</p>
                </SoftCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="w-full py-16 md:py-24 border-t border-border">
        <div className="px-6 md:px-8">
          <Reveal>
            <SectionHeader
              label="Pricing"
              title="Simple, transparent pricing."
              subtitle="Start for free. Upgrade when you grow. No hidden fees."
            />
          </Reveal>
          <div className="mt-8">
            <PricingSection />
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="w-full py-16 md:py-24 border-t border-border">
        <div className="px-6 md:px-8">
          <Reveal>
            <SectionHeader
              label="FAQ"
              title="Frequently asked questions."
              subtitle="Everything you need to know about Pastel plans and features."
            />
          </Reveal>
          <div className="mt-10">
            {faqs.map(({ q, a }, i) => (
              <div key={q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full py-5 text-left bg-none border-none cursor-pointer group"
                >
                  <span className="text-[15px] font-semibold text-foreground tracking-[-0.01em] group-hover:text-brand transition-colors">{q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-fg-muted shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 max-w-2xl text-[13px] text-fg-muted leading-[1.7] font-medium">{a}</p>
                  </div>
                </div>
                {i < faqs.length - 1 && <div className="border-b border-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative w-full border-t border-border overflow-hidden">
        <div className="hero-glow" />
        <div className="relative px-6 md:px-8 py-20 md:py-28">
          <Reveal>
            <p className="lds-eyebrow mb-4">Start free</p>
            <h2 className="max-w-2xl text-[30px] sm:text-[38px] md:text-[44px] font-semibold leading-[1.06] tracking-[-0.03em] text-foreground">
              Your next interface is one sentence away.
            </h2>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/auth/signup">
                <Button design="pill" size="md" className="h-[44px] px-6 text-[15px]">
                  Start designing free
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
