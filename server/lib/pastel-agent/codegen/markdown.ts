import type {
  ArchitecturePlan,
  ComponentContract,
  DesignSystemSpec,
  IntakeBrief,
  ProductSpec,
  ScreenBlueprint,
  SpecScreen,
  VisualReview,
} from "../schemas/plan-schemas";
import { cssTokenName } from "./derive";

/**
 * Documentation renderers — human-readable markdown derived FROM structured
 * state. The pipeline never parses these back; they exist for review.
 */

export function briefToMarkdown(
  spec: ProductSpec,
  intake: IntakeBrief | null,
  answers: Record<string, string>,
): string {
  const answerLines = Object.entries(answers);
  return `# Build Brief — ${spec.title}

## Product
${spec.summary}

## Audience
- **Primary:** ${spec.audience.primary}
${spec.audience.secondary.map((a) => `- **Secondary:** ${a}`).join("\n") || "- **Secondary:** none"}

## Goals
${spec.goals.map((g) => `- ${g}`).join("\n")}

## Success Metrics
${spec.successMetrics.map((m) => `- ${m}`).join("\n")}

## Screens
${spec.screens
  .map(
    (screen) => `### ${screen.name}
- **Purpose:** ${screen.purpose}
- **User goal:** ${screen.userGoal}
- **Sections:** ${screen.sections.map((s) => `${s.name} — ${s.purpose}`).join("; ")}`,
  )
  .join("\n\n")}

## User Flows
${spec.userFlows.map((f) => `- **${f.name}:** ${f.steps.join(" → ")}`).join("\n") || "- Single-task flows"}

## Accessibility (${spec.accessibility.level})
${spec.accessibility.requirements.map((r) => `- ${r}`).join("\n")}

## Interaction Patterns
${spec.interactionPatterns.map((p) => `- ${p}`).join("\n") || "- Standard controls with hover and focus states"}

## Responsive Behaviour
${spec.responsive.notes.map((n) => `- ${n}`).join("\n") || "- Sections stack below the tablet breakpoint"}

## Technical Constraints
${spec.technicalConstraints.map((c) => `- ${c}`).join("\n") || "- Static React application, no backend"}
${intake ? `
## Assumptions
${intake.assumptions.map((a) => `- ${a}`).join("\n") || "- None recorded"}
` : ""}
## Clarification Answers
${answerLines.length > 0 ? answerLines.map(([k, v]) => `- **${k}:** ${v}`).join("\n") : "- None provided (confidence was high enough to proceed)"}
`;
}

export function designSystemToMarkdown(ds: DesignSystemSpec, styleContext: string): string {
  const colorRows = Object.entries(ds.colors)
    .map(([token, c]) => `| ${token} | ${c.hex} | ${c.usage} |${c.contrastRatio ? ` ${c.contrastRatio}:1` : ""}|`)
    .join("\n");
  const typeRows = Object.entries(ds.typeScale)
    .map(([token, t]) => `| ${token} | ${t.px}px | ${t.weight} | ${t.lineHeight} | ${t.tracking || "-"} | ${t.usage} |`)
    .join("\n");
  const radiusRows = Object.entries(ds.radius)
    .map(([token, r]) => `| ${token} | ${r.px}px | ${r.usage} |`)
    .join("\n");
  const shadowRows = ds.shadows && Object.keys(ds.shadows).length > 0
    ? Object.entries(ds.shadows).map(([token, s]) => `| ${token} | \`${s.value}\` | ${s.usage} |`).join("\n")
    : "| — | No shadows (style seed does not permit) |";
  const tok = ds.tokens;
  const tokensJson = JSON.stringify(
    { colors: tok.colors, fonts: tok.fonts, sizes: tok.sizes, radius: tok.radius, shadows: tok.shadows },
    null,
    2,
  );
  return `# Design System

## Concept
${ds.concept}

## Color
| Token | Hex | Usage | Contrast |
|---|---|---|---|
${colorRows}

## Typography
### Display: ${ds.fonts.display} | Body: ${ds.fonts.body}
| Token | Size | Weight | Line-height | Tracking | Usage |
|---|---|---|---|---|---|
${typeRows}

## Radius
| Token | Value | Usage |
|---|---|---|
${radiusRows}

## Shadows
| Token | Value | Usage |
|---|---|---|
${shadowRows}

## Spacing
- Base rhythm: ${ds.spacing.base}px
- Section gap: ${ds.spacing.sectionGap}px
- Container max-width: ${ds.spacing.containerWidth}px
- Gutter: ${ds.spacing.gutter}px
- Vertical section padding: ${ds.spacing.verticalSectionPadding}px

## Grid & Breakpoints
- Columns: ${ds.grid.columns}, gap ${ds.grid.gapPx}px, margins ${ds.grid.marginPx}px
- Breakpoints: mobile ${ds.breakpoints.mobile}px · tablet ${ds.breakpoints.tablet}px · desktop ${ds.breakpoints.desktop}px

## Motion
- Durations: fast ${ds.motion.durationFastMs}ms, base ${ds.motion.durationBaseMs}ms
- Easing: \`${ds.motion.easing}\`
${ds.motion.principles.map((p) => `- ${p}`).join("\n")}

## Component Standards
- **File layout:** ${ds.componentStandards.fileLayout}
- **Naming:** ${ds.componentStandards.naming}
${ds.componentStandards.propConventions.map((c) => `- ${c}`).join("\n")}

## Elevation & Borders
${ds.shadows && Object.values(ds.shadows).some((s) => s.value !== "none") ? "This design system includes shadow tokens for depth. Use shadow-[var(--shadow-*)] for elevated elements. Never combine shadows with borders on the same element." : "Hairline 1px borders using the border color token. No shadows."}

\`\`\`json tokens
${tokensJson}
\`\`\`

## Active Style Direction
${styleContext}`;
}

