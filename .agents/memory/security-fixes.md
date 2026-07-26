---
name: Security fixes applied
description: Summary of all security findings addressed in the Latte codebase and the patterns to maintain going forward.
---

## Fixes Applied

**CRITICAL**
- `server/email.ts`: Removed `console.log` that printed OTP/PIN plaintext to stdout.

**HIGH**
- `server/encryption.ts`: Added `{ authTagLength: 16 }` to `createDecipheriv` for AES-256-GCM to enforce auth tag length.
- `server/rules-engine.ts`: Added `v.length > 200` guard before `new RegExp(v)` to prevent user-supplied ReDoS in assignment rule "matches" operator.

**MEDIUM — HTML injection in emails**
- `server/emailTemplates.ts`: Added `he()` HTML escape helper; applied to all user-controlled interpolations (names, workspace names, email addresses, device info fields, plan names, invite URLs).
- `server/email.ts` (ticket-assigned email): Inline `.replace()` escaping on `assigneeName`, `ticketSubject`, `assignedByName`, `displayId`.
- `server/routes/remaining.ts` (CSAT email): Escaped `fromName` in HTML body.
- `server/routes/remaining.ts` (portal email): Escaped `ws.name` in HTML body.

**MEDIUM — ReDoS in client-side domain regex**
- `client/src/pages/CreateDomain.tsx` and `client/src/pages/Onboarding.tsx`: Replaced `^([a-z0-9-]+\.)+[a-z]{2,}$` (catastrophic backtracking) with `^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$`.

**MEDIUM — Unsafe file extension on uploads**
- `server/routes/emails.ts` (2 space-logo endpoints) and `server/routes/remaining.ts` (2 workspace-logo endpoints): Added `ALLOWED_IMG_EXTS` allowlist matching the pattern already used by the avatar upload endpoint.

## Why
- Logging secrets (PIN, password) violates GDPR/CCPA and leaks credentials in log aggregators.
- GCM without enforced authTagLength allows forged ciphertexts to decrypt silently.
- User-supplied RegExp without length guard can saturate the event loop.
- HTML-injected user data in email templates enables phishing/social-engineering via crafted names.
- Unrestricted file extensions bypass MIME-type-only checks and allow unexpected file types to be served.
