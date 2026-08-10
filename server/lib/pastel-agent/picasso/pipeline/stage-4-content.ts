import { z } from "zod";
import type { Brief, LayoutPlan, ScreenPlan } from "./types";
import type { BrandKit } from "./stage-3-architecture";
import { antiSlopSystemPrompt, contextCompositionRules, AI_SLOP_PHRASES, detectProductContext, type ProductContext } from "./anti-slop";
import { chatJSON, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../gateway";

// ── MockDataset ──────────────────────────────────────────────────────────

export interface MockDataset {
  users: Array<{ id: string; name: string; email: string; role: string; avatar: string }>;
  products: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  metrics: Record<string, { value: string; trend: string; unit: string }>;
  lists: Record<string, Array<Record<string, unknown>>>;
  generatedAt: string;
  itemCount: number;
}

// ── CopyPlan ─────────────────────────────────────────────────────────────

export interface CopyPlan {
  screens: Record<string, {
    heading: string;
    subheading: string;
    bodyCopy: string[];
    ctas: Array<{ label: string; variant: string; destination: string }>;
    labels: Record<string, string>;
    emptyStates: Record<string, { heading: string; description: string; cta: string }>;
    errorMessages: Record<string, string>;
  }>;
  globalCopy: { brandTagline: string; valueProposition: string; footerLinks: Record<string, string> };
  generatedAt: string;
  toneDescription: string;
}

// ── ContentOutput ────────────────────────────────────────────────────────

export interface ContentOutput {
  data: MockDataset;
  copy: CopyPlan;
  coherenceReport: { valid: boolean; issues: string[] };
}

// ── RunContentInput ──────────────────────────────────────────────────────

export interface RunContentInput {
  brief: Brief;
  layoutPlan: LayoutPlan;
  brandKit: BrandKit;
}

// ── Zod schemas ──────────────────────────────────────────────────────────

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  avatar: z.string(),
});

const metricSchema = z.object({
  value: z.string(),
  trend: z.string(),
  unit: z.string(),
});

const ctaSchema = z.object({
  label: z.string(),
  variant: z.string(),
  destination: z.string(),
});

const emptyStateSchema = z.object({
  heading: z.string(),
  description: z.string(),
  cta: z.string(),
});

const screenCopySchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  bodyCopy: z.array(z.string()),
  ctas: z.array(ctaSchema),
  labels: z.record(z.string()),
  emptyStates: z.record(emptyStateSchema),
  errorMessages: z.record(z.string()),
});

const copyPlanSchema = z.object({
  screens: z.record(screenCopySchema),
  globalCopy: z.object({
    brandTagline: z.string(),
    valueProposition: z.string(),
    footerLinks: z.record(z.string()),
  }),
  generatedAt: z.string(),
  toneDescription: z.string(),
});

const mockDatasetSchema = z.object({
  users: z.array(userSchema),
  products: z.array(z.record(z.unknown())),
  transactions: z.array(z.record(z.unknown())),
  metrics: z.record(metricSchema),
  lists: z.record(z.array(z.record(z.unknown()))),
  generatedAt: z.string(),
  itemCount: z.number(),
});

// ── Data generation prompts ──────────────────────────────────────────────