export function architectureToMarkdown(plan: ArchitecturePlan): string {
  const rows = plan.components
    .map((c) => `| ${c.name} | ${c.kind}${c.kind === "screen" ? ` (${c.ownerScreen})` : ""} | ${c.purpose} | ${c.usedBy.join(", ")} |`)
    .join("\n");
  return `# Architecture Plan

## File Structure
${plan.fileTree.map((path) => `- \`${path}\``).join("\n")}

## Component Ownership
| Component | Kind | Purpose | Used by |
|---|---|---|---|
${rows}

## Build Order
1. \`src/styles.css\` — design tokens (generated deterministically)
2. Layout components — ${plan.components.filter((c) => c.kind === "layout").map((c) => c.name).join(", ") || "none"}
3. Shared components — ${plan.components.filter((c) => c.kind === "shared").map((c) => c.name).join(", ") || "none"}
4. Screen-local components — ${plan.components.filter((c) => c.kind === "screen").map((c) => `${c.name} (${c.ownerScreen})`).join(", ") || "none"}
5. Screens — ${plan.screens.map((s) => s.name).join(", ")}
${plan.hooks?.length ? `\n## Hooks\n${plan.hooks.map((h) => `- **${h.name}:** ${h.purpose}`).join("\n")}` : ""}
${plan.lib?.length ? `\n## Utilities\n${plan.lib.map((l) => `- **${l.name}:** ${l.purpose}`).join("\n")}` : ""}
`;
}

export function componentContractsToMarkdown(components: ComponentContract[]): string {
  const sections = components.map((c) => `## ${c.name} (${c.kind}${c.kind === "screen" ? ` — ${c.ownerScreen}` : ""})
- **Purpose:** ${c.purpose}
- **Used by:** ${c.usedBy.join(", ")}
- **Tokens:** ${c.tokens.join(", ") || "—"}

### Props
${c.props.map((p) => `- **${p.name}** (\`${p.type}\`, default: \`${p.default}\`): ${p.description}`).join("\n")}

### Variants
${c.variants.map((v) => `- **${v.name}:** ${v.description}`).join("\n")}

### States
${c.states.length > 0 ? c.states.join(", ") : "default only"}`);
  return `# Component Specifications\n\n${sections.join("\n\n---\n\n")}`;
}

