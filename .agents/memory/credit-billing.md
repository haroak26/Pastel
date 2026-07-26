---
name: Credit-based AI billing
description: How agent and assistant AI billing works — dollar credits instead of reply/rewrite counts.
---

## Rule
`usage` table uses `agent_credit_used real` and `assistant_credit_used real` (not integer reply counts). `PLAN_LIMITS` has `agentCredit` and `assistantCredit` fields in dollars.

**Why:** Switched from fixed reply counts to token-cost-based credit so costs scale with actual AI usage.

## How to apply
- Agent credit (publicly shown): Starter $10, Pro $30, Max $60. Deducted per agent auto-reply via `incrementUsage(userId, "agent_credit_used", cost)`.
- Assistant credit (NOT shown publicly): Starter $0, Pro $5, Max $10. Deducted per /api/ai/draft and /api/chat call.
- Router calls (routerChat) and article generation (page-to-article) are FREE — no credit deduction.
- `agentChat`, `agentChatWithAttachments`, `agentChatWithTools` all return `{ content, cost }` — cost is calculated from actual token counts via `response.usage.prompt_tokens` / `completion_tokens`.
- Streaming assistant (/api/chat) estimates cost from character counts via `calcAssistantCost(inputChars, outputChars)` (1 token ≈ 4 chars).

## Cost rates (in server/lib/ai.ts)
- Claude Sonnet (POE): $3/1M input, $15/1M output
- GPT-oss-120b (Vercel/agent): $5/1M input, $15/1M output
- GPT-oss-20b (Vercel/assistant): $1/1M input, $5/1M output

## DB migration note
`drizzle-kit push` fails non-interactively when column type changes (integer→real). Use raw SQL via `executeSql` instead:
```sql
ALTER TABLE usage ADD COLUMN IF NOT EXISTS agent_credit_used REAL NOT NULL DEFAULT 0;
ALTER TABLE usage DROP COLUMN IF EXISTS agent_replies_used;
```