function mockDataSystem(brief: Brief, productContext: ProductContext): string {
  const contextRules = contextCompositionRules(productContext);

  return `You are a product data generator. You produce realistic, domain-appropriate mock data for a web application.

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

## PRODUCT CONTEXT

${contextRules}

## DATA GENERATION RULES

### Users (15-30 users)
- Realistic, diverse names appropriate to the product domain. NOT "John Doe" or "Test User".
- Varied roles specific to the product (not generic "admin" / "user").
- Email addresses match names and domain.
- Avatar is an initials-based URL (e.g., "https://ui-avatars.com/api/?name=Jane+Smith&background=accent&color=fff").

### Products / Items (15-50 items)
- Domain-appropriate items with realistic names, descriptions, prices, categories.
- Varied values — no uniform pricing. Natural distribution with outliers.
- Include metadata fields relevant to the niche (e.g., fintech: account types, balances, institutions; commerce: SKUs, inventory, variants; health: duration, intensity, equipment).

### Transactions (15-30 transactions)
- Realistic financial or activity data with varied amounts, dates spread across a timeframe.
- Include status fields (completed, pending, failed), references, and category metadata.
- Amounts should have a natural distribution — not all round numbers.

### Metrics (3-6 metrics)
- Key business/product metrics with numeric values, trend indicators (up/down arrows or +/- percentage), and units.
- Examples: "Total Revenue", "Active Users", "Conversion Rate", "Avg Order Value", "Open Tickets", "Completion Rate".

### Lists (2-4 named lists)
- Named collections of items (e.g., "RecentActivity", "TopSellers", "PendingApprovals", "TeamMembers").
- 10-30 items per list with domain-relevant fields.

## QUALITY REQUIREMENTS
- Minimum 15 users, 15 products/items, 15 transactions.
- No all-same values — natural variation throughout.
- Financial data uses realistic amounts with decimals.
- All names are diverse and domain-appropriate.
- Dates use ISO-8601 format.

Output ONLY valid JSON matching this schema:
{
  "users": [{ "id": "usr_1", "name": "Real Name", "email": "real@domain.com", "role": "Product-appropriate role", "avatar": "https://ui-avatars.com/api/?name=..." }],
  "products": [{ "id": "...", "name": "...", ...domain fields }],
  "transactions": [{ "id": "...", "amount": 123.45, "date": "2024-...", "status": "completed", ... }],
  "metrics": { "metricKey": { "value": "12,345", "trend": "+12%", "unit": "USD" } },
  "lists": { "listName": [{ ... }] },
  "generatedAt": "ISO-8601 timestamp",
  "itemCount": <total items across all arrays>
}`;
}

function mockDataUser(brief: Brief, layoutPlan: LayoutPlan, productContext: ProductContext): string {
  const screenIds = layoutPlan.screens.map((s) => `  - ${s.id}: ${s.description}`).join("\n");

  return `PRODUCT: ${brief.productName} (${brief.niche})
Description: ${brief.description}
Audience: ${brief.audience}
Personality: ${brief.personality.join(", ")}
Context: ${productContext}

SCREENS THAT NEED DATA:
${screenIds}

Generate realistic, domain-appropriate mock data for this product. The data must support all the screens listed above — if a screen shows transactions, there must be sufficient transactions. If a screen shows a user table, generate enough users. Vary values naturally — not all-the-same, not all-rounded numbers.

${brief.niche === "fintech" ? `FINANCIAL DATA: Include realistic account numbers, routing numbers, transaction types (credit/debit/transfer), currencies, and merchant names. Amounts range from $5 to $50,000 with natural distribution.` : ""}
${brief.niche === "commerce" ? `COMMERCE DATA: Include SKUs, inventory counts, pricing with decimal cents, categories, variants (size/color), and product images. Prices range from $9.99 to $499.99.` : ""}
${brief.niche === "productivity" ? `PRODUCTIVITY DATA: Include projects, tasks, assignees, due dates, priorities, and status workflows. Realistic project names like "Q4 Platform Migration" not "Project Alpha".` : ""}
${brief.niche === "social" ? `SOCIAL DATA: Include posts with timestamps, like/comment/share counts, user handles, media URLs, and hashtags. Realistic engagement numbers that follow power-law distribution.` : ""}
${brief.niche === "health" ? `HEALTH DATA: Include workout names, durations, calories, heart rate zones, exercise types, and progress metrics. Realistic variation — not all treadmill runs.` : ""}
${brief.niche === "devtools" ? `DEVTOOLS DATA: Include repository names, commit hashes, deployment statuses, build times, error counts, and branch names. Realistic project names with org/repo format.` : ""}`;
}

