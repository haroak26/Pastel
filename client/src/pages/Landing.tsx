import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Coffee,
  Dumbbell,
  Ellipsis,
  Grid3X3,
  Heart,
  HeartPulse,
  Home,
  Layers,
  PenTool,
  Plus,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Type,
  User,
  Wallet,
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

const variantText: Record<FeatureVariant, string> = {
  brand: "text-sky-500",
  amber: "text-amber-500",
  red: "text-rose-500",
  green: "text-[#FF7A6E]",
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

/* ─── App mockups — portrait cards, no chrome, bottoms aligned, middle taller ─── */

function AppCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-[20px] bg-white shadow-[0_0_16px_hsl(var(--brand)/0.06),0_0_40px_hsl(var(--brand)/0.08)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_0_20px_hsl(var(--brand)/0.1),0_0_56px_hsl(var(--brand)/0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Sunday Roast — coffee shop app ── */

function CoffeeScreen() {
  const roasts = [
    ["#C4562F", "Huila", "$18", "★ 4.7"],
    ["#4A2C1A", "Yirgacheffe", "$18", "★ 4.9"],
  ] as const;
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: "#4A2C1A" }} />
          <span className="text-[13px] font-semibold text-foreground">Sunday Roast</span>
        </div>
        <div className="flex items-center gap-3">
          <Search size={14} className="text-fg-muted" />
          <span className="relative">
            <ShoppingCart size={15} className="text-foreground" />
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white">2</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-3">
        <div className="flex flex-1 flex-col justify-between rounded-[18px] p-4" style={{ backgroundColor: "#3E2417" }}>
          <div>
            <span className="inline-flex rounded-full px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: "#FFD66E", color: "#4A2C1A" }}>
              Ethiopia · Single origin
            </span>
            <p className="mt-2.5 text-[18px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
              Yirgacheffe, washed
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/60">
              <span className="text-[#FFD66E]">★★★★★</span> 4.9 · 312 reviews
            </p>
            <p className="mt-1.5 text-[10px] leading-[1.55] text-white/60">
              Roasted every Sunday, shipped while it's still singing.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-medium text-white/50">From</p>
              <p className="text-[16px] font-semibold text-white">
                $18 <span className="text-[10px] font-medium text-white/50">/ 250g</span>
              </p>
            </div>
            <span className="rounded-full px-4 py-2 text-[11px] font-semibold" style={{ backgroundColor: "#FFD66E", color: "#4A2C1A" }}>
              Add to bag
            </span>
          </div>
        </div>

        <div className="pb-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-foreground">Featured roasts</p>
            <p className="text-[10px] font-medium text-fg-muted">See all</p>
          </div>
          <div className="mt-2.5 flex gap-3">
            {roasts.map(([c, n, p, rating]) => (
              <div key={n} className="flex-1 rounded-[14px] border border-border/60 p-2.5">
                <span className="block h-[52px] rounded-[10px]" style={{ backgroundColor: c }} />
                <p className="mt-2 text-[11px] font-semibold text-foreground">{n}</p>
                <p className="mt-0.5 text-[10px] font-medium text-fg-muted">
                  {rating} · {p}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[12px] px-3 py-2.5" style={{ backgroundColor: "#F5EFE6" }}>
            <p className="text-[10px] font-semibold text-foreground">Free shipping over $30</p>
            <p className="text-[9.5px] font-medium text-fg-muted">Code: SUNDAY</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Northwind — finance app (dark, tallest) ── */

function FinanceScreen() {
  const tabs = [Home, Wallet, ArrowUpRight, User];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "#0F1217" }}>
      <div className="flex shrink-0 items-center justify-between px-5 pt-5">
        <div>
          <p className="text-[10px] font-medium text-white/50">Good morning</p>
          <p className="text-[15px] font-semibold text-white">Dana Kim</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]">
              <Bell size={13} className="text-white" />
            </span>
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg,#0B99FF,#3D7BFF)" }}>
            DK
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-3">
        <div className="rounded-[18px] p-4" style={{ background: "linear-gradient(135deg,#0B99FF 0%,#3D7BFF 100%)" }}>
          <div className="flex items-center justify-between">
            <span className="h-5 w-7 rounded-[4px] bg-white/25" />
            <p className="text-[9px] font-medium tracking-[0.08em] text-white/80">•••• 4829</p>
          </div>
          <p className="mt-2 text-[10px] font-medium text-white/70">Total balance</p>
          <p className="mt-0.5 text-[24px] font-semibold tracking-[-0.02em] text-white">$48,260.40</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
            <TrendingUp size={9} /> +2.4% this month
          </span>
        </div>

        <div className="mt-3.5 flex items-center rounded-[10px] bg-white/[0.06] p-1">
          {["Day", "Week", "Month"].map((label, i) => (
            <span
              key={label}
              className={`flex-1 rounded-[8px] py-1.5 text-center text-[9.5px] font-semibold ${i === 2 ? "bg-white/15 text-white" : "text-white/50"}`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-3 flex min-h-[110px] flex-1 flex-col rounded-[16px] bg-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white/90">Spending</p>
            <span className="text-[9.5px] font-medium text-emerald-400">−12% vs last month</span>
          </div>
          <div className="mt-3 flex min-h-[48px] flex-1 items-end gap-1.5">
            {[38, 55, 44, 70, 52, 82, 64, 95].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-[3px]"
                style={{ height: `${h}%`, backgroundColor: i === 7 ? "#0B99FF" : "rgba(255,255,255,0.16)" }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between">
            {days.map((d, i) => (
              <span key={i} className={`flex-1 text-center text-[7.5px] font-medium ${i === 6 ? "text-[#0B99FF]" : "text-white/35"}`}>{d}</span>
            ))}
          </div>
        </div>

        <p className="mt-3.5 text-[11px] font-semibold text-white/90">Recent</p>
        <div className="mt-1.5 space-y-1.5 pb-4">
          {[
            ["SP", "Stripe payout", "+$2,400.00", "#0B99FF", "2h ago"],
            ["AW", "AWS · compute", "−$812.10", "#FF9F43", "Yesterday"],
            ["FG", "Figma · seats", "−$135.00", "#A855F7", "Mon"],
          ].map(([initials, name, value, color, time]) => (
            <div key={name} className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3.5 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: `${color}22`, color }}>
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10.5px] font-medium text-white/85">{name}</p>
                <p className="text-[8.5px] text-white/40">{time}</p>
              </div>
              <span className={`text-[10.5px] font-semibold ${value.startsWith("+") ? "text-emerald-400" : "text-white/90"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-around border-t border-white/10 px-2 py-3">
        {tabs.map((Icon, i) => (
          <span key={i} className={i === 0 ? "text-[#0B99FF]" : "text-white/30"}>
            <Icon size={16} strokeWidth={2} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Pulse — fitness onboarding ── */

function OnboardingScreen() {
  const options = [
    ["Build muscle", "4–5 sessions a week", Dumbbell],
    ["Lose fat", "3–4 sessions a week", HeartPulse],
    ["Stay fit", "2–3 sessions a week", Zap],
  ] as const;
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 rounded-full ${i <= 1 ? "w-6 bg-brand" : "w-3 bg-border"}`} />
          ))}
        </div>
        <p className="text-[10.5px] font-medium text-fg-muted">Skip</p>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-8">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand/10">
            <Dumbbell size={26} className="text-brand" />
          </span>
        </div>
        <p className="mt-5 text-center text-[20px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">What's your goal?</p>        <p className="mt-1.5 text-center text-[10.5px] text-fg-muted">We'll tailor your plan around it.</p>

        <div className="mt-6 space-y-2.5">
          {options.map(([label, sub, Icon], i) => (
            <div key={label} className={`flex items-center justify-between rounded-[14px] border px-4 py-3 ${i === 0 ? "border-brand bg-brand/5" : "border-border"}`}>
              <span className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${i === 0 ? "bg-brand/10 text-brand" : "bg-surface-muted text-fg-muted"}`}>
                  <Icon size={14} />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-foreground">{label}</span>
                  <span className="block text-[9.5px] font-medium text-fg-muted">{sub}</span>
                </span>
              </span>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${i === 0 ? "border-brand" : "border-border"}`}>
                {i === 0 && <span className="h-2 w-2 rounded-full bg-brand" />}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pb-6 pt-6">
          <div className="rounded-full bg-brand py-3 text-center text-[12px] font-semibold text-white">Continue</div>
          <p className="mt-3 text-center text-[10px] font-medium text-fg-muted">No credit card · Change anytime</p>
        </div>
      </div>
    </div>
  );
}

/* ── App strip — three equal-width portrait cards, bottoms aligned, middle taller ── */

function StripCard({ index, children }: { index: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLElement | null>(document.body);
  const { scrollYProgress } = useScroll({
    target: ref,
    container: bodyRef,
    offset: ["start 95%", "start 40%"],
  });
  const start = index * 0.22;
  const opacity = useTransform(scrollYProgress, [start, Math.min(start + 0.55, 1)], [0, 1]);
  const y = useTransform(scrollYProgress, [start, Math.min(start + 0.55, 1)], [64, 0]);

  return (
    <motion.div ref={ref} style={reduce ? undefined : { opacity, y }}>
      {children}
    </motion.div>
  );
}

function PhoneStrip() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-row items-end justify-center gap-2 lg:gap-5">
      <StripCard index={0}>
        <div className="h-[160px] w-[96px] lg:h-auto lg:w-auto">
          <div className="origin-top-left scale-[0.32] lg:origin-center lg:scale-100">
            <AppCard className="h-[500px] w-[300px] xl:w-[320px]">
              <CoffeeScreen />
            </AppCard>
          </div>
        </div>
      </StripCard>
      <StripCard index={1}>
        <div className="h-[186px] w-[96px] lg:h-auto lg:w-auto">
          <div className="origin-top-left scale-[0.32] lg:origin-center lg:scale-100">
            <AppCard className="h-[580px] w-[300px] shadow-[0_0_20px_hsl(var(--brand)/0.08),0_0_56px_hsl(var(--brand)/0.1)] hover:shadow-[0_0_28px_hsl(var(--brand)/0.12),0_0_80px_hsl(var(--brand)/0.14)] xl:w-[320px]">
              <FinanceScreen />
            </AppCard>
          </div>
        </div>
      </StripCard>
      <StripCard index={2}>
        <div className="h-[160px] w-[96px] lg:h-auto lg:w-auto">
          <div className="origin-top-left scale-[0.32] lg:origin-center lg:scale-100">
            <AppCard className="h-[500px] w-[300px] xl:w-[320px]">
              <OnboardingScreen />
            </AppCard>
          </div>
        </div>
      </StripCard>
    </div>
  );
}
/* ─── Specimen chips — small design-tool details flanking the headline ─── */

function SpecimenChips() {
  return (
    <>
      <div className="hidden xl:flex absolute -left-[176px] top-[96px] items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-floating">
        <span className="flex -space-x-1">
          {["#0B99FF", "#1E1E1E", "#FFD66E", "#FF7A6E"].map((c) => (
            <span key={c} className="w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
          ))}
        </span>
        <span className="text-[11px] font-medium text-fg-muted">Palette</span>
      </div>
      <div className="hidden xl:flex absolute -right-[172px] top-[150px] items-baseline gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-floating">
        <span className="text-[19px] font-medium leading-none tracking-[-0.03em] text-foreground">Aa</span>
        <span className="text-[11px] font-medium text-fg-muted">Inter · 64</span>
      </div>
      <div className="hidden xl:flex absolute -left-[148px] top-[320px] items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-floating">
        <Layers size={14} className="text-brand" />
        <span className="text-[11px] font-medium text-fg-muted">12 layers</span>
      </div>
    </>
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
      <section className="relative w-full pt-16 md:pt-28 pb-16 md:pb-24">
        <div className="relative px-6 md:px-8">
          <div className="relative mx-auto max-w-3xl text-center">
            <SpecimenChips />
            <Reveal>
              <div className="mb-7 flex justify-center">
                <Eyebrow label="NEW">Export design code for free</Eyebrow>
              </div>

              <h1 className="text-[36px] sm:text-[44px] md:text-[50px] lg:text-[56px] text-foreground font-medium leading-[1.04] tracking-[-0.04em] mb-6 text-pretty">
                Describe your idea.
                <br />
                Design your product.
              </h1>

              <p className="mx-auto mb-9 max-w-[520px] text-[14.5px] md:text-[15.5px] text-fg-secondary font-normal leading-[1.7] text-pretty">
                One sentence is all it takes to get real, editable screens. Then refine
                every pixel on a real canvas, with components, vectors, and your whole team.
              </p>

              <div className="flex items-center justify-center gap-5">
                <Link href="/auth/signup">
                  <Button design="pill" size="md" className="h-[40px] px-5 text-[14px]">
                    Start designing free
                  </Button>
                </Link>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="group flex items-center gap-1.5 text-[14px] font-medium text-fg-muted hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                >
                  See how it works
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 md:mt-20">
            <PhoneStrip />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative w-full py-16 md:py-24 border-t border-border">
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
                  <p className="text-[12px] font-semibold text-[#FF7A6E] tracking-[0.06em]">{step.num}</p>
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
