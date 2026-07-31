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

## Pastel Agent (v2 design agent)

Autonomous design pipeline in `server/lib/pastel-agent/`:

- **Stages** (orchestrated, mapped onto the client's six phases): intake (ambiguity engine with confidence scoring) → product spec → design system (+ deterministic `src/styles.css` codegen) → architecture (component contracts + screen blueprints) → design gate → implement (registry-reused components, screen composition, progressive per-screen verification) → verify (incremental, artifact-scoped repairs, anti-slop rules) → visual QA → publish.
- **Model routing**: reasoning/planning/verification on `openai/gpt-5.6-terra`; implementation (components, screens, repairs) on `openai/gpt-5.6-luna`. Per-run credit budget guard (`PASTEL_MAX_RUN_CREDITS`, default 25).
- **Persistent state**: `agent_project_state` (intake/spec/design system/architecture per project) + `agent_component_registry` (validated reusable components). Markdown docs and SSE events are rendered from state — nothing is re-derived from prose.
- **Delta runs**: `POST /api/pastel-agent/projects/:projectId/screens` adds screens onto an established project (state + registry reused, only the delta is generated). Cost estimate: `GET /api/pastel-agent/estimate`.
- **Client wire contract** (unchanged): phases `brief/plan/review/build/verify/present`; SSE event types; doc kinds `brief|system|component-spec|screen-spec|visual-review`; screen docs at `docs/screens/<Name>.md`; bundles at `.build/<S>.js`.
- Validation: `npx tsx script/pastel-e2e.ts` (full live run), `script/pastel-delta-probe.ts` (delta-only), `script/verify-repro.ts <runId>` (offline verify).

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
- `MERGE_GATEWAY_API_KEY` — AI gateway for the Pastel Agent + assistant features
- `PASTEL_MODEL_<ROLE>` — override Pastel models per role (roles: INTAKE, SPEC, DESIGN_SYSTEM, ARCHITECTURE, DESIGN_GATE, VISUAL_QA, COMPONENT, SCREEN, PATCH)
- `PASTEL_MERGE_GATEWAY_TAG_<ROLE>` / `PASTEL_MERGE_GATEWAY_TAG_KEY` / `PASTEL_MERGE_GATEWAY_TAG_VALUE` — gateway analytics tags (default key `betatesterid`; values must be org-registered)
- `PASTEL_MAX_RUN_CREDITS` — per-run repair/guard budget ceiling (default 25)
- `PASTEL_INTAKE_CONFIDENCE` — ambiguity threshold for clarification questions (default 0.65)
- `PASTEL_MAX_TOKENS_<ROLE>` — per-role output budgets; `PASTEL_THINKING_BUDGET` (`off` disables reasoning)
- `PASTEL_CHROMIUM_PATH`, `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`, `PASTEL_PREVIEW_BASE_URL`, `PASTEL_VISUAL_MOBILE` (`all` adds mobile screenshots) — visual QA tuning

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
