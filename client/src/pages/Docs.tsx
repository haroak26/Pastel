import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ChevronDown, Link as LinkIcon } from "lucide-react";
import { Eyebrow } from "@/components/ds";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground tracking-tight" id={title.toLowerCase().replace(/\s+/g, "-")}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-5 text-left bg-none border-none cursor-pointer group"
      >
        <span className="text-[15px] font-semibold text-[#1e1e1e] tracking-[-0.01em]">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="pb-5 text-[13px] text-muted-foreground leading-[1.7] space-y-3">{children}</div>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

function Step({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-brand/10 text-brand text-[12px] font-bold">{num}</span>
      <div className="text-[13px] text-muted-foreground leading-[1.7] flex-1 pt-0.5">{children}</div>
    </div>
  );
}

export default function Docs() {
  return (
    <Layout panel>
      <section className="pt-20 pb-6 hero-grain overflow-hidden">
        <div className="lds-marketing-section">
          <div className="max-w-xl">
            <div className="mb-7">
              <Eyebrow label="Docs">
                Documentation
              </Eyebrow>
            </div>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] text-foreground font-medium leading-[1.1] tracking-[-0.03em] mb-7">
              Documentation
            </h1>
            <p className="mb-7 max-w-[540px] text-[15px] text-fg-secondary font-sans font-medium leading-[1.65]">
              Everything you need to know about setting up and using Pastel — from connecting your first domain to configuring AI agents.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-8 py-16 md:py-24 space-y-16">

        {/* ── Getting Started ── */}
        <Section title="Getting started">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Pastel is a customer support platform built for the next generation of startups — combining email inboxes, AI-powered agent replies, ticket management, and ticketing in one place.
            Every feature is organised around <strong className="text-foreground">workspaces</strong> — each workspace represents a domain you own and contains its own inboxes, agents, and tickets.
          </p>
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            After signing up, the first step is to add a domain and create your first inbox. From there you can configure agents, set up ticketing, and invite your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a href="#domains" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:gap-3 transition-all">
              <LinkIcon className="h-3.5 w-3.5" /> Add a domain
            </a>
            <a href="#inboxes" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:gap-3 transition-all">
              <LinkIcon className="h-3.5 w-3.5" /> Create an inbox
            </a>
            <a href="#agents" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:gap-3 transition-all">
              <LinkIcon className="h-3.5 w-3.5" /> Set up an agent
            </a>
          </div>
        </Section>

        {/* ── Domains ── */}
        <Section title="Domains">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Before you can create email inboxes, you need to add and verify a domain. A domain in Pastel represents a DNS zone that enables sending and receiving email through our Mail-in-a-Box server.
          </p>

          <Collapsible title="How to add a domain">
            <Step num="1">Go to <strong className="text-foreground">Account → Domains</strong> and click <strong className="text-foreground">Add Domain</strong>.</Step>
            <Step num="2">Enter your domain name (e.g. <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded text-foreground">yourcompany.com</code>). Pastel will automatically create a DNS zone for it on our mail server.</Step>
            <Step num="3">Pastel will display the DNS records you need to add to your DNS provider: MX, SPF (TXT), DKIM (TXT), and DMARC (TXT) records. Add these at your domain registrar or DNS host.</Step>
            <Step num="4">After adding the records, click <strong className="text-foreground">Verify DNS</strong>. Pastel performs live DNS lookups to confirm each record is correctly configured.</Step>
            <Step num="5">Each record shows a verified or pending status. Once MX, SPF, DKIM, and DMARC are all verified, your domain is ready for inbox creation.</Step>
          </Collapsible>

          <Collapsible title="DNS record types">
            <p><strong className="text-foreground">MX record</strong> — Routes email to our mail server. Priority 10, pointing to <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">box.meetlatte.com</code>.</p>
            <p><strong className="text-foreground">SPF record</strong> — Authorises our mail server to send email on your behalf. A TXT record with <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">v=spf1 a mx include:box.meetlatte.com ~all</code>.</p>
            <p><strong className="text-foreground">DKIM record</strong> — Cryptographically signs outgoing mail. A TXT record at <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">mail._domainkey.yourdomain.com</code>.</p>
            <p><strong className="text-foreground">DMARC record</strong> — Tells receiving servers how to handle unauthenticated mail. A TXT record at <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">_dmarc.yourdomain.com</code>.</p>
          </Collapsible>

          <Collapsible title="BIMI (Brand Indicators for Message Identification)">
            <p>BIMI lets you display your brand logo next to authenticated emails in supporting mail clients. After your domain is verified, you can upload an SVG logo from the domain settings page. The logo must meet the BIMI specification requirements.</p>
          </Collapsible>

          <Collapsible title="Domain limits">
            <p>The number of domains you can add depends on your plan. Free and Starter plans include 1 domain, Pro includes 5, and Max includes unlimited domains.</p>
          </Collapsible>
        </Section>

        {/* ── Inboxes ── */}
        <Section title="Inboxes">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Inboxes are the core of Pastel. Each inbox connects to an email address and has a type that determines its behaviour: <strong className="text-foreground">Support</strong>, <strong className="text-foreground">Regular</strong>, or <strong className="text-foreground">No-reply</strong>.
          </p>

          <Collapsible title="Creating an inbox">
            <Step num="1">Go to <strong className="text-foreground">Account → Inboxes</strong> or <strong className="text-foreground">Configure → Inboxes</strong> and click <strong className="text-foreground">Add Inbox</strong>.</Step>
            <Step num="2">Optionally upload a sender avatar (profile picture shown when your team replies).</Step>
            <Step num="3">Choose a sender name and select the <strong className="text-foreground">inbox type</strong>.</Step>
            <Step num="4">Set the email address by choosing a local part (e.g. <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">support</code>) and a verified domain from your list.</Step>
            <Step num="5">Pastel creates a mailbox on the mail server, stores the IMAP/SMTP credentials, and begins syncing emails immediately.</Step>
          </Collapsible>

          <Collapsible title="Inbox types">
            <p><strong className="text-foreground">Support</strong> — The full support experience. Incoming emails from external addresses automatically create tickets. Supports auto-reply agents, ticketing, and task creation. This is the primary inbox type for customer support.</p>
            <p><strong className="text-foreground">Regular</strong> — A standard email inbox for general communication. Does not create tickets or trigger auto-reply agents. Best for internal or non-support communication.</p>
            <p><strong className="text-foreground">No-reply</strong> — Send-only inbox. Cannot receive or reply to emails. Used for transactional or automated email sending (e.g. notifications, confirmations).</p>
          </Collapsible>

          <Collapsible title="Syncing and IMAP">
            <p>Pastel syncs inboxes via IMAP every 5 seconds. Each sync fetches new messages, processes them into the email database, and for support inboxes — creates tickets and triggers auto-reply agents automatically. You can also manually trigger a sync from the inbox settings.</p>
          </Collapsible>
        </Section>

        {/* ── Agents ── */}
        <Section title="AI Agents">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Agents are AI-powered auto-responders that handle incoming support tickets automatically. Each agent is linked to a specific support inbox and can be configured with a custom personality, knowledge base, and action workflows.
          </p>

          <Collapsible title="Creating an agent">
            <Step num="1">Go to <strong className="text-foreground">Configure → Agents</strong> and click <strong className="text-foreground">Create Agent</strong>.</Step>
            <Step num="2">Select the <strong className="text-foreground">target inbox</strong> — the support inbox the agent will monitor and reply from.</Step>
            <Step num="3">Set the <strong className="text-foreground">agent name</strong> and <strong className="text-foreground">personality</strong>. The personality is a text description of how the agent should behave (e.g. "Friendly and concise, always ask for order details").</Step>
            <Step num="4">Toggle the agent <strong className="text-foreground">active</strong> to start auto-replying to new tickets.</Step>
          </Collapsible>

          <Collapsible title="Knowledge base">
            <p>You can add knowledge to an agent in three ways:</p>
            <p><strong className="text-foreground">Text</strong> — Manually type or paste knowledge content (e.g. FAQ answers, product documentation).</p>
            <p><strong className="text-foreground">File upload</strong> — Upload PDF, image, or text files. Pastel uses Mistral OCR to extract text from images and PDFs automatically.</p>
            <p><strong className="text-foreground">URL scraping</strong> — Provide a URL and Pastel will scrape the page, discover linked pages via sitemap/internal links, and extract the text content. Optionally, Mistral organises the scraped content into labelled categories.</p>
            <p className="mt-2">All knowledge is stored per-agent and included in every auto-reply context so the agent can reference it when generating responses.</p>
          </Collapsible>

          <Collapsible title="Actions (multi-step workflows)">
            <p>Actions let you define structured workflows the agent follows. Each action has an overview description and an ordered list of steps with titles and optional descriptions.</p>
            <p>For example, a "Refund request" action might have steps like: "Verify order ID", "Check refund eligibility", "Process refund", "Send confirmation". The agent references these steps when replying to relevant tickets.</p>
          </Collapsible>

          <Collapsible title="Auto-Reply behaviour">
            <p>When a new email arrives in a support inbox, the agent:</p>
            <Step num="1">Waits 2 minutes before responding (to allow for teammate intervention).</Step>
            <Step num="2">Loads the thread context and knowledge base.</Step>
            <Step num="3">Sends the email subject, body, and conversation history to the AI model (<code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">mistral-small-latest</code> by default) along with the personality prompt and knowledge context.</Step>
            <Step num="4">Generates a reply, appends a ticket tracking footer, and sends it via SMTP.</Step>
            <Step num="5">Saves the reply to the database for audit and context.</Step>
          </Collapsible>

          <Collapsible title="Ticket classification and task creation">
            <p>When a new email arrives in a support inbox, Pastel can automatically classify the email and create a task. The classification uses Mistral to categorise the email as a <strong className="text-foreground">bug</strong>, <strong className="text-foreground">feature request</strong>, <strong className="text-foreground">improvement</strong>, or <strong className="text-foreground">task</strong>. The resulting task is linked to the ticket for full traceability.</p>
            <p>This feature requires the <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">MISTRAL_API_KEY</code> environment variable to be set. If unavailable, emails default to the <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">task</code> category.</p>
          </Collapsible>

          <Collapsible title="Agent model selection">
            <p>Each agent can be configured to use a specific AI model. The default is <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">mistral-small-latest</code>. The model is set per-agent and can be changed in the agent edit panel.</p>
          </Collapsible>
        </Section>

        {/* ── Tickets and Tasks ── */}
        <Section title="Tickets and Tasks">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Tickets are automatically created from incoming emails in support inboxes. Each ticket tracks a customer conversation from first contact to resolution.
          </p>

          <Collapsible title="How tickets are created">
            <p>When an email arrives in a support inbox, Pastel:</p>
            <Step num="1">Checks if it's a new message (not a reply to an existing thread).</Step>
            <Step num="2">Generates a unique ticket ID (e.g. <code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">#A3B7C9F2</code>).</Step>
            <Step num="3">Creates a ticket record with the sender's email, subject, body, and thread ID.</Step>
            <Step num="4">Sends a ticket notification email to the sender confirming receipt.</Step>
            <Step num="5">If configured, classifies the email and creates a linked task.</Step>
            <Step num="6">Triggers the agent auto-reply workflow if an active agent is linked to the inbox.</Step>
          </Collapsible>

          <Collapsible title="Ticket statuses">
            <p><strong className="text-foreground">Open</strong> — The ticket is new and hasn't been addressed yet.</p>
            <p><strong className="text-foreground">Pending</strong> — The ticket is awaiting a response from the customer or a third party.</p>
            <p><strong className="text-foreground">Resolved</strong> — The ticket has been resolved and closed.</p>
          </Collapsible>

          <Collapsible title="Task management">
            <p>Tasks in Pastel represent work items that can be created manually or automatically from ticket classification. Each task has:</p>
            <p><strong className="text-foreground">Priority</strong> — High, Medium, or Low.</p>
            <p><strong className="text-foreground">Status</strong> — Pending, Reviewing, Planned, In Progress, or Completed.</p>
            <p><strong className="text-foreground">Category</strong> — Task, Bug, Feature Request, or Improvement.</p>
            <p><strong className="text-foreground">Group</strong> — Today or Upcoming, for organising your workflow.</p>
            <p>Tasks can be created from the Tasks page, linked to specific tickets, or auto-generated from email classification (Pro and Max plans).</p>
          </Collapsible>

          <Collapsible title="Ticket tracking">
            <p>Pro and Max plans include ticket tracking, which provides a full view of all tickets across your inboxes, including status, assignee, response times, and resolution history. You can filter, search, and update tickets from the Tickets section in the sidebar.</p>
          </Collapsible>
        </Section>

        {/* ── Workspaces ── */}
        <Section title="Workspaces">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Workspaces represent a domain you own and contain its own inboxes, agents, and tickets.
          </p>
        </Section>

        {/* ── Authentication and Security ── */}
        <Section title="Authentication and Security">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Pastel supports email/password login, GitHub OAuth, and two-factor authentication via TOTP (Time-based One-Time Passwords).
          </p>

          <Collapsible title="Setting up two-factor authentication">
            <Step num="1">Go to <strong className="text-foreground">Account → Security</strong> and click <strong className="text-foreground">Set up two-factor authentication</strong>.</Step>
            <Step num="2">Pastel generates a secret key and displays a QR code. Scan the QR code with your authenticator app (e.g. Google Authenticator, 1Password, Authy).</Step>
            <Step num="3">Enter the 6-digit code from your authenticator app to verify the setup.</Step>
            <Step num="4">2FA is now enabled. On your next login, you'll be prompted for an authenticator code after entering your password.</Step>
            <Step num="5">To disable 2FA, go to the same section and enter your password to confirm.</Step>
          </Collapsible>

          <Collapsible title="Login with 2FA">
            <p>When 2FA is enabled, the login flow changes:</p>
            <Step num="1">Enter your email/username and password as usual.</Step>
            <Step num="2">Pastel detects that 2FA is enabled and returns a challenge.</Step>
            <Step num="3">Enter the 6-digit code from your authenticator app.</Step>
            <Step num="4">The code is verified against your stored TOTP secret with a ±30 second window to account for clock drift.</Step>
            <Step num="5">On successful verification, you're logged in.</Step>
          </Collapsible>

          <Collapsible title="Password reset">
            <p>If you forget your password, click <strong className="text-foreground">Forgot password</strong> on the login page. Enter your email address and Pastel will send a password reset link. The link expires after 1 hour.</p>
          </Collapsible>
        </Section>

        {/* ── Plans and Billing ── */}
        <Section title="Plans and Billing">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Pastel offers four plan tiers: Free, Pro, and Max. Billing is handled through Stripe and subscriptions renew automatically.
          </p>

          <Collapsible title="Plan features">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Feature</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Free</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Pro</th>
                    <th className="text-left py-2 font-semibold text-foreground">Max</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Support inboxes</td><td className="py-2 pr-4">1</td><td className="py-2 pr-4">5</td><td className="py-2">Unlimited</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Domains</td><td className="py-2 pr-4">1</td><td className="py-2 pr-4">5</td><td className="py-2">Unlimited</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Emails / month</td><td className="py-2 pr-4">100</td><td className="py-2 pr-4">Unlimited</td><td className="py-2">Unlimited</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Agent replies / month</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">1,000</td><td className="py-2">10,000</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">AI rewrites / month</td><td className="py-2 pr-4">10</td><td className="py-2 pr-4">1,000</td><td className="py-2">10,000</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Ticketing</td><td className="py-2 pr-4">Basic</td><td className="py-2 pr-4">Standard</td><td className="py-2">Standard</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Ticket tracking</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">✓</td><td className="py-2">✓</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Auto-create tasks</td><td className="py-2 pr-4">—</td><td className="py-2 pr-4">✓</td><td className="py-2">✓</td></tr>
                  <tr className="border-b border-border/60"><td className="py-2 pr-4">Public contact page</td><td className="py-2 pr-4">✓</td><td className="py-2 pr-4">✓</td><td className="py-2">✓</td></tr>
                  <tr><td className="py-2 pr-4">Price</td><td className="py-2 pr-4 font-semibold text-foreground">$0</td><td className="py-2 pr-4 font-semibold text-foreground">$29/mo</td><td className="py-2 font-semibold text-foreground">$99/mo</td></tr>
                </tbody>
              </table>
            </div>
          </Collapsible>

          <Collapsible title="Upgrading or downgrading">
            <p>You can change your plan at any time from the billing page in account settings. If you have an existing Stripe subscription, changes are handled through the Stripe billing portal and take effect immediately with prorated adjustments.</p>
          </Collapsible>

          <Collapsible title="Cancellation">
            <p>You can cancel your subscription from the billing page. By default, the subscription cancels at the end of the current billing period. You can continue using paid features until the period ends.</p>
          </Collapsible>
        </Section>

        {/* ── Integrations ── */}
        <Section title="Integrations">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Pastel connects with your existing tools through Stripe for billing, Mail-in-a-Box for email infrastructure, Mistral and OpenAI for AI agent models, and GitHub for OAuth sign-in.
          </p>

          <Collapsible title="Stripe">
            <p>Billing and subscription management is handled through Stripe. When you upgrade to a paid plan, Pastel creates a Stripe Checkout session. Returning customers use the Stripe Customer Portal for plan changes and payment management.</p>
          </Collapsible>

          <Collapsible title="GitHub OAuth">
            <p>You can sign in to Pastel using your GitHub account. GitHub OAuth fetches your profile and email addresses. If it's your first time signing in with GitHub, you'll be guided through linking a password and creating your first workspace.</p>
          </Collapsible>

          <Collapsible title="AI models">
            <p>Pastel uses Mistral AI (<code className="text-[12px] bg-surface-hover px-1.5 py-0.5 rounded">mistral-small-latest</code>) as the default model for agent auto-replies and email classification. OpenAI can also be configured as an alternative model. The model choice is set per-agent and can be changed in agent settings.</p>
          </Collapsible>
        </Section>

        {/* ── Security and Compliance ── */}
        <Section title="Security and Compliance">
          <p className="text-[13px] text-muted-foreground leading-[1.7]">
            Pastel takes security seriously. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 aligned and GDPR compliant.
          </p>
          <Collapsible title="Data retention">
            <p>Account data is retained while your account is active. Analytics data is retained for 24 months. Billing records are kept for 7 years as required by tax law. When you delete your account, all associated data is removed except where legal obligations require continued retention.</p>
          </Collapsible>
          <Collapsible title="GDPR and CCPA">
            <p>Pastel provides tools to exercise your data rights directly from your account: you can export your data, update your profile, and delete your account. For additional requests, email privacy@getlatte.app.</p>
          </Collapsible>
        </Section>
      </div>
    </Layout>
  );
}
