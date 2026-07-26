# Latte Dev — Strategic Vision

## Elevator Pitch

**Resend** is an email API for sending.  
**Latte Dev** is an email platform for building communication into your app.

Latte already runs its own mail infrastructure (LMS based on Stalwart JMAP) with full IMAP/SMTP. Resend is purely outbound. That is the moat.

## Core Differentiator: Two-Way Email API

Resend is **send-only**. Latte Dev is the first **full-duplex transactional email API** — send via API, receive via webhooks with structured parsing, automatic threading, and IMAP mailbox management. Any app where users reply to emails (notifications, comments, invoices, receipts) needs more than just "send." They need receive, thread, classify, and archive. Resend stops at send. Latte Dev picks up from there.

## Proposed Features

| Feature | Why It Beats Resend |
|---|---|
| **Inbound Webhooks + Structured Parsing** — Receive emails as parsed JSON (headers, body, attachments, reply-stripping) via webhook | Resend cannot receive at all |
| **Email Threading API** — First-class thread IDs, parent-child relationships, full conversation history | On Resend you have to build this yourself |
| **AI Email Pipeline** — Built-in classification, sentiment scoring, spam detection, auto-categorization on every message | Completely unique — Latte already has the AI agent infrastructure |
| **Email Testing Sandbox** — Preview renders across 100+ clients, spam score testing, link validation, DMARC/DKIM diagnostics | Resend offers no pre-send testing |
| **Broadcast Mode** — Scheduled batch sending with delivery windows, A/B subject lines, rate-limited delivery | Resend's batch support is basic |
| **SMTP + REST + GraphQL API** — Three interface options, not just REST | Developer choice, lower friction |
| **Real-Time Delivery WebSockets** — Live stream of delivery events instead of polling webhooks | Lower latency, better DX |
| **Code-First Email Templates** — Version-controlled React/JSX email components that compile to HTML (hosted, like react-email) | Modern developer workflow |
| **Pay-Per-Event Billing** — No tiers, no minimums. Flat per-email rate ($0.0001/send, $0.0001/receive) | Price clarity and simplicity |
| **Bring Your Own Mailbox** — Use Latte Dev as your app's complete email system: send + receive + archive + search | Turns an API into a platform |

## Positioning

Resend competes on deliverability and simplicity for outbound email.  
Latte Dev competes on **breadth of capability** for developers who want email to be a first-class, two-way part of their product.

The developer who picks Resend wants to fire-and-forget.  
The developer who picks Latte Dev wants to **build communication into their app** — not just send a password reset, but handle the reply, track the thread, and surface it in their UI.

## Pricing Philosophy

Not cheaper — **simpler and fairer**. Single per-event rate. No tiers, no overage surprises. The unit economics work because the LMS infrastructure is already built and paid for by the core Latte product. Latte Dev is a new surface area on the same engine.

## Go-To-Market Angle

Resend is for transactional emails. Latte Dev is for **conversational email** — apps where email is a dialogue, not a monologue. Target developers building:
- Marketplace platforms (buyer-seller messaging)
- SaaS products with notification reply
- Support platforms (meta: eat your own dog food)
- CRM and engagement tools
- Any app where "reply-to" actually matters
