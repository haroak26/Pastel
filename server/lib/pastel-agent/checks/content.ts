import type { MockDataset } from "../lib/content";
import type { GateIssue } from "./audit";

/**
 * V7 deterministic CONTENT gate — $0, mechanical, file-targeted.
 *
 * Catches the v6 failure mode where finance/B2B content leaked into
 * non-finance products (a fitness app shipping "$22,091" invoices and
 * "Aperture AI"), plus the component-size and composition-quality issues:
 * duplicate stat labels, page-scale blocks inside components, card overload,
 * chip-group filter overload, and broken "+-" delta strings.
 */

/** Content that is only legitimate for financial/shopping domains. */
const FINANCE_ONLY = [
  /\$\s*\d[\d,.]*/,          // "$22,091" — currency amounts
  /\bMRR\b/i,                // "Monthly recurring revenue"
  /\brevenue\b/i,
  /\binvoice(s)?\b/i,
  /\bbilling\b/i,
  /\bpayment method\b/i,
  /\bVISA\b/,
  /\bDanger zone\b/i,
  /\bseats\b/i,
  /\bchurn\b/i,
  /\bworkspace\b/i,          // B2B workspace language
  /\bdeployed to production\b/i,
  /\bmerged a pull request\b/i,
];

/** Strings that are ALWAYS wrong, in any domain. */
const ALWAYS_WRONG = [
  /\bAperture AI\b/,
  /\bOrbit Finance\b/,
  /\bHarbor & Co\b/,
  /\bVantage Systems\b/,
  /\bBluepoint\b/,
  /\bKepler Health\b/,
  /\bNorthwind Labs\b/,
  /\bINV-\d+\b/,
];

/** Words that legitimately repeat in navigation/actions — not duplicates. */
const COMMON_REPEATS = new Set([
  "home", "browse", "account", "profile", "settings", "detail", "search", "filter", "filters",
  "add", "save", "edit", "cancel", "back", "continue", "start", "get started", "learn more",
  "sign in", "sign up", "log in", "view all", "see all", "apply", "send", "share", "submit",
  "status", "date", "active", "done", "pending", "all", "new", "open", "close", "more",
  "select", "choose", "update", "invite", "email", "delete", "remove", "enable", "disable",
  "weekly", "monthly", "today", "this week", "vs last week", "total", "live", "ready",
]);

/** Page-scale patterns that must NEVER appear inside a component file. */
const PAGE_SCALE_IN_COMPONENT = [
  /min-h-screen/,
  /fixed\s+bottom-0/,
  /max-w-3xl/,
  /\bp-12\b/,
  /\bp-16\b/,
  /\btext-5xl\b/,
  /\btext-4xl\b/,
];

/** Hardcoded zero sample values rendered as data (v7 issue #2 — the four
 * "0.0 km / 0 min" tiles). Values are allowed in logic (slice(0, 4), len 0),
 * in attributes (aria-valuemin={0}), but never as rendered JSX text or
 * expressions. */
const HARDCODED_ZEROS = [
  />\s*0(?:\.0)?\s*(?:km|mi|m|min|kcal|cal|hrs?|hours?|days?|steps?|count|kg|lb)\b\s*</i,
  /(?<!=)\{0(?:\.\d+)?\}\s*(?:km|mi|m|min|kcal|cal|hrs?|hours?|days?|steps?|count|kg|lb)?/i,
  />\s*0\.0\s*</,
];

/** Developer/spec notes leaking as UI copy (v7 issue #5 — "Recent run log
 * rows: Easy 5K, …"). Matched in quoted strings and JSX text nodes. */
const SPEC_NOTE = [
  /\b(?:rows?|tiles?|cards?|blocks?|items?|screens?|steps?)\s*(?:with|including|containing)\b/i,
  /\b(?:rows|tiles|cards|blocks|items)\s*[:—]/i,
  /\b(?:list|array|slice)\s+of\b/i,
];

/** Mangled/hardcoded units inside components (v7 issue #1) — units must come
 * from props, never hardcoded as "min/km" / "min·km". */
const HARDCODED_UNIT = /\b(?:min·km|minkm|min\/km|·km)\b/i;

/** Blank sections — an empty <section> renders as a floating gap. */
const BLANK_SECTION = /<section[^>]*>\s*<\/section>/;