// ── Copy generation prompts ─────────────────────────────────────────────

function copyPlanSystem(brief: Brief, brandKit: BrandKit, productContext: ProductContext): string {
  const contextRules = contextCompositionRules(productContext);

  const slopPhrases = AI_SLOP_PHRASES.map((p) => `"${p}"`).join(", ");

  return `You are a product copywriter and content designer. You write ALL the text that appears in a product's screens — headings, body copy, CTAs, labels, empty states, and error messages.

## BRAND VOICE

Product personality: ${brief.personality.join(", ")}
Brand tagline direction: ${brandKit.typographyRules.displayUsage.slice(0, 200)}
Tone: ${brandKit.colorRules.accentUsage.includes("bold") ? "confident and direct" : brandKit.colorRules.accentUsage.includes("subtle") ? "calm and understated" : "clear and professional"}

## ANTI-SLOP GUARDRAILS

${antiSlopSystemPrompt()}

## PRODUCT CONTEXT RULES

${contextRules}

## FORBIDDEN PHRASES (any of these = REJECTION)

${slopPhrases}

## COPY WRITING RULES

### Headings
- Specific to the screen's function. "Dashboard" is acceptable only with a descriptive subheading.
- No generic headlines like "Welcome" or "Overview" without product context.
- 2-8 words. Descriptive, not marketing.

### Subheadings
- One sentence explaining what the user can do on this screen.
- Functional, not aspirational. "View and manage your active transactions" not "Take control of your finances".

### Body Copy
- 2-4 paragraphs of content-appropriate copy.
- No generic self-help language. No corporate buzzwords.
- Write what a human product designer would write for production.

### CTAs
- Specific action labels: "Create project", "Add transaction", "Send message", "View report", "Start deployment".
- NEVER: "Submit", "Continue", "Get started", "Learn more".
- Each CTA has: label, variant (primary/secondary/ghost), destination (route path).

### Labels
- Every form field, column header, and UI label gets its production text.
- Concise: 1-3 words. "Email address" not "Please enter your email address".

### Empty States
- For each content area that could be empty: heading, description, and a CTA.
- Headings are 3-5 words. Descriptions are one sentence. CTAs are action verbs.

### Error Messages
- Specific error messages for: network failure, permission denied, validation error, not found, server error.
- Each 5-15 words. No technical jargon. Actionable.

## QUALITY REQUIREMENTS
- Check every heading, CTA label, and empty state CTA against the FORBIDDEN PHRASES list. Reject if any match.
- No placeholder text ("Title", "Description").
- Every screen gets complete copy — no "TODO" or "[Add content]" markers.
- CTA labels use specific product-domain verbs.

Output ONLY valid JSON matching this schema:
{
  "screens": {
    "screen-id": {
      "heading": "Specific heading text",
      "subheading": "One sentence descriptor",
      "bodyCopy": ["paragraph 1", "paragraph 2"],
      "ctas": [{ "label": "Product action", "variant": "primary", "destination": "/route" }],
      "labels": { "fieldName": "Label text" },
      "emptyStates": { "region": { "heading": "No items yet", "description": "Explanation", "cta": "Create first" } },
      "errorMessages": { "network": "Connection lost. Check your internet and try again." }
    }
  },
  "globalCopy": {
    "brandTagline": "One-line brand descriptor",
    "valueProposition": "One-sentence value prop",
    "footerLinks": { "About": "/about", "Privacy": "/privacy", "Terms": "/terms", "Contact": "/contact" }
  },
  "generatedAt": "ISO-8601 timestamp",
  "toneDescription": "One paragraph describing the writing tone"
}`;
}

