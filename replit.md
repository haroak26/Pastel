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

## Pastel Agent V6 (knowledge-base design pipeline)

Design pipeline in `server/lib/pastel-agent/` orchestrated by `orchestrator-v6.ts`. Seven phases
(`discovery → brief → wireframe → build → assemble → review → present`), hybrid model tiers
(cheap for the parallel component work, mid for brief/wireframe/review), and a knowledge base of
company design references that carries the visual quality:

- **Discovery** (`agents/clarify-v6.ts`): clarification questions (cheap model) + deterministic
  company suggestions (`scoreCompanies` tag matching). The redesigned agent panel shows a gallery
  of the 8 shipped companies (apple, nike, uber, airbnb, spotify, stripe, notion, netflix); users
  pick the "inspiration" their product should feel like (primary + optional secondary).
- **Brief** (`agents/brief-v6.ts`, mid): `ProductBrief` + attaches `megadesign.md` (universal design
  law) and the chosen company `design.md`(s) as run docs.
- **Wireframe** (`agents/wireframe-v6.ts`, mid): `WireframePlan` (screens + blocks) +
  `ComponentInventory` grounded in the company's screen recipes.
- **Build** (`agents/planner-v6.ts` + `agents/builder-v6.ts`, cheap, parallel pool): every component
  is planned (UI spec) then built (JSX adapting `base-components/*` exemplars) in bounded
  concurrency (`PASTEL_BUILDER_CONCURRENCY`).
- **Assemble** (`agents/copy-v6.ts` + deterministic `compose-v6.ts`): screen files composed from the
  wireframes + generated components + company-voiced copy; `src/data.js` + `src/styles.css` compiled
  from resolved company tokens. Sandbox verify (esbuild + SSR) + headless screenshots here.
- **Review** (deterministic gates + `agents/review-v6.ts`): code gate + geometry gate ($0) + static
  review (mid) + vision review of screenshots vs brief/megadesign/company design. Bounded repair
  loop (≤`PASTEL_MAX_REPAIR_CYCLES`=2).
- **Persistence**: brief, megadesign.md, company design.md, wireframe plan, component inventory,
  copy plan, gate report, review result under `docs/`; verified source + `.build/<S>.js` bundles.
- **Client wire contract**: phases `discovery/brief/wireframe/build/assemble/review/present`; SSE
  types `phase`, `title`, `doc`, `file`, `activity`, `done`, `error`. Previews at
  `GET /api/pastel-agent/runs/:runId/preview/:screen`.
- **Cost**: gateway captures real usage; holds settle against actual usage capped at the pre-run
  estimate. Pricing in `server/lib/pricing.ts`.
- Validation: `npm test` (v6 knowledge/schemas/compose/sandbox/review contracts),
  `npx tsx script/render-screens.ts [runId|latest]`, `npx tsx script/verify-repro.ts <runId>`.

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
- `PASTEL_MODEL_<ROLE>` — override Pastel models per role (v6 roles: CLARIFY, BRIEF, WIREFRAME, PLANNER, BUILDER, COPY, ASSEMBLE, REVIEW, VISUAL_REVIEW, REPAIR); `PASTEL_MAX_TOKENS_<ROLE>`, `PASTEL_THINKING_BUDGET`
- `PASTEL_MERGE_GATEWAY_TAG_<ROLE>` / `PASTEL_MERGE_GATEWAY_TAG_KEY` / `PASTEL_MERGE_GATEWAY_TAG_VALUE` — gateway analytics tags (default key `betatesterid`; values must be org-registered)
- `PASTEL_MAX_RUN_CREDITS` — per-run repair/guard budget ceiling (default 25)
- `PASTEL_MAX_REPAIR_CYCLES` — bounded repair loop iterations (default 2, range 1–5)
- `PASTEL_BUILDER_CONCURRENCY` — parallel component plan+build lanes (default 4)
- `PASTEL_MAX_TOKENS_<ROLE>` — per-role output budgets (right-sized to measured emission); `PASTEL_THINKING_BUDGET` (`off` disables reasoning; light roles skip it by default)
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
- Landing page (`client/src/pages/Landing.tsx`): banani-style marketing design (left-aligned hero, functional prompt bar, soft cards, pastel accent dots). The hero prompt is carried to the app via `sessionStorage["pastel-landing-prompt"]` (prefilled in `HomePage`); `sessionStorage["pastel-prompt"]` remains the canvas handoff key. Marketing-only exceptions are documented in `DESIGN_SYSTEM.md`.

## Running

```bash
npm run dev       # Start development server (Express + Vite on port 5000)
npm run db:push   # Sync schema to database
npx drizzle-kit push  # Push schema changes to database
```
