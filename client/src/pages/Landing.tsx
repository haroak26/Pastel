import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/button";
import { PricingSection } from "@/components/PricingSection";
import { HeroWave } from "@/components/HeroWave";
import { PromptInput, type PromptInputHandle } from "@/components/PromptInput";
import { Eyebrow } from "@/components/ds";
import { SectionHeader, FeatureCard, type FeatureVariant } from "@/components/marketing";
import {
  Activity,
  ArrowRight,
  Bike,
  BookOpen,
  Calendar,
  ChefHat,
  ChevronDown,
  Clapperboard,
  Code2,
  Download,
  Droplets,
  Dumbbell,
  FileCode2,
  Flower2,
  GraduationCap,
  Grid3X3,
  Heart,
  Image,
  Layers,
  Leaf,
  ListTodo,
  Luggage,
  Map,
  MessageSquare,
  MessageSquareText,
  Moon,
  MousePointer2,
  Music,
  PawPrint,
  PenTool,
  PiggyBank,
  Podcast,
  Repeat,
  Share2,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Sun,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ─── Data ─── */

const steps = [
  {
    num: "01",
    icon: MessageSquareText,
    title: "Describe it",
    description: "Type a sentence about your product — the audience, the vibe, the screens you need.",
    chip: "bg-[#0B99FF]/10 text-[#0B99FF]",
    accent: "text-[#0B99FF]",
  },
  {
    num: "02",
    icon: WandSparkles,
    title: "Watch it take shape",
    description: "The agent drafts real, editable screens with considered layout, color, and type.",
    chip: "bg-[#6373E5]/10 text-[#6373E5]",
    accent: "text-[#6373E5]",
  },
  {
    num: "03",
    icon: PenTool,
    title: "Make it yours",
    description: "Refine every pixel on the canvas, tune the tokens, and export when it feels right.",
    chip: "bg-[#FD7476]/10 text-[#FD7476]",
    accent: "text-[#FD7476]",
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
  const [, setLocation] = useLocation();

  /* A prompt typed in the hero pre-fills the home page prompt box. */
  const handleHeroPrompt = (prompt: string) => {
    sessionStorage.setItem("pastel-landing-prompt", prompt);
    setLocation("/home");
  };

  /* Rotating examples shown in the hero prompt box while it's empty. */
  const heroExamples = [
    "A landing page for a plant-based cafe...",
    "Mobile app for tracking daily habits...",
    "Dashboard for a fitness coach...",
    "SaaS pricing page with three tiers...",
    "Portfolio site for a photographer...",
    "Onboarding flow for a fintech app...",
    "Product page for premium sneakers...",
    "Real estate listings app...",
    "Music player interface...",
    "Travel booking app with map view...",
    "Restaurant menu and ordering screen...",
    "Newsletter signup page...",
    "Weather app with weekly forecast...",
    "Recipe app with step-by-step mode...",
    "Analytics dashboard for marketing teams...",
    "Chat app with voice notes...",
    "Fitness class booking app...",
    "Charity donation landing page...",
    "Job board with filters and search...",
    "Creator profile page...",
    "Learning platform with video lessons...",
    "Food delivery tracking screen...",
    "Banking app with transaction history...",
    "Hotel booking with reviews...",
    "Crypto portfolio tracker...",
    "Event ticketing and check-in flow...",
    "Pet care booking app...",
    "Team wiki for a startup...",
    "Online store checkout flow...",
    "Community forum for gamers...",
  ];

  /* Short "try it" idea chips shown under the hero prompt box. */
  const tryIdeas: { label: string; icon: LucideIcon; prompt: string }[] = [
    { label: "Meal planner", icon: Calendar, prompt: "Design a weekly meal planner app where I can plan breakfast, lunch, and dinner, and it builds a grocery list from my meals for the week." },
    { label: "Habit tracker", icon: Repeat, prompt: "Design a habit tracker app where I can add daily habits, mark them complete, and see my streak and weekly progress." },
    { label: "Workout log", icon: Dumbbell, prompt: "Design a workout log app to track sets, reps, and weights for each exercise and show progress over time." },
    { label: "Recipe app", icon: ChefHat, prompt: "Design a recipe app with a searchable library, step-by-step cooking mode, and ingredient checklists." },
    { label: "Budget tracker", icon: Wallet, prompt: "Design a budget tracker app that categorizes expenses, shows monthly spending, and alerts me when I'm over budget." },
    { label: "Reading list", icon: BookOpen, prompt: "Design a reading list app to save books I want to read, track current progress, and add notes and ratings." },
    { label: "Sleep tracker", icon: Moon, prompt: "Design a sleep tracker app that logs sleep duration and quality and shows trends in a weekly chart." },
    { label: "Water reminder", icon: Droplets, prompt: "Design a water reminder app that tracks daily intake, sends nudges, and shows a hydration goal ring." },
    { label: "Grocery list", icon: ShoppingCart, prompt: "Design a grocery list app with shared lists, item categories, and one-tap add from recipes." },
    { label: "Study planner", icon: GraduationCap, prompt: "Design a study planner app with a semester calendar, assignment deadlines, and daily study sessions." },
    { label: "Task board", icon: ListTodo, prompt: "Design a kanban task board with drag-and-drop columns, labels, and due dates." },
    { label: "Notes app", icon: StickyNote, prompt: "Design a minimal notes app with rich text editing, folders, and a quick search." },
    { label: "Photo gallery", icon: Image, prompt: "Design a photo gallery app with albums, tags, and a full-screen viewer with swipe gestures." },
    { label: "Music playlist", icon: Music, prompt: "Design a music playlist app with a library, queue, and a now-playing screen." },
    { label: "Podcast app", icon: Podcast, prompt: "Design a podcast app with subscribed shows, episode downloads, and a sleep timer." },
    { label: "Fitness classes", icon: Activity, prompt: "Design a fitness class booking app to browse schedules, reserve spots, and see instructor profiles." },
    { label: "Meditation timer", icon: Flower2, prompt: "Design a meditation timer app with session lengths, ambient sounds, and daily streaks." },
    { label: "Plant care tracker", icon: Leaf, prompt: "Design a plant care tracker that reminds me to water and rotate each plant and logs growth." },
    { label: "Pet care app", icon: PawPrint, prompt: "Design a pet care app to track vet visits, feeding schedules, and vaccination records." },
    { label: "Travel itinerary", icon: Map, prompt: "Design a travel itinerary app that organizes flights, stays, and activities day by day." },
    { label: "Packing checklist", icon: Luggage, prompt: "Design a packing checklist app with category-based lists and a one-tap reset for each trip." },
    { label: "Movie watchlist", icon: Clapperboard, prompt: "Design a movie watchlist app to save films to watch, rate what I've seen, and get recommendations." },
    { label: "Event invitations", icon: Ticket, prompt: "Design an event invitations app to create invites, track RSVPs, and send reminders." },
    { label: "Savings goals", icon: PiggyBank, prompt: "Design a savings goals app to set targets, track contributions, and show progress toward each goal." },
    { label: "Outfit planner", icon: Sun, prompt: "Design an outfit planner app where I can put together looks from my wardrobe and plan outfits by week." },
    { label: "Date night ideas", icon: Heart, prompt: "Design a date night ideas app that suggests activities, restaurants, and itineraries for an evening." },
    { label: "Home workouts", icon: Dumbbell, prompt: "Design a home workout app with guided sessions, timers, and a weekly plan with no equipment needed." },
    { label: "Side hustle tracker", icon: TrendingUp, prompt: "Design a side hustle tracker app to log income, expenses, and hours across multiple gigs." },
    { label: "Family calendar", icon: Users, prompt: "Design a family calendar app with shared events, color-coded members, and chore reminders." },
    { label: "Food delivery", icon: Bike, prompt: "Design a food delivery app with a restaurant list, cart, and live order tracking on a map." },
  ];
  const promptRef = useRef<PromptInputHandle>(null);

  /* Show 4 idea chips; periodically swap one for a new random idea. */
  const [shownIdeas, setShownIdeas] = useState<number[]>([]);
  const lastSlotRef = useRef<number | null>(null);

  useEffect(() => {
    const pickInitial = () => {
      const pool = tryIdeas.map((_, i) => i);
      const picks: number[] = [];
      while (picks.length < 4 && pool.length) {
        picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      setShownIdeas(picks);
    };
    pickInitial();
    const t = setInterval(() => {
      setShownIdeas((prev) => {
        if (prev.length < 2) return prev;
        let slot = Math.floor(Math.random() * prev.length);
        if (lastSlotRef.current !== null && prev.length > 1) {
          while (slot === lastSlotRef.current) {
            slot = Math.floor(Math.random() * prev.length);
          }
        }
        lastSlotRef.current = slot;
        const available = tryIdeas.map((_, i) => i).filter((i) => !prev.includes(i));
        const next = available[Math.floor(Math.random() * available.length)];
        if (next === undefined) return prev;
        const copy = [...prev];
        copy[slot] = next;
        return copy;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  /* Support /#features navigation from the header on other pages. */
  useEffect(() => {
    if (window.location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }, []);

  return (
    <Layout fullWidth logo="/UpdatePastelFull.svg?v=5" logoClassName="h-[38px] md:h-[42px]">
      <div className="landing-grid" />

      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden bg-background border-b border-border pt-10 md:pt-16 pb-36 md:pb-48">
        <div className="relative px-6 md:px-10">
          <div className="relative mx-auto max-w-4xl text-center">
            <Reveal>
              <div className="mb-8 flex justify-center">
                <Eyebrow label="NEW">Export design code for free</Eyebrow>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="text-[24px] sm:text-[34px] md:text-[40px] lg:text-[46px] text-foreground font-[550] leading-[1.12] tracking-[-0.02em] text-balance">
                Describe your idea.
                <br />
                <span className="bg-gradient-to-r from-[#0B99FF] via-[#6373E5] to-[#FD7476] bg-clip-text text-transparent">
                  Design your product.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mx-auto mt-8 md:mt-9 max-w-xl">
                <PromptInput ref={promptRef} onSubmit={handleHeroPrompt} compact examples={heroExamples} />
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 max-w-[640px] mx-auto relative">
                <AnimatePresence mode="popLayout">
                  {shownIdeas.map((i) => {
                    const { label, icon: Icon, prompt } = tryIdeas[i];
                    return (
                      <motion.button
                        key={label}
                        layout
                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => promptRef.current?.typePrompt(prompt)}
                        className="group flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-surface-subtle px-3 h-[30px] text-[12.5px] font-medium leading-[1.2] transition-colors cursor-pointer hover:bg-surface-hover"
                      >
                        <Icon size={13} strokeWidth={1.75} className="shrink-0 text-fg-faint group-hover:text-foreground" />
                        <span className="truncate text-fg-muted group-hover:text-foreground">{label}</span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              <p className="mt-5 text-center text-[13px] font-normal text-fg-muted">
                Get Started Free &middot; 50 credits per day
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="features" className="relative w-full scroll-mt-[64px] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <Reveal>
            <SectionHeader
              centered
              label="How it works"
              title="From sentence to shipped design."
              subtitle="No blank canvas anxiety. No wrestling with tools before the idea is clear."
            />
          </Reveal>

          <div className="mt-14 md:mt-20 flex flex-col gap-y-12 md:flex-row md:items-start md:gap-x-10 lg:gap-x-16">
            {steps.map((step, i) => (
              <Fragment key={step.num}>
                {i > 0 && (
                  <div className="flex justify-center md:block md:shrink-0 md:pt-[14px]" aria-hidden>
                    <ArrowRight
                      className={"h-5 w-5 rotate-90 md:rotate-0 " + step.accent}
                      strokeWidth={1.5}
                    />
                  </div>
                )}
                <Reveal delay={i * 0.1} className="flex-1">
                  <div className="flex flex-col items-center text-center">
                    <span
                      className={
                        "relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm ring-1 ring-inset ring-black/[0.05] " +
                        step.chip
                      }
                    >
                      <step.icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                    </span>
                    <p className={"mt-5 text-[11px] font-bold tracking-[0.18em] " + step.accent}>
                      {step.num}
                    </p>
                    <h3 className="mt-2 text-[19px] font-semibold text-foreground tracking-[-0.01em]">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-[300px] text-[14px] text-fg-muted font-medium leading-[1.65]">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              </Fragment>
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
              <div className="relative rounded-2xl border border-border bg-surface shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)] overflow-hidden">
                <div className="flex items-center justify-between px-4 h-11 border-b border-border">
                  <span className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">Marketing site — Home</span>
                  <span className="flex -space-x-1.5">
                    {["bg-sky-400", "bg-fuchsia-400", "bg-amber-400", "bg-emerald-400"].map((c, i) => (
                      <span key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-background`} />
                    ))}
                  </span>
                </div>

                <div className="relative p-5 md:p-7 bg-[radial-gradient(80%_70%_at_30%_0%,hsl(var(--brand)/0.07),transparent_70%)]">
                  <div className="mx-auto max-w-[300px] rounded-lg border border-border bg-surface p-3 shadow-sm">
                    <div className="h-2 w-3/5 rounded-full bg-[linear-gradient(90deg,#2a77f8,#fa778c)] mb-2" />
                    <div className="h-1.5 w-full rounded-full bg-border/70 mb-1.5" />
                    <div className="h-1.5 w-11/12 rounded-full bg-border/70 mb-1.5" />
                    <div className="h-1.5 w-4/5 rounded-full bg-border/70" />
                    <div className="mt-2.5 h-6 w-20 rounded-md bg-gradient-to-r from-[#2a77f8] to-[#6373e5]" />
                  </div>

                  <div className="absolute left-[18%] top-[22%]">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border shadow-sm">
                      <MousePointer2 size={12} className="text-fuchsia-500" />
                      <span className="text-[11px] font-semibold text-foreground">Ava</span>
                    </span>
                  </div>
                  <div className="absolute right-[16%] top-[48%]">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-border shadow-sm">
                      <MousePointer2 size={12} className="text-sky-500" />
                      <span className="text-[11px] font-semibold text-foreground">Liam</span>
                    </span>
                  </div>
                  <div className="absolute right-[8%] bottom-[16%] max-w-[190px]">
                    <div className="rounded-xl rounded-br-sm bg-surface border border-border shadow-md px-3 py-2">
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
              <div className="rounded-2xl bg-surface border border-border shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)] overflow-hidden">
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
      <section className="relative w-full py-20 md:py-28 pb-36 md:pb-48">
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

        <HeroWave variant="cta" className="h-[130px] md:h-[170px]" />
      </section>
    </Layout>
  );
}