function copyPlanUser(
  brief: Brief,
  layoutPlan: LayoutPlan,
  dataSummary: string,
  productContext: ProductContext,
): string {
  const screensList = layoutPlan.screens
    .map((s) => {
      const dataContext = s.regions
        .filter((r) => r.componentTypes.some((ct) => ct.taxonomy === "molecule" || ct.taxonomy === "organism"))
        .map((r) => r.componentTypes.map((ct) => ct.name).join(", "))
        .join("; ");
      return `  - ${s.id} (${s.name}): ${s.description} — Components: ${dataContext || "(static)"}`;
    })
    .join("\n");

  const screenIds = layoutPlan.screens.map((s) => s.id).join(", ");

  return `PRODUCT: ${brief.productName}
Niche: ${brief.niche}
Personality: ${brief.personality.join(", ")}
Audience: ${brief.audience}
Mode: ${brief.mode}
Platform: ${brief.platform}
Context: ${productContext}

SCREENS TO WRITE COPY FOR:
${screensList}

REQUIRED SCREEN IDS (must all be present in output): ${screenIds}

GLOBAL REGIONS:
${layoutPlan.globalRegions.map((r) => `${r.name} (${r.role})`).join(", ") || "(none)"}

MOCK DATA SAMPLE (for context — reference this data in your copy):
${dataSummary}

## INSTRUCTIONS

Write ALL copy for ALL screens listed above. Reference the mock data in your copy — if a metric shows "12,345 users", mention it in the heading or body copy. If a list has 24 pending items, reference that count in a CTA or empty-state check.

Make every CTA label product-appropriate. A devtools product gets "View deployment", a fintech app gets "Add transaction", a commerce platform gets "Create product".

CHECK EVERY output string against these forbidden phrases: ${AI_SLOP_PHRASES.map((p) => `"${p}"`).join(", ")}. If any match, REWRITE.`;
}

// ── Coherence validation ─────────────────────────────────────────────────

