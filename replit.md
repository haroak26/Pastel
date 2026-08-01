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

## Pastel Agent 2 (17-stage design pipeline)

Autonomous design pipeline in `server/lib/pastel-agent/`. Every stage has one responsibility and produces structured output; code generation never makes design decisions:

- **Stages** (orchestrated, mapped onto the client's six wire phases): `brief`: 1 clarify (ambiguity engine + confidence scoring) → 2 creative brief → 3 product specification; `plan`: 4 brand strategy → 5 brand kit (colour system incl. semantic/neutral scales, typography, radius/spacing scales, elevation, borders, icons, logo direction, motion + deterministic `src/styles.css` codegen) → 6 information architecture → 7 user flows → 8 screen planning → 9 layout planning (grid/chrome/breakpoints; every spacing value from the brand-kit scale) → 10 component system (contracts: variants/sizes/states/a11y/reuse) → 11 design pattern retrieval (pgvector cosine search over the curated `design_patterns` library + light rerank; static-library fallback) → 12 screen composition (screens assembled strictly from kit+components+layout+patterns) → 13 interaction planning (hover/focus/shortcuts/loading/empty/error/transitions); `review`: composition design gate; `build`: 14 code generation (registry-reused components, progressive per-screen verification); `verify`: 15/16/17 repair loop — automated QA (esbuild + smoke render + contract lint + anti-slop) ↔ visual design review (Playwright screenshots + multimodal review) ↔ surgical repair, bounded by `PASTEL_MAX_REPAIR_ITERS` (default 2); `present`: publish.
- **Model routing**: reasoners on `openai/gpt-5.6-terra`; implementers (component/screen/patch) on `openai/gpt-5.6-luna`; light roles (ia/flows/patternRank/interactions) default to `mistralai/ministral-14b-2512` (~7–60× cheaper; `PASTEL_MODEL_LIGHT` overrides). Every role overridable via `PASTEL_MODEL_<ROLE>`. Per-run credit budget guard (`PASTEL_MAX_RUN_CREDITS`, default 25). `gpt-oss-20b` returns empty responses on this gateway — never route roles to it.
- **Style seeds**: default is the enterprise `product-default` aesthetic (Linear/Stripe-class: hairline borders, 4–12px radii, professional UI fonts, measured whitespace). `PASTEL_STYLE_SEED=<name>` pins a seed; `PASTEL_STYLE_SEED=variety` restores the 21-seed creative roulette. Anti-slop + brand-kit validation enforce hairline borders (≤2px), radius caps (≤24px), and no truncation/novelty typography.
- **Persistent state**: `agent_project_state` now holds all 12 planning artifacts (intake, creativeBrief, productSpec, brandStrategy, designSystem=brand kit, informationArchitecture, userFlowPlan, screenPlan, layoutPlan, patternContext, interactionPlan, architecture=compositions) + `agent_component_registry`. Markdown docs and SSE events are rendered from state — never parsed back.
- **Pattern library**: 46 curated patterns in `design_patterns` (pgvector, migration 0004). Reseed with `npx tsx script/seed-design-patterns.ts` (requires pgvector + gateway).
- **Delta runs**: `POST /api/pastel-agent/projects/:projectId/screens` — state + registry reused, only the delta generated; screen/interaction plans are extended deterministically.
- **Client wire contract** (unchanged): phases `brief/plan/review/build/verify/present`; SSE event types; doc kinds `brief|system|component-spec|screen-spec|visual-review`. Docs: `docs/00-creative-brief.md`, `01-product-spec.md`, `02-brand-strategy.md`, `03-brand-kit.md`, `04-architecture.md` (IA + flows), `05-screen-plan.md`, `06-layout.md`, `07-components.md`, `docs/screens/<Name>.md` (compositions), `09-interactions.md`, `10-visual-review.md`; bundles at `.build/<S>.js`.
- Validation: `npx tsx script/pastel-e2e.ts` (full live run, 32 assertions), `script/pastel-delta-probe.ts` (delta-only), `script/verify-repro.ts <runId>` (offline verify), `script/render-screens.ts [runId|latest]` (offline screenshots of any completed run for visual review, output in `screenshots/review/`). `npm test` covers contracts (roles/tags/schemas), derivations, sandbox, fallbacks.

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
- `PASTEL_MODEL_<ROLE>` — override Pastel models per role (roles: INTAKE, CREATIVE_BRIEF, SPEC, BRAND_STRATEGY, DESIGN_SYSTEM, IA, FLOWS, SCREEN_PLAN, LAYOUT, COMPONENT_SYSTEM, PATTERN_RANK, COMPOSE, INTERACTIONS, ARCHITECTURE, DESIGN_GATE, VISUAL_QA, COMPONENT, SCREEN, PATCH); `PASTEL_MODEL_LIGHT` sets the default for light roles (IA, FLOWS, PATTERN_RANK, INTERACTIONS)
- `PASTEL_MERGE_GATEWAY_TAG_<ROLE>` / `PASTEL_MERGE_GATEWAY_TAG_KEY` / `PASTEL_MERGE_GATEWAY_TAG_VALUE` — gateway analytics tags (default key `betatesterid`; values must be org-registered)
- `PASTEL_MAX_RUN_CREDITS` — per-run repair/guard budget ceiling (default 25)
- `PASTEL_MAX_REPAIR_ITERS` — stage 17 repair-loop iterations (default 2, range 1–5)
- `PASTEL_INTAKE_CONFIDENCE` — ambiguity threshold for clarification questions (default 0.65)
- `PASTEL_STYLE_SEED` — unset = enterprise `product-default`; a seed name pins it; `variety` = creative roulette
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