/** A screen full of outline buttons reads as scaffolding, not product. */
const OUTLINE_OVERLOAD = 4;

/** Domains where prices/currency/booking are legitimate product content. */
const FINANCE_DOMAINS = new Set(["finance", "ecommerce", "travel", "rentals"]);

/** V21: the base-component library is gone — nothing is "materialized from a
 * base file" anymore. Kept as a no-op hook so the audit call sites stay
 * stable; every component is builder-authored per run. */
function isMaterializedPrimitive(_path: string, _content: string): boolean {
  return false;
}

function isScreen(path: string): boolean {
  return path.startsWith("src/screens/");
}

/** Distinct short text tokens used as labels/text nodes, per file. */
function repeatedText(content: string): string[] {
  const counts = new Map<string, number>();
  for (const m of content.matchAll(/(?:label|title|placeholder|aria-label)=["']([^"']{3,40})["']/g)) {
    const v = m[1].toLowerCase().trim();
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  for (const m of content.matchAll(/>([A-Za-z][A-Za-z0-9 /'’.-]{2,40})<\//g)) {
    const v = m[1].toLowerCase().trim();
    if (counts.has(v)) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const out: string[] = [];
  for (const [v, n] of counts) {
    if (n >= 4 && !COMMON_REPEATS.has(v)) out.push(v);
  }
  return out;
}

export function auditContent(data: MockDataset, files: Record<string, string>): GateIssue[] {
  const issues: GateIssue[] = [];
  const financeLegit = FINANCE_DOMAINS.has(data.domain);

  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith(".jsx")) continue;
    if (path === "src/data.js") continue;
    const isComponent = path.startsWith("src/components/");
    if (isComponent && isMaterializedPrimitive(path, content)) continue;

    // 1. Finance/domain mismatch (the v6 Aperture-AI-in-a-fitness-app bug).
    if (!financeLegit) {
      for (const re of FINANCE_ONLY) {
        // V14: "workspace" is legitimate product language for a workspace
        // product — the B2B guard only applies to non-productivity domains.
        if (re.source === "\\bworkspace\\b" && data.domain === "productivity") continue;
        if (re.test(content)) {
          issues.push({
            file: path,
            severity: "high",
            category: "content",
            description: `Off-domain content "${re.source}" in a ${data.domain} product — replace with product-relevant data/copy.`,
          });
          break;
        }
      }
    }
    for (const re of ALWAYS_WRONG) {
      if (re.test(content)) {
        issues.push({
          file: path,
          severity: "high",
          category: "content",
          description: `Demo/SaaS content "${re.source}" — replace with this product's own data.`,
        });
        break;
      }
    }

    // 1b. V10 cross-screen integrity — a screen reads ONLY its own scoped
    // view (DATA.screens.<id>). Bare global references (DATA.rows, metrics,
    // reviews, summary…) mean one screen is rendering another's content —
    // the "catalog grid on the detail page" class of bug.
    if (isScreen(path)) {
      const leak = content.match(/\bDATA\.(?!(?:screens|copy|productTitle|productType|description|domain|people)\b)\w+/g);
      if (leak && leak.length > 0) {
        issues.push({
          file: path,
          severity: "high",
          category: "content",
          description: `Cross-screen data leak: screen references ${leak.slice(0, 4).join(", ")} (global DATA) — every screen must read ONLY its own DATA.screens.<id> view.`,
        });
      }
    }

    // 2. Broken "+-" delta strings.
    if (/\+-\s*\d/.test(content)) {
      issues.push({
        file: path,
        severity: "high",
        category: "content",
        description: `Broken delta string "+-X%" — format deltas once (signed helper), never concat "+" with a signed number.`,
      });
    }

    // 3. Component size budget — no page-scale blocks inside components.
    if (isComponent) {
      for (const re of PAGE_SCALE_IN_COMPONENT) {
        if (re.test(content)) {
          issues.push({
            file: path,
            severity: "high",
            category: "content",
            description: `Page-scale block (${re.source}) inside a component — components are building blocks, never full pages.`,
          });
          break;
        }
      }
    }

    // 3b. Hardcoded zero sample values rendered as data (v8 — zero tiles).
    if (isComponent || isScreen(path)) {
      for (const re of HARDCODED_ZEROS) {
        if (re.test(content)) {
          issues.push({
            file: path,
            severity: "high",
            category: "content",
            description: `Hardcoded zero sample value (${re.source}) rendered as data — render every value slot from props/DATA, never zero literals.`,
          });
          break;
        }
      }
    }

    // 3c. Developer/spec notes leaking as UI copy (v8 — "rows with …").
    for (const re of SPEC_NOTE) {
      if (re.test(content)) {
        issues.push({
          file: path,
          severity: "high",
          category: "content",
          description: `Spec-note pattern (${re.source}) shipped as UI copy — replace with specific product copy.`,
        });
        break;
      }
    }

    // 3d. Hardcoded/mangled units inside components (v8 — "min·km").
    if (isComponent && HARDCODED_UNIT.test(content)) {
      issues.push({
        file: path,
        severity: "medium",
        category: "content",
        description: `Hardcoded unit (${HARDCODED_UNIT.source}) — render units from props/DATA, never hardcode them.`,
      });
    }

    // 3e. Blank sections (v8 — floating gaps).
    if (!isComponent && BLANK_SECTION.test(content)) {
      issues.push({
        file: path,
        severity: "high",
        category: "content",
        description: "Empty <section> element — a blank section renders as a floating gap; remove it or fill it with content.",
      });
    }

    // 4. Card overload — cap card surfaces per screen. Composed screens use
    // the <Card> component, so count tags (the literal-class count below
    // only catches raw divs). V9 budgets: home ≤ 8 (the 6-card product grid
    // + the scoreboard moment), detail ≤ 3 (the ONE summary card).
    if (!isComponent) {
      const cards = (content.match(/rounded-xl\s+border\s+bg-card/g) ?? []).length;
      if (cards > 4) {
        issues.push({
          file: path,
          severity: "medium",
          category: "anti-slop",
          description: `Card overload (${cards} card surfaces) — prefer divided rows and plain sections; keep ≤ 4 card surfaces per screen.`,
        });
      }

      // 4b. V9 archetype-aware budget via <Card> tags. Composed screens emit
      // one literal per card cluster (the grid is ONE literal inside a map),
      // so budgets are tight: home = grid + scoreboard moment ≤ 4; detail =
      // the single summary card ≤ 3.
      const cardTags = (content.match(/<Card\b/g) ?? []).length;
      const isDetailScreen = /lg:sticky/.test(content);
      const cardBudget = isDetailScreen ? 3 : 4;
      if (cardTags > cardBudget) {
        issues.push({
          file: path,
          severity: "medium",
          category: "anti-slop",
          description: `Card overload (${cardTags} card clusters on a ${isDetailScreen ? "detail" : "home"} screen) — the product grid and the single summary card are the only card clusters; render stats/charts/reviews as bands and divided rows.`,
        });
      }

      // 5. Chip-group filter overload — UX simplification: use a Select.
      const chips = (content.match(/rounded-full\s+border\s+px-3\.5\s+py-1\.5/g) ?? []).length;
      if (chips > 6) {
        issues.push({
          file: path,
          severity: "medium",
          category: "ux",
          description: `Filter chip group (${chips} chips) is too complex — use a single Select dropdown instead.`,
        });
      }

      // 5b. Outline-button overload — scaffolding reads as unfinished.
      const outlines = (content.match(/variant="outline"/g) ?? []).length;
      if (outlines > OUTLINE_OVERLOAD) {
        issues.push({
          file: path,
          severity: "medium",
          category: "anti-slop",
          description: `Outline-button overload (${outlines}) — secondary actions are text links or small filled buttons; keep at most a few outline buttons.`,
        });
      }
    }

    // 6. Repeated labels in screens/components (the 4x "Distance" stat bug).
    const repeats = repeatedText(content);
    for (const v of repeats) {
      issues.push({
        file: path,
        severity: "high",
        category: "content",
        description: `Label/text "${v}" repeated 4+ times in one file — every stat/variant renders a DISTINCT label from props/data.`,
      });
    }

    // 7. Double border on inputs.
    if (/\bborder-2\b/.test(content)) {
      issues.push({
        file: path,
        severity: "low",
        category: "polish",
        description: `Double border (border-2) on an input — use a single 1px border; the focus ring provides emphasis.`,
      });
    }
  }

  return issues;
}