export function screenBlueprintToMarkdown(blueprint: ScreenBlueprint, specScreen?: SpecScreen): string {
  return `# Screen Spec — ${blueprint.name}

## Composition Intent
- **Purpose:** ${specScreen?.purpose ?? "Screen composition"}
- **User goal:** ${specScreen?.userGoal ?? "Complete the primary task"}
- **Layout chrome:** ${blueprint.layout ?? "none (self-contained screen)"}

${blueprint.sections
  .map(
    (section) => `## Section: ${section.name}
- **Pattern:** ${section.pattern}
- **Components:** ${section.components.join(", ") || "layout primitives only"}
${section.notes ? `- **Notes:** ${section.notes}\n` : ""}
### Copy
${section.copy.map((c) => `- \`${c}\``).join("\n") || "- Inherited from components"}`,
  )
  .join("\n\n")}

## Responsive Behavior
### Tablet
${blueprint.responsive.tablet}

### Mobile
${blueprint.responsive.mobile}`;
}

export function visualReviewToMarkdown(review: VisualReview, screenshotCount: number, skippedReason?: string): string {
  const issueRows = review.issues.length > 0
    ? review.issues.map((issue) => `| ${issue.screen} | ${issue.viewport} | ${issue.severity} | ${issue.target} | ${issue.issue} | ${issue.fix} |`).join("\n")
    : "| — | — | — | — | No visual issues reported | — |";
  return `# Visual QA Review

## Result
- Passed: ${review.passes ? "yes" : "no"}
- Screenshots reviewed: ${screenshotCount}
${skippedReason ? `- Visual renderer note: ${skippedReason}` : ""}

## Findings
| Screen | Viewport | Severity | Target | Issue | Recommended fix |
|---|---|---|---|---|---|
${issueRows}`;
}

// ── Compact representations for implementation prompts ─────────────────────

/** Compact token pack for implementer calls — ~15x smaller than the old design-system blob. */
export function formatTokensForImplementer(ds: DesignSystemSpec): string {
  return `DESIGN TOKENS (CSS custom properties, already defined in src/styles.css)
Colors: ${Object.keys(ds.tokens.colors).map((k) => `--color-${cssTokenName(k)}`).join(", ")}
Fonts: ${Object.keys(ds.tokens.fonts).map((k) => `--font-${cssTokenName(k)}`).join(", ")}
Sizes: ${Object.keys(ds.tokens.sizes).map((k) => `--size-${cssTokenName(k)}`).join(", ")}
Radius: ${Object.keys(ds.tokens.radius).map((k) => `--radius-${cssTokenName(k)}`).join(", ")}
Shadows: ${Object.keys(ds.tokens.shadows).map((k) => `--shadow-${cssTokenName(k)}`).join(", ")}
Motion: --motion-fast, --motion-base, --motion-ease
Spacing: base ${ds.spacing.base}px, section gap ${ds.spacing.sectionGap}px, container ${ds.spacing.containerWidth}px, gutter ${ds.spacing.gutter}px
Use tokens via Tailwind arbitrary values: bg-[var(--color-accent)], text-[var(--size-body)], rounded-[var(--radius-md)].
Display font on headlines: style={{ fontFamily: "var(--font-display)" }}. Body font is inherited.`;
}

/** Compact contract view of one component for implementer calls. */
export function formatContractForImplementer(contract: ComponentContract, path: string): string {
  return `COMPONENT CONTRACT: ${contract.name} (${contract.kind}${contract.kind === "screen" ? `, owner ${contract.ownerScreen}` : ""})
Path: ${path}
Purpose: ${contract.purpose}
Props: ${contract.props.map((p) => `${p.name}: ${p.type} (default ${p.default || "undefined"}) — ${p.description}`).join("; ")}
Variants: ${contract.variants.map((v) => `${v.name} — ${v.description}`).join("; ")}
States: ${contract.states.length > 0 ? contract.states.join(", ") : "default only"}
Tokens: ${contract.tokens.join(", ") || "standard set"}
Used by: ${contract.usedBy.join(", ")}`;
}

/** What a screen needs to know about a component it imports — contract only, no source. */
export function formatImportContract(contract: ComponentContract, importPath: string, canonicalPath?: string): string {
  const canonical = canonicalPath ? ` (canonical path: ${canonicalPath})` : "";
  return `${contract.name}: import ${contract.name} from "${importPath}"${canonical} — props [${contract.props.map((p) => `${p.name}: ${p.type}`).join(", ")}], variants [${contract.variants.map((v) => v.name).join(", ")}]. ${contract.purpose}`;
}
