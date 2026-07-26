# Latte

Email helpdesk platform with AI-powered agent replies, ticket management, and support inboxes.

## Architecture

- **Backend**: Express + TypeScript (`server/`)
- **Frontend**: React + Vite + TanStack Query + Wouter (`client/`)
- **Database**: PostgreSQL via Drizzle ORM (`shared/schema.ts`)
- **Auth**: Passport.js (local + Google OAuth)
- **Email**: Brevo (primary) via `server/brevo.ts` with LMS (Latte Mail Server) via Stalwart at stalw.art for mailbox/DNS management via `server/lms.ts`

## Key Features

- Email inboxes with IMAP/SMTP sync
- AI agent auto-reply with personality, knowledge base, and actions
- Agent teams with AI/keyword/round-robin routing
- Ticket management with statuses, priorities, assignment, tags
- Review system for bugs and feature requests
- Public helpdesk pages (FAQs, Contact, Feedback board, Ticket tracking)
- Email templates with variable substitution
- Domain management with DNS verification (MX, SPF, DKIM, DMARC, BIMI)
- Team workspaces with role-based access
- Rate limiting on all auth endpoints via `authRateLimiter`
- **Timestamps are emitted as UTC ISO 8601** (`...Z`) from the server. `server/db.ts` overrides pg type parsers (OID 1114 → append Z, 1184 → as-is) and pins each connection to `SET TIME ZONE 'UTC'`.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `LMS_BASE_URL` — LMS (Latte Mail Server) base URL (e.g. `https://mailserver.meetlatte.com/api`)
- `LMS_ADMIN_USERNAME`, `LMS_ADMIN_PASSWORD` — LMS admin credentials for mailbox & DNS API
- `LMS_SMTP_HOST`, `LMS_SMTP_PORT` — LMS SMTP host and port (defaults: extracted from LMS_BASE_URL, port 587)
- `LMS_IMAP_HOST`, `LMS_IMAP_PORT` — LMS IMAP host and port (defaults: extracted from LMS_BASE_URL, port 993)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP fallback email (optional; logs links to console if neither Brevo nor SMTP is set)
- `BREVO_API_KEY` — Brevo transactional email API key (primary email provider)
- `BREVO_CONTACTS_LIST_ID` — Brevo list ID for all registered users
- `BREVO_NEWSLETTER_LIST_ID` — Brevo list ID for marketing/newsletter emails
- `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` — Verified Brevo sender details
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth (optional)
- `STRIPE_SECRET_KEY` — Stripe billing (required for paid plans)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (required for plan sync)
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_MAX` — Stripe Price IDs for monthly billing
- `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_MAX_ANNUAL` — Stripe Price IDs for annual billing (20% discount)
- `PADDLE_API_KEY` — Paddle billing (optional)

## Database Schema

See `shared/schema.ts`. Key tables:
- `users` — auth, email verification, email change, password reset tokens
- `workspaces` — team organization with associated domains
- `inboxes` — email inboxes with IMAP/SMTP config
- `email_messages` — synced email messages
- `email_domains` — domain verification (MX, SPF, DKIM, DMARC)
- `agents` — AI auto-responders with personality and actions
- `knowledge_items` — agent knowledge base
- `agent_teams` / `team_members` — multi-agent routing
- `tickets` — support ticket management
- `ticket_activities` — ticket reply history
- `reviews` — bug/feature-request pipeline
- `helpdesks` / `faq_items` / `feedback_items` — public helpdesk pages
- `templates` — email templates with variable substitution
- `forwarding_rules` — email forwarding
- `usage` — usage tracking per billing period
- `agent_analytics` — agent performance metrics
- `api_integrations` — Stripe/Paddle/LemonSqueezy keys per user
- `audit_logs` — security audit trail

## Important Notes

- `SafeUser` type omits all sensitive fields: password, tokens, expiry dates, reset tokens
- `/api/me` strips: password, emailVerificationToken, emailVerificationExpiry, pendingEmailToken, pendingEmailExpiry, passwordResetToken, passwordResetExpiry
- Cards use `bg-background` (not `bg-white`) for dark mode compatibility

## Running

```bash
npm run dev       # Start development server (Express + Vite on port 5000)
npm run db:push   # Sync schema to database
npx drizzle-kit push  # Push schema changes to database
```
