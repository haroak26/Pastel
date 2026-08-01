import { chatJSON, MODELS, MAX_TOKENS_PER_CALL } from "../gateway";
import { specSystemPrompt, specUserPrompt } from "../prompts/product-spec";
import { productSpecSchema, type ProductSpec, type IntakeBrief } from "../schemas/plan-schemas";
import { briefToMarkdown } from "../codegen/markdown";
import { updateRun } from "../run-store";
import { storage } from "../../../storage";
import { saveProjectState } from "../state";
import { fallbackIntake } from "./clarify";
import type { StageContext } from "./context";

/**
 * Stage 3 — Product specification: features, pages, navigation, states,
 * responsive and accessibility requirements as ONE structured artifact
 * (screen detail is refined by the screen-planning stage; system states by
 * the interaction-planning stage).
 */

function specScreensFromPrompt(prompt: string): ProductSpec["screens"] {
  const p = prompt.toLowerCase();
  if (/dashboard|admin|saas|analytics/.test(p)) {
    return [
      { id: "dashboard", name: "Dashboard", purpose: "Main overview with stats and activity", userGoal: "Understand the current state at a glance", sections: [{ name: "Overview", purpose: "Key metrics" }, { name: "Activity", purpose: "Recent events" }], components: ["Navbar", "Card", "Button"] },
      { id: "reports", name: "Reports", purpose: "Analytics and reporting view", userGoal: "Inspect performance in depth", sections: [{ name: "Report Grid", purpose: "Primary data" }, { name: "Filters", purpose: "Narrow the data" }], components: ["Navbar", "Card", "Button"] },
      { id: "settings", name: "Settings", purpose: "Account and preferences", userGoal: "Configure the product", sections: [{ name: "Settings Form", purpose: "Edit preferences" }], components: ["Navbar", "Input", "Button"] },
      { id: "profile", name: "Profile", purpose: "User profile view", userGoal: "Review identity and activity", sections: [{ name: "Profile Details", purpose: "Identity" }], components: ["Navbar", "Card", "Button"] },
    ];
  }
  if (/shop|store|commerce|product/.test(p)) {
    return [
      { id: "home", name: "Home", purpose: "Storefront landing page", userGoal: "Discover what the store sells", sections: [{ name: "Hero", purpose: "Lead with the offer" }, { name: "Featured Products", purpose: "Surface bestsellers" }], components: ["Navbar", "Card", "Button", "Footer"] },
      { id: "products", name: "Products", purpose: "Product listing and filtering", userGoal: "Browse the catalog", sections: [{ name: "Product Grid", purpose: "Browse items" }], components: ["Navbar", "Card", "Button", "Footer"] },
      { id: "product", name: "Product", purpose: "Single product detail view", userGoal: "Evaluate one item", sections: [{ name: "Product Details", purpose: "Decide to buy" }, { name: "Reviews", purpose: "Social proof" }], components: ["Navbar", "Button", "Footer"] },
      { id: "cart", name: "Cart", purpose: "Shopping cart and checkout", userGoal: "Review the order", sections: [{ name: "Cart Items", purpose: "Review items" }, { name: "Summary", purpose: "Confirm totals" }], components: ["Navbar", "Button", "Input", "Footer"] },
    ];
  }
  return [
    { id: "home", name: "Home", purpose: "Landing page", userGoal: "Understand the offer", sections: [{ name: "Hero", purpose: "Lead the pitch" }, { name: "Features", purpose: "Explain value" }], components: ["Navbar", "Button", "Footer"] },
    { id: "about", name: "About", purpose: "About the product or company", userGoal: "Build trust", sections: [{ name: "Story", purpose: "Why it exists" }, { name: "Team", purpose: "Who made it" }], components: ["Navbar", "Footer"] },
    { id: "pricing", name: "Pricing", purpose: "Pricing plans", userGoal: "Pick a plan", sections: [{ name: "Pricing Tiers", purpose: "Compare plans" }, { name: "FAQ", purpose: "Resolve objections" }], components: ["Navbar", "Card", "Button", "Footer"] },
    { id: "contact", name: "Contact", purpose: "Contact form and info", userGoal: "Reach a human", sections: [{ name: "Contact Form", purpose: "Send a message" }], components: ["Navbar", "Input", "Button", "Footer"] },
  ];
}

export function fallbackProductSpec(prompt: string, intake: IntakeBrief | null): ProductSpec {
  return {
    title: (intake?.titleSuggestion || prompt.split(/\s+/).filter(Boolean).slice(0, 5).join(" ").replace(/[^a-zA-Z0-9 ]/g, "").trim()) || "Product Experience Concept",
    summary: prompt.slice(0, 600),
    goals: ["Deliver the primary task with clarity and commercial polish"],
    audience: { primary: intake?.audience ?? "The audience implied by the request", secondary: [] },
    screens: specScreensFromPrompt(prompt),
    userFlows: [],
    accessibility: {
      level: "AA",
      requirements: ["Contrast ratio 4.5:1 for body text and 3:1 for large text", "All interactive elements keyboard reachable with visible focus"],
    },
    interactionPatterns: ["Primary actions use the accent color", "Hover and focus states on all interactive elements"],
    responsive: { notes: ["Multi-column sections stack below 768px", "Navigation collapses to a menu on mobile"] },
    technicalConstraints: ["Static React application, no backend calls"],
    successMetrics: ["A first-time user can find the primary action within seconds"],
  };
}

export async function specStage(ctx: StageContext): Promise<ProductSpec> {
  ctx.activity("Writing the product specification");
  const intake = ctx.state.intake ?? fallbackIntake(ctx.prompt);
  ctx.state.intake = intake;

  let spec: ProductSpec;
  const sys = specSystemPrompt();
  const user = specUserPrompt(ctx.prompt, JSON.stringify(intake), JSON.stringify(ctx.state.creativeBrief ?? {}), ctx.answers);
  try {
    spec = await chatJSON<ProductSpec>(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { model: "spec", temperature: 0.4, maxTokens: MAX_TOKENS_PER_CALL.spec, validate: (v) => productSpecSchema.parse(v) },
    );
    ctx.trackCost("spec", MODELS.spec, sys.length + user.length, JSON.stringify(spec).length);
  } catch (err) {
    console.warn("[pastel-agent] product spec failed, using fallback:", err instanceof Error ? err.message : err);
    ctx.activity("Specification incomplete — proceeding with a structured fallback");
    spec = fallbackProductSpec(ctx.prompt, intake);
  }

  ctx.state.productSpec = spec;
  await saveProjectState(ctx.state);

  // Title → run record + project name (both exist in v1 behavior)
  const title = spec.title.trim().slice(0, 60);
  if (title) {
    await updateRun(ctx.runId, { title });
    ctx.emit({ type: "title", title });
    if (ctx.projectId) {
      try { await storage.updateProject(ctx.projectId, { name: title }); } catch {}
    }
  }

  await ctx.saveDoc({
    path: "docs/01-product-spec.md",
    title: "Product Specification",
    kind: "brief",
    content: briefToMarkdown(spec, intake, ctx.answers),
  });
  ctx.activity(`Product spec ready — ${spec.screens.length} screens: ${spec.screens.map((s) => s.name).join(", ")}`);
  return spec;
}
