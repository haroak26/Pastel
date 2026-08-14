import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ArrowRight, Mail, MessageSquare, FileText } from "lucide-react";
import { TextInput, Textarea } from "@/components/text-input";
import { Button } from "@/components/button";

const channels = [
  {
    icon: MessageSquare,
    title: "Live chat",
    description: "Talk to the team in real time. Available Monday–Friday, 9am–6pm UTC.",
    cta: "Start a chat",
    href: "#",
    color: "text-brand",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us anything. We respond to every message within one business day.",
    cta: "hello@getlatte.app",
    href: "mailto:hello@getlatte.app",
    color: "text-violet-500",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Step-by-step guides, API references, and integration docs.",
    cta: "Browse the docs",
    href: "/docs",
    color: "text-emerald-500",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Layout panel>
      <section className="pt-20 pb-16">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div className="max-w-2xl">
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 px-1 py-1 pr-4 rounded-full select-none" style={{ background: "#f5f5f7" }}>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-white text-[11px] uppercase tracking-wide" style={{ background: "#4682B4", fontWeight: 700 }}>
                  Contact
                </span>
                <span className="text-[13px]" style={{ color: "#6e6e73", fontWeight: 500 }}>Get in touch</span>
              </div>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              We're here to help.
            </h1>
            <p className="mb-12 max-w-[480px] text-[14px] text-fg-secondary font-medium leading-[1.6]">
              Got a question, a bug, or just want to talk about your support workflow? Reach out — we reply fast.
            </p>
          </div>
        </div>
            </section>

      {/* Channels */}
      <section className="border-t border-border py-16">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {channels.map(({ icon: Icon, title, description, cta, href, color }, i) => (
                <div
                  key={title}
                 
                  className={`py-8 md:py-0 space-y-4 ${i > 0 ? "md:pl-10" : ""} ${i < channels.length - 1 ? "md:pr-10" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div className="space-y-2">
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1e1e1e" }}>{title}</h3>
                    <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.65, fontWeight: 500 }}>{description}</p>
                  </div>
                  <a
                    href={href}
                    className={`inline-flex items-center gap-1.5 text-[13px] font-semibold hover:gap-3 transition-all duration-150 ${color}`}
                  >
                    {cta} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="border-t border-border py-20">
        <div className="w-full max-w-[1060px] mx-auto px-8">
          <div>
            <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-4">
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0b0b8" }}>Send a message</p>
                <h2 className="text-[#1e1e1e]" style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                  Drop us a line.
                </h2>
                <p style={{ fontSize: 13, color: "#86868b", lineHeight: 1.7, fontWeight: 500 }}>
                  Tell us what you're working on or what's not working. A real human reads every message.
                </p>
                <div className="pt-4 space-y-3">
                  {["Sales & pricing", "Bug reports", "Feature requests", "General questions"].map((topic) => (
                    <div key={topic} className="flex items-center gap-2.5">
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4682B4" }} />
                      <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {sent ? (
                  <div className="flex flex-col items-start gap-4 py-8">
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "hsl(145 60% 45% / 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail className="h-5 w-5" style={{ color: "#3baa76" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "#1e1e1e" }}>Message sent</p>
                      <p style={{ fontSize: 13, color: "#86868b", marginTop: 4, fontWeight: 500 }}>
                        We'll get back to you within one business day.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-foreground">Name</label>
                      <TextInput
                        placeholder="Alex Johnson"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-semibold text-foreground">Email</label>
                      <TextInput
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-foreground">Subject</label>
                    <TextInput
                      placeholder="What's this about?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-foreground">Message</label>
                    <Textarea
                      placeholder="Tell us more…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="min-h-[120px]"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send message <ArrowRight size={14} />
                  </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