function validateCoherence(data: MockDataset, copy: CopyPlan, screenIds: string[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check minimum data thresholds
  if (data.users.length < 8) {
    issues.push(`Only ${data.users.length} users generated — expected at least 8.`);
  }
  if (data.itemCount < 10) {
    issues.push(`Total data items (${data.itemCount}) is below minimum threshold of 10.`);
  }

  // Check all screen IDs present in copy
  for (const id of screenIds) {
    if (!copy.screens[id]) {
      issues.push(`Screen "${id}" is missing from the copy plan.`);
    }
  }

  // Check for AI-slop phrases in copy
  const slopLower = AI_SLOP_PHRASES.map((p) => p.toLowerCase());
  const allCopyText = Object.values(copy.screens)
    .flatMap((s) => [s.heading, s.subheading, ...s.bodyCopy, ...s.ctas.map((c) => c.label), ...Object.values(s.labels),
      ...Object.values(s.emptyStates).flatMap((e) => [e.heading, e.description, e.cta]),
      ...Object.values(s.errorMessages)])
    .filter(Boolean);

  for (const text of allCopyText) {
    const lower = text.toLowerCase();
    for (const slop of slopLower) {
      if (lower.includes(slop)) {
        issues.push(`AI-slop phrase detected in copy: "${slop}" found in "${text.slice(0, 60)}..."`);
      }
    }
    if (issues.length > 5) break; // Don't spam
  }

  // Check for generic placeholder copy
  const genericPatterns = [
    { check: (t: string) => t === "Title" || t === "Description" || t === "Click here", label: "placeholder content" },
    { check: (t: string) => t === "Submit" || t === "Continue" || t === "Get started" || t === "Learn more", label: "generic CTA label" },
  ];

  for (const text of allCopyText) {
    for (const { check, label } of genericPatterns) {
      if (check(text) && !issues.some((i) => i.includes(label))) {
        issues.push(`Generic ${label} detected: "${text}"`);
      }
    }
    if (issues.length > 8) break;
  }

  // Check for "John Doe" type names
  const badNames = ["john doe", "jane doe", "test user", "john smith"];
  for (const user of data.users) {
    if (badNames.includes(user.name.toLowerCase())) {
      issues.push(`Generic persona name detected: "${user.name}"`);
    }
  }

  return { valid: issues.length === 0, issues };
}

// ── Public API ───────────────────────────────────────────────────────────

export async function generateMockData(
  brief: Brief,
  layoutPlan: LayoutPlan,
): Promise<MockDataset> {
  const productContext = detectProductContext({
    productName: brief.productName,
    description: brief.description,
    platform: brief.platform,
    niche: brief.niche,
  });

  return chatJSON<MockDataset>(
    [
      { role: "system", content: mockDataSystem(brief, productContext) },
      { role: "user", content: mockDataUser(brief, layoutPlan, productContext) },
    ],
    {
      model: "data",
      temperature: 0.6,
      maxTokens: MAX_TOKENS_PER_CALL.data,
      validate: (v) => {
        const parsed = mockDatasetSchema.parse(v);
        if (parsed.itemCount < 10) {
          throw new Error(`Insufficient data: only ${parsed.itemCount} items generated. Minimum is 10.`);
        }
        if (parsed.users.length < 8) {
          throw new Error(`Insufficient users: only ${parsed.users.length} generated. Minimum is 8.`);
        }
        return parsed;
      },
    },
  );
}

export async function generateCopyPlan(
  brief: Brief,
  layoutPlan: LayoutPlan,
  data: MockDataset,
  brandKit: BrandKit,
): Promise<CopyPlan> {
  const productContext = detectProductContext({
    productName: brief.productName,
    description: brief.description,
    platform: brief.platform,
    niche: brief.niche,
  });

  const dataSummary = [
    `Users: ${data.users.length} (${data.users.slice(0, 3).map((u) => u.name).join(", ")}...)`,
    `Products: ${data.products.length} items`,
    `Transactions: ${data.transactions.length} records`,
    `Metrics: ${Object.keys(data.metrics).join(", ")}`,
    `Lists: ${Object.keys(data.lists).join(", ")} (${Object.values(data.lists).reduce((sum, l) => sum + l.length, 0)} total items)`,
    ``,
    `Sample user: ${JSON.stringify(data.users[0])}`,
    `Sample product: ${JSON.stringify(data.products[0])}`,
    `Sample transaction: ${JSON.stringify(data.transactions[0])}`,
    `Metrics: ${JSON.stringify(data.metrics)}`,
  ].join("\n");

  return chatJSON<CopyPlan>(
    [
      { role: "system", content: copyPlanSystem(brief, brandKit, productContext) },
      { role: "user", content: copyPlanUser(brief, layoutPlan, dataSummary, productContext) },
    ],
    {
      model: "copy",
      temperature: 0.6,
      maxTokens: MAX_TOKENS_PER_CALL.copy,
      validate: (v) => {
        const parsed = copyPlanSchema.parse(v);
        const screenIds = layoutPlan.screens.map((s) => s.id);
        const missing = screenIds.filter((id) => !parsed.screens[id]);
        if (missing.length > 0) {
          throw new Error(
            `Copy plan is missing screens: ${missing.join(", ")}. Required: ${screenIds.join(", ")}`,
          );
        }
        // Check for AI-slop in headings and CTAs
        const slopLower = AI_SLOP_PHRASES.map((p) => p.toLowerCase());
        for (const [screenId, screen] of Object.entries(parsed.screens)) {
          for (const slop of slopLower) {
            if (screen.heading.toLowerCase().includes(slop)) {
              throw new Error(
                `AI-slop phrase "${slop}" found in heading for screen "${screenId}". Rewrite with product-specific copy.`,
              );
            }
          }
          for (const cta of screen.ctas) {
            for (const slop of slopLower) {
              if (cta.label.toLowerCase().includes(slop)) {
                throw new Error(
                  `AI-slop phrase "${slop}" found in CTA label for screen "${screenId}". Use a specific action verb.`,
                );
              }
            }
            if (["Submit", "Continue", "Get started", "Learn more"].includes(cta.label)) {
              throw new Error(
                `Generic CTA label "${cta.label}" in screen "${screenId}". Use a product-specific action verb.`,
              );
            }
          }
        }
        return parsed;
      },
    },
  );
}

// ── runContentGeneration ─────────────────────────────────────────────────

export async function runContentGeneration(
  input: RunContentInput,
): Promise<ContentOutput> {
  const { brief, layoutPlan, brandKit } = input;

  // 1. Generate mock data
  const data = await generateMockData(brief, layoutPlan);

  // 2. Generate copy (passing data as context)
  const copy = await generateCopyPlan(brief, layoutPlan, data, brandKit);

  // 3. Validate coherence
  const screenIds = layoutPlan.screens.map((s) => s.id);
  const coherenceReport = validateCoherence(data, copy, screenIds);

  return { data, copy, coherenceReport };
}

// ── Markdown reporter ────────────────────────────────────────────────────

export function renderContentReport(output: ContentOutput): string {
  const { data, copy, coherenceReport } = output;

  const lines: string[] = [
    `## Content Generation Report`,
    ``,
    `### Coherence: ${coherenceReport.valid ? "PASSED" : "FAILED"}`,
  ];

  if (coherenceReport.issues.length > 0) {
    lines.push(``, `Issues:`);
    for (const issue of coherenceReport.issues) {
      lines.push(`  - ${issue}`);
    }
  }

  lines.push(
    ``,
    `### Mock Data`,
    ``,
    `- **Users:** ${data.users.length}`,
    `- **Products:** ${data.products.length}`,
    `- **Transactions:** ${data.transactions.length}`,
    `- **Metrics:** ${Object.keys(data.metrics).length}`,
    `- **Lists:** ${Object.keys(data.lists).length} (${Object.values(data.lists).reduce((sum, l) => sum + l.length, 0)} items across lists)`,
    `- **Total items:** ${data.itemCount}`,
    ``,
    `#### Sample Users (first 5)`,
    ``,
  );

  for (const user of data.users.slice(0, 5)) {
    lines.push(`- ${user.name} (${user.role}) — ${user.email}`);
  }

  lines.push(
    ``,
    `#### Metrics`,
    ``,
  );

  for (const [key, metric] of Object.entries(data.metrics)) {
    lines.push(`- **${key}:** ${metric.value} ${metric.unit} (${metric.trend})`);
  }

  lines.push(
    ``,
    `### Copy Plan`,
    ``,
    `- **Tone:** ${copy.toneDescription}`,
    `- **Tagline:** ${copy.globalCopy.brandTagline}`,
    `- **Value Proposition:** ${copy.globalCopy.valueProposition}`,
    ``,
    `#### Screen Copy (${Object.keys(copy.screens).length} screens)`,
    ``,
  );

  for (const [screenId, screen] of Object.entries(copy.screens)) {
    lines.push(`##### ${screenId}`, ``);
    lines.push(`- **Heading:** ${screen.heading}`);
    if (screen.subheading) lines.push(`- **Subheading:** ${screen.subheading}`);
    if (screen.bodyCopy.length > 0) lines.push(`- **Body:** ${screen.bodyCopy.length} paragraph(s)`);
    if (screen.ctas.length > 0) {
      lines.push(`- **CTAs:**`);
      for (const cta of screen.ctas) {
        lines.push(`  - [${cta.variant}] ${cta.label} → ${cta.destination}`);
      }
    }
    if (Object.keys(screen.emptyStates).length > 0) {
      lines.push(`- **Empty States:** ${Object.keys(screen.emptyStates).join(", ")}`);
    }
    lines.push(``);
  }

  lines.push(
    `#### Global Copy`,
    ``,
  );

  for (const [key, value] of Object.entries(copy.globalCopy.footerLinks)) {
    lines.push(`- **${key}:** ${value}`);
  }

  lines.push(``, `Generated at ${copy.generatedAt}`);

  return lines.join("\n");
}
