import test from "node:test";
import assert from "node:assert/strict";

import {
  baseComponentNames,
  loadBaseComponent,
  rewriteBaseImports,
  kebab,
  scanSiblingImports,
  closeDependencyGraph,
  supportFiles,
  fallbackMaxiTokens,
  maxiTokensSchema,
  tokensFromV6,
  generateGlobalsCSS,
  auditGlobalsCSS,
} from "../lib/maxi-agent/lib/base-components";

// ── Vendored base library ────────────────────────────────────────────────

test("base library: the vendored radix-nova catalog is present", () => {
  const names = baseComponentNames();
  assert.ok(names.length >= 50, `catalog has ${names.length} components`);
  for (const required of ["button", "card", "input", "select", "avatar", "badge", "dialog", "tabs", "sidebar"]) {
    assert.ok(names.includes(required), `${required} in the catalog`);
  }
});

test("base library: loadBaseComponent returns source + import structure", () => {
  const button = loadBaseComponent("button");
  assert.ok(button, "button loads");
  assert.ok(button!.source.length > 200, "has real source");
  assert.ok(button!.source.includes("export"), "has exports");
});

test("base library: unknown component returns null", () => {
  assert.equal(loadBaseComponent("does-not-exist"), null);
});

// ── Import rewriting (self-contained contract) ───────────────────────────

test("rewriteBaseImports: aliases become sibling imports", () => {
  const code = [
    'import { cn } from "@/lib/utils"',
    'import { Button } from "@/components/ui/button"',
    'import { useIsMobile } from "@/hooks/use-mobile"',
  ].join("\n");
  const rewritten = rewriteBaseImports(code);
  assert.ok(rewritten.includes('from "./cn"'), "utils → ./cn");
  assert.ok(rewritten.includes('from "./button"'), "ui/button → ./button");
  assert.ok(rewritten.includes('from "./use-mobile"'), "hooks/use-mobile → ./use-mobile");
  assert.ok(!rewritten.includes("@/"), "no alias imports remain");
});

test("kebab: PascalCase becomes kebab-case", () => {
  assert.equal(kebab("Button"), "button");
  assert.equal(kebab("AlertDialog"), "alert-dialog");
  assert.equal(kebab("SidebarProvider"), "sidebar-provider");
  assert.equal(kebab("TabsList"), "tabs-list");
});

// ── Dependency closure ───────────────────────────────────────────────────

test("scanSiblingImports: finds relative imports without extensions", () => {
  const code = [
    'import { cn } from "./cn"',
    'import { Button } from "./button"',
    'import { X } from "./tabs"',
    "export function Foo() {}",
  ].join("\n");
  assert.deepEqual(scanSiblingImports(code), ["cn", "button", "tabs"]);
});

test("closeDependencyGraph: provisions base files to close the sibling graph", () => {
  const components = {
    "product-button.jsx": `import { cn } from "./cn"\nimport { Tooltip } from "./tooltip"\nimport { Button } from "./button"\nexport function ProductButton() { return null }`,
  };
  const result = closeDependencyGraph(components, ["product-button"]);
  assert.ok(result.components["tooltip"], "tooltip provisioned from the base library");
  assert.ok(result.components["button"], "button provisioned from the base library");
  assert.ok(result.components["cn"] === undefined, "cn is a support file, not provisioned as a base");
  assert.ok(result.provisioned.includes("tooltip") && result.provisioned.includes("button"));
});

test("closeDependencyGraph: support siblings (cn, use-mobile) are never provisioned", () => {
  const components = {
    "x.jsx": `import { cn } from "./cn"\nimport { useIsMobile } from "./use-mobile"\nexport function X() { return null }`,
  };
  const result = closeDependencyGraph(components, ["x"]);
  assert.ok(!result.provisioned.includes("cn"));
  assert.ok(!result.provisioned.includes("use-mobile"));
  assert.equal(result.components["cn"], undefined);
});

test("closeDependencyGraph: unknown siblings are left unresolved (not invented)", () => {
  const components = {
    "x.jsx": `import { Something } from "./something-else"\nexport function X() { return null }`,
  };
  const result = closeDependencyGraph(components, ["x"]);
  assert.deepEqual(result.provisioned, []);
  assert.equal(result.components["something-else"], undefined);
});

test("closeDependencyGraph: already-generated siblings are never overwritten", () => {
  const components = {
    "x.jsx": `import { B } from "./b"\nexport function X() { return null }`,
    "b.jsx": `export function B() { return null } // custom version`,
  };
  const result = closeDependencyGraph(components, ["x"]);
  assert.equal(result.components["b.jsx"], components["b.jsx"], "custom file untouched");
  assert.deepEqual(result.provisioned, []);
});

test("supportFiles: cn + use-mobile are self-contained", () => {
  const files = supportFiles();
  assert.ok(files.cn.includes("twMerge"), "cn uses tailwind-merge");
  assert.ok(files["use-mobile"].includes("useIsMobile"));
});

// ── Tokens ───────────────────────────────────────────────────────────────

test("fallbackMaxiTokens: validates against the token schema", () => {
  const tokens = fallbackMaxiTokens("Test Brand");
  const parsed = maxiTokensSchema.parse(tokens);
  assert.equal(parsed.meta.brand, "Test Brand");
  assert.equal(parsed.meta.version, "1.0.0");
});

test("tokensFromV6: bridges run design tokens into MaxiTokens", () => {
  const tokens = tokensFromV6({
    brand: "Runnable",
    seed: "s1",
    tokens: {
      mode: "light",
      colors: {
        background: "#ffffff", foreground: "#111111", card: "#ffffff", popover: "#ffffff",
        primary: "#6d5dfc", primaryForeground: "#ffffff", secondary: "#f1f0ff",
        secondaryForeground: "#111111", muted: "#f4f4f5", mutedForeground: "#737373",
        accent: "#eef2ff", accentForeground: "#111111", destructive: "#ef4444",
        border: "#e4e4e7", input: "#e4e4e7", ring: "#6d5dfc",
      },
      radius: { sm: 6, md: 8, lg: 12, xl: 16 },
      typeScale: { base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36 },
      fonts: { display: "Inter", body: "Inter", mono: "JetBrains Mono" },
      sectionPaddingY: 64,
      sectionGap: 32,
    },
    visual: { typeVoice: "grotesque", cornerLanguage: "soft", surfaceTreatment: "hairline" },
  });
  const parsed = maxiTokensSchema.parse(tokens);
  assert.equal(parsed.meta.brand, "Runnable");
  assert.equal(parsed.color.text.primary, "#111111");
  assert.equal(parsed.radius.lg, "12px");
  assert.equal(parsed.typography.fontFamily.mono, "JetBrains Mono");
});

// ── Globals CSS audit (token coverage) ───────────────────────────────────

test("generateGlobalsCSS + auditGlobalsCSS: generated theme covers every base var", () => {
  const tokens = fallbackMaxiTokens("Audit Brand");
  const css = generateGlobalsCSS(tokens);
  assert.ok(css.includes("@import \"tailwindcss\""), "tailwind v4 import");
  assert.ok(css.includes("--primary:"), "primary slot declared");
  const audit = auditGlobalsCSS(css);
  assert.equal(audit.passed, true, `missing vars: ${audit.missing.join(", ")}`);
  assert.ok(audit.present.includes("primary"));
  assert.ok(audit.present.includes("chart-1"));
});
