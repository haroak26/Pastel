import { seedPermissions } from "../style-seeds";

/**
 * Anti-slop rule engine — deterministic detection of common AI-generated
 * design defects. High-severity violations trigger targeted repairs; medium
 * and low findings feed the design gate as structured context.
 */

export interface SlopViolation {
  ruleId: string;
  severity: "high" | "medium" | "low";
  message: string;
}

interface SlopRule {
  id: string;
  severity: SlopViolation["severity"];
  test(code: string): boolean; // true → violation
  message: string;
  /** rule only applies under this permission condition */
  when?: (perms: ReturnType<typeof seedPermissions>) => boolean;
}

const HAS_SHADOW = /box-shadow|shadow-(?!none\b)[a-z]/;
const HAS_GRADIENT = /(?:linear-gradient|radial-gradient|conic-gradient)|bg-gradient-/;
const HARDCODED_HEX = /#[0-9a-fA-F]{3,8}\b/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const GENERIC_CTA_PATTERN = /Get started free|Learn more|Sign up today|Try it now|Get started today/i;
const BANNED_VOCAB_PATTERN = /\b(seamless|seamlessly|cutting-edge|next-generation|revolutionary|empower|empowering|unlock|supercharge|elevate|streamline)\b/i;

const RULES: SlopRule[] = [
  {
    id: "shadow-not-permitted",
    severity: "high",
    when: (perms) => !perms.shadows,
    test: (code) => HAS_SHADOW.test(code),
    message: "box-shadow used but the active style seed does not permit shadows",
  },
  {
    id: "gradient-not-permitted",
    severity: "high",
    when: (perms) => !perms.gradients,
    test: (code) => HAS_GRADIENT.test(code),
    message: "gradient used but the active style seed does not permit gradients",
  },
  {
    id: "thick-border-not-permitted",
    severity: "high",
    when: (perms) => !perms.thickBorders,
    test: (code) => /(?:^|[\s"'])border-(?:2|4|8)\b|border-\[(?:2|3|4|8)px\]/.test(code),
    message: "thick border (border-2/4/8 or 2px+) used but the active style demands 1px hairlines only",
  },
  {
    id: "excessive-corner-radius",
    severity: "medium",
    test: (code) => /rounded-(?:2xl|3xl)\b|rounded-\[(?:2[5-9]|[3-9]\d)px\]/.test(code),
    message: "oversized corner radius (>24px) — enterprise surfaces use 4-16px radii",
  },
  {
    id: "rounded-shadow-card",
    severity: "medium",
    test: (code) => /rounded-(?:xl|2xl|3xl)[^\n]{0,100}shadow-/.test(code),
    message: "rounded card plus shadow pattern — prefer structural separation over decoration",
  },
  {
    id: "hardcoded-hex",
    severity: "high",
    test: (code) => HARDCODED_HEX.test(code.replace(/var\(--color-[a-z-]+\)?/g, "")),
    message: "hardcoded hex color detected — use CSS var tokens (--color-*)",
  },
  {
    id: "generic-cta",
    severity: "high",
    test: (code) => GENERIC_CTA_PATTERN.test(code),
    message: "generic CTA copy detected (e.g. \"Get started free\") — buttons must name the action",
  },
  {
    id: "lorem-ipsum",
    severity: "high",
    test: (code) => /lorem ipsum/i.test(code),
    message: "placeholder lorem ipsum copy detected",
  },
  {
    id: "banned-vocabulary",
    severity: "medium",
    test: (code) => BANNED_VOCAB_PATTERN.test(code),
    message: "banned marketing vocabulary detected (seamless, revolutionary, empower, …)",
  },
  {
    id: "emoji",
    severity: "medium",
    test: (code) => EMOJI.test(code),
    message: "emoji detected in interface copy — use inline SVG icons instead",
  },
  {
    id: "excessive-spacing",
    severity: "medium",
    test: (code) => /(?:^|[\s"'])p[xytrbl]?-(?:32|40|48)(?:[\s"'])/.test(code),
    message: "excessive Tailwind spacing utility (p-32/40/48) — check for dead space",
  },
  {
    id: "decorative-blur",
    severity: "medium",
    when: (perms) => !perms.gradients && !perms.shadows,
    test: (code) => /backdrop-blur|backdrop-filter|filter:\s*blur\(/.test(code),
    message: "decorative blur/glass effect without style-seed permission",
  },
  {
    id: "arbitrary-animation",
    severity: "low",
    test: (code) => /animate-(?:bounce|spin|ping|pulse)\b/.test(code),
    message: "stock Tailwind animation utility — motion must use design-system motion tokens",
  },
];

export function scanAntiSlop(code: string, seedName: string): SlopViolation[] {
  const perms = seedPermissions(seedName);
  const violations: SlopViolation[] = [];
  for (const rule of RULES) {
    if (rule.when && !rule.when(perms)) continue;
    if (rule.test(code)) {
      violations.push({ ruleId: rule.id, severity: rule.severity, message: rule.message });
    }
  }
  return violations;
}

export function hasHighSeveritySlop(violations: SlopViolation[]): boolean {
  return violations.some((v) => v.severity === "high");
}
