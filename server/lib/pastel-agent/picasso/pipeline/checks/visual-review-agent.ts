import type { RubricScores, RubricDimension, Tokens, Brief } from "../types";
import type { ProductContext } from "../anti-slop";
import { chatJSON, MODELS, MAX_TOKENS_PER_CALL, type ChatMessage } from "../../../gateway";
import { z } from "zod";
import { antiSlopSystemPrompt } from "../anti-slop";

export interface VisualReviewInput {
  screenshot: Buffer;
  screenName: string;
  brief: Brief;
  tokens: Tokens;
  productContext: ProductContext;
  creativeSeed: string;
}

export interface VisualReviewOutput {
  scores: RubricScores;
  average: number;
  passed: boolean;
  failingDimensions: RubricDimension[];
  diagnosis: string;
  strengths: string[];
  improvements: string[];
}

const DIMENSIONS = [
  "productContext",
  "brandCoherence",
  "hierarchy",
  "composition",
  "spacingRhythm",
  "componentConsistency",
  "navigation",
  "contentCopy",
  "responsiveDesign",
  "accessibilityBaseline",
] as const;

const rubricSchema = z.object({
  scores: z.object({
    productContext: z.number().min(0).max(10),
    brandCoherence: z.number().min(0).max(10),
    hierarchy: z.number().min(0).max(10),
    composition: z.number().min(0).max(10),
    spacingRhythm: z.number().min(0).max(10),
    componentConsistency: z.number().min(0).max(10),
    navigation: z.number().min(0).max(10),
    contentCopy: z.number().min(0).max(10),
    responsiveDesign: z.number().min(0).max(10),
    accessibilityBaseline: z.number().min(0).max(10),
  }),
  diagnosis: z.string(),
  strengths: z.array(z.string()).max(3).default([]),
  improvements: z.array(z.string()).max(4).default([]),
});

const REVIEW_SYSTEM = `You are a ruthless senior design director reviewing a rendered screenshot of a product screen. You score it on 10 dimensions and write an honest, specific critique.

Scoring:
- 9-10: exceptional, distinctive, pixel-crafted
- 7-8: strong — works, feels intentional
- 5-6: average — no obvious errors, but generic or flat
- 3-4: weak — clear layout, spacing, hierarchy, or brand problems
- 0-2: broken — unusable, blank, overflowing, or visually hostile

Consider specifically:
- Does the screen open with ONE dominant moment? Is hierarchy obvious at a glance (the primary region is unmissable)?
- Is the spacing rhythm varied and intentional, or a uniform wall?
- Is the accent colour used as a spotlight, not a wash? No gradients, no default-grey walls?
- Does the copy sound like THIS product, not a template? No "Get started", no lorem, no filler.
- Is the layout coherent (alignment, grid, density) with no overflow, no cut-off text, no awkward gaps?
- Brand coherence: do the colours/type feel like one system from this product's direction (accent, radius, density)?
- 10 dimensions: productContext (fits the product's job), brandCoherence, hierarchy, composition, spacingRhythm, componentConsistency, navigation, contentCopy, responsiveDesign, accessibilityBaseline.

The creative seed is the product's identity — a screen that could belong to any product scores low on brandCoherence and productContext.

Return JSON: { scores{...}, diagnosis (2-4 sentences, specific), strengths (≤3), improvements (≤4, actionable) }`;

export async function reviewScreen(input: VisualReviewInput): Promise<VisualReviewOutput> {
  const { screenshot, screenName, brief, tokens, productContext, creativeSeed } = input;

  const messages: ChatMessage[] = [
    { role: "system", content: REVIEW_SYSTEM },
    {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: "image/png", data: screenshot.toString("base64") },
        },
        {
          type: "text",
          text: [
            `Screen: ${screenName}`,
            `Product: ${brief.productName} — ${brief.description}`,
            `Audience: ${brief.audience}`,
            `Personality: ${brief.personality.join(", ")}`,
            `Creative seed: ${creativeSeed}`,
            `Accent: ${tokens.color.accent["500"]} · Radius: ${tokens.radius.lg} · Motion: ${tokens.motion.character}`,
            `Fonts: ${tokens.typography.fontFamily.display} / ${tokens.typography.fontFamily.body}`,
            `Context: ${productContext}`,
            "",
            antiSlopSystemPrompt(),
            "",
            "Score the screenshot now. Return the rubric JSON.",
          ].join("\n"),
        },
      ],
    },
  ];

  const result = await chatJSON(messages, {
    model: "visualReview",
    temperature: 0.3,
    maxTokens: MAX_TOKENS_PER_CALL.visualReview,
    validate: (v) => rubricSchema.parse(v),
  });

  const scores = result.scores as RubricScores;
  const values = DIMENSIONS.map((d) => scores[d]);
  const average = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
  const failing = DIMENSIONS.filter((d) => scores[d] < 6);
  const passed = failing.length === 0 && average >= 7;

  return {
    scores,
    average,
    passed,
    failingDimensions: failing as RubricDimension[],
    diagnosis: result.diagnosis,
    strengths: result.strengths,
    improvements: result.improvements,
  };
}
