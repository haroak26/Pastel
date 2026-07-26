import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    category: "Support",
    title: "Why your support team is burning out (and how to fix it)",
    date: "Apr 28, 2025",
    read: "5 min read",
    excerpt: "Repetitive tickets, no context, and fragmented tools are silently draining your team. Here's how to stop it.",
  },
  {
    category: "Metrics",
    title: "The real cost of a slow first response",
    date: "Apr 14, 2025",
    read: "4 min read",
    excerpt: "Every hour you delay a first reply costs you more than you think. We ran the numbers.",
  },
  {
    category: "Product",
    title: "How AI suggestions cut our demo team's handle time by 40%",
    date: "Mar 31, 2025",
    read: "6 min read",
    excerpt: "A look at how we tested AI-suggested replies in our own support workflow — and what actually worked.",
  },
  {
    category: "Behind the build",
    title: "Building Pastel: why we started with the inbox",
    date: "Mar 12, 2025",
    read: "8 min read",
    excerpt: "The inbox isn't the most exciting part of a helpdesk. But it's the one thing every support team lives in.",
  },
];

export default function Blog() {
  return (
    <Layout panel>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div className="max-w-2xl">
            <div className="mb-7">
              <div
                className="inline-flex items-center gap-2 px-1 py-1 pr-4 rounded-full select-none"
                style={{ background: "#f5f5f7" }}
              >
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-white text-[11px] uppercase tracking-wide"
                  style={{ background: "#4682B4", fontWeight: 700 }}
                >
                  Blog
                </span>
                <span className="text-[13px]" style={{ color: "#6e6e73", fontWeight: 500 }}>
                  Thoughts on support, AI, and building Pastel
                </span>
              </div>
            </div>

            <h1
             
              className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7"
            >
              From the team.
            </h1>

            <p
             
              className="mb-12 max-w-[480px] text-[14px] text-fg-secondary font-medium leading-[1.6]"
            >
              We write about customer support, the future of AI in helpdesks, and what we're building — and why.
            </p>
          </div>
        </div>
      </section>

      {/* ── POSTS ────────────────────────────────────────────────── */}
      <section className="border-t border-border pb-24">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div>
            {posts.map(({ category, title, date, read, excerpt }, i) => (
              <article
                key={title}
               
                className={`group py-8 ${i < posts.length - 1 ? "border-b border-border" : ""} cursor-pointer`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2 max-w-xl">
                    <p
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: "hsl(204 72% 55%)" }}
                    >
                      {category}
                    </p>
                    <h2
                      className="transition-colors duration-150 group-hover:text-brand"
                      style={{ fontSize: 17, fontWeight: 600, color: "#1e1e1e", lineHeight: 1.35, letterSpacing: "-0.02em" }}
                    >
                      {title}
                    </h2>
                    <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>
                      {excerpt}
                    </p>
                    <p style={{ fontSize: 12, color: "#b0b0b8", fontWeight: 500 }}>
                      {date} · {read}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-start pt-1">
                    <ArrowRight
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150 text-brand"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WRITE FOR US ─────────────────────────────────────────── */}
      <section className="border-t border-border py-20">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div>
            <div className="flex flex-col items-center text-center space-y-5 max-w-md mx-auto">
              <h2
                className="text-[#1e1e1e]"
                style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em" }}
              >
                Want to write for us?
              </h2>
              <p style={{ fontSize: 14, color: "#86868b", lineHeight: 1.7, fontWeight: 500 }}>
                We're always looking for practitioners who want to share how they think about support. Pitch us.
              </p>
              <a
                href="mailto:hello@getlatte.app"
                className="flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:gap-3 transition-all duration-150"
              >
                hello@getlatte.app <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
