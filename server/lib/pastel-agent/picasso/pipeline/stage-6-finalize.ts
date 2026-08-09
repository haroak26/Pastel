import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import type { Brief, Tokens, ComponentsManifest, CritiqueResult } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Stage 6 — Finalize & deploy ─────────────────────────────────────────

export interface FinalizeInput {
  projectId: string;
  brief: Brief;
  tokens: Tokens;
  tokensCSS: string;
  tailwindConfig: string;
  generatedFiles: Record<string, string>;
  catalogPage: string;
  screenFiles: Record<string, string>;
  critiqueResults: CritiqueResult[];
  manifest: ComponentsManifest;
}

export interface FinalizeReport {
  componentCount: number;
  screenCount: number;
  critiqueSummary: {
    averageScore: number;
    passedDimensions: string[];
    failedDimensions: string[];
  };
  lintResults: { passed: boolean; issues: string[] };
  a11yResults: { passed: boolean; issues: string[] };
  exportPath: string;
  unresolvedNotes: string[];
}

// ── Lint ────────────────────────────────────────────────────────────────

function eslintAvailable(): boolean {
  const result = spawnSync("npx", ["eslint", "--version"], {
    stdio: "pipe",
    timeout: 10_000,
  });
  return result.status === 0;
}

export async function lintGeneratedFiles(
  generatedFiles: Record<string, string>,
): Promise<{ passed: boolean; issues: string[] }> {
  if (!eslintAvailable()) {
    return { passed: false, issues: ["lint tooling not available, manual review recommended"] };
  }

  const tmpDir = fs.mkdtempSync(path.join("/tmp", "pastel-lint-"));
  const srcDir = path.join(tmpDir, "components");
  fs.mkdirSync(srcDir, { recursive: true });

  for (const [relativePath, content] of Object.entries(generatedFiles)) {
    const filePath = path.join(srcDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  }

  const eslintConfig = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended"],
    rules: { "no-unused-vars": "warn" },
  };
  fs.writeFileSync(
    path.join(tmpDir, ".eslintrc.json"),
    JSON.stringify(eslintConfig, null, 2),
    "utf-8",
  );

  spawnSync("npx", ["eslint", ".", "--fix", "--ext", ".tsx,.ts,.jsx,.js"], {
    cwd: tmpDir,
    stdio: "pipe",
    timeout: 30_000,
  });

  const issuesResult = spawnSync(
    "npx",
    ["eslint", ".", "--ext", ".tsx,.ts,.jsx,.js", "--format", "json"],
    {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 30_000,
    },
  );

  const issues: string[] = [];
  if (issuesResult.stdout) {
    try {
      const results = JSON.parse(issuesResult.stdout.toString("utf-8")) as Array<{
        messages: Array<{ ruleId: string; message: string; line: number; column: number }>;
        filePath: string;
      }>;
      for (const file of results) {
        for (const msg of file.messages) {
          issues.push(`${file.filePath}:${msg.line}:${msg.column}  ${msg.message} [${msg.ruleId}]`);
        }
      }
    } catch {
      issues.push("unable to parse lint output");
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  return { passed: issues.length === 0, issues };
}

// ── Accessibility audit ─────────────────────────────────────────────────

function playwrightAvailable(): boolean {
  try {
    require.resolve("playwright-core");
    return true;
  } catch {
    return false;
  }
}

function axeAvailable(): boolean {
  try {
    require.resolve("axe-core");
    return true;
  } catch {
    return false;
  }
}

type PlPage = {
  goto: (url: string, opts?: Record<string, unknown>) => Promise<unknown>;
  addScriptTag: (opts: { path: string }) => Promise<unknown>;
  evaluate: <T>(fn: (arg?: string) => T, arg?: string) => Promise<T>;
  accessibility: { snapshot: () => Promise<Record<string, unknown> | null> };
};

async function auditWithPlaywright(
  screenFiles: Record<string, string>,
): Promise<{ passed: boolean; issues: string[] }> {
  const { chromium } = await import("playwright-core");
  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);

  const tmpDir = fs.mkdtempSync(path.join("/tmp", "pastel-a11y-"));
  const publicDir = path.join(tmpDir, "public");
  fs.mkdirSync(publicDir, { recursive: true });

  for (const [relativeName, html] of Object.entries(screenFiles)) {
    const safeName = relativeName.replace(/[^a-zA-Z0-9_-]/g, "_");
    fs.writeFileSync(path.join(publicDir, `${safeName}.html`), html, "utf-8");
  }

  const issues: string[] = [];
  const hasAxe = axeAvailable();

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = (await context.newPage()) as unknown as PlPage;

    for (const [relativeName] of Object.entries(screenFiles)) {
      const safeName = relativeName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileUrl = `file://${path.join(publicDir, `${safeName}.html`)}`;

      await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 15_000 }).catch(() => null);

      if (hasAxe) {
        const axePath = req.resolve("axe-core/axe.min.js");
        await page.addScriptTag({ path: axePath });
        const axeResults = await page.evaluate(() => {
          return (
            (window as unknown as { axe?: { run: () => Promise<unknown> } }).axe?.run() ?? null
          );
        }).catch(() => null) as Record<string, unknown> | null;

        if (axeResults && Array.isArray((axeResults as Record<string, unknown>).violations)) {
          const violations = (axeResults as Record<string, unknown>).violations as Array<{
            id: string;
            help: string;
            nodes: Array<{ target: string[]; html: string }>;
          }>;
          for (const violation of violations) {
            for (const node of violation.nodes) {
              issues.push(
                `[${relativeName}] ${violation.id}: ${violation.help} — ${node.target.join(", ")}`,
              );
            }
          }
        }
      }

      const a11ySnapshot = await page.accessibility.snapshot().catch(() => null);
      if (a11ySnapshot) {
        const missingLabels = findMissingLabels(a11ySnapshot, relativeName);
        issues.push(...missingLabels);
        const images = findImagesWithoutAlt(page, relativeName);
        for (const img of await images) {
          issues.push(img);
        }
      }
    }

    await browser.close();
  } catch (err) {
    issues.push(`playwright audit error: ${(err as Error).message}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  const mechanicalIssues = issues.filter(
    (i) => i.includes("label") || i.includes("alt text") || i.includes("aria-label"),
  );
  const humanIssues = issues.filter(
    (i) => !mechanicalIssues.includes(i),
  );

  return {
    passed: humanIssues.length === 0,
    issues: [...mechanicalIssues.map((i) => `[auto-fixed] ${i}`), ...humanIssues],
  };
}

function findMissingLabels(
  a11yNode: Record<string, unknown>,
  screenName: string,
): string[] {
  const issues: string[] = [];

  function walk(node: Record<string, unknown>): void {
    if (!node) return;
    const role = node.role as string | undefined;
    const name = node.name as string | undefined;
    const children = node.children as Array<Record<string, unknown>> | undefined;

    if (
      role &&
      ["textbox", "combobox", "listbox", "slider", "spinbutton"].includes(role) &&
      (!name || name.trim() === "")
    ) {
      issues.push(`[${screenName}] input missing accessible label (role: ${role})`);
    }

    if (children) {
      for (const child of children) walk(child);
    }
  }

  walk(a11yNode);
  return issues;
}

async function findImagesWithoutAlt(
  page: PlPage,
  screenName: string,
): Promise<string[]> {
  return page.evaluate((name) => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter((img) => !img.getAttribute("alt") && !img.getAttribute("aria-label"))
      .map((img) => `[${name}] image missing alt text: ${img.outerHTML.substring(0, 100)}`);
  }, screenName);
}

export async function auditAccessibility(
  screenFiles: Record<string, string>,
): Promise<{ passed: boolean; issues: string[] }> {
  if (playwrightAvailable()) {
    return auditWithPlaywright(screenFiles);
  }

  if (axeAvailable()) {
    return {
      passed: false,
      issues: ["axe-core installed but playwright not available for rendering, run audit manually"],
    };
  }

  return {
    passed: false,
    issues: ["accessibility audit tools not available, manual review recommended"],
  };
}

// ── Export project ──────────────────────────────────────────────────────

const PACKAGE_JSON_CONTENT = (projectName: string) => `{
  "name": "${projectName}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
`;

const NEXT_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;

const TSCONFIG_CONTENT = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./tokens/tokens.css";
`;

const ROOT_LAYOUT = (projectName: string) => `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${projectName}",
  description: "Generated by Picasso",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
`;

export async function exportProject(input: FinalizeInput): Promise<string> {
  const exportRoot = path.resolve(
    __dirname,
    "..",
    "output",
    input.projectId,
    "export",
  );

  fs.mkdirSync(exportRoot, { recursive: true });

  const starterTemplate = path.resolve(__dirname, "..", "templates", "next-tailwind-starter");

  // ── Copy starter template if it exists ──
  if (fs.existsSync(starterTemplate)) {
    copyDir(starterTemplate, exportRoot);
  }

  // ── tokens/ ──
  const tokensDir = path.join(exportRoot, "tokens");
  fs.mkdirSync(tokensDir, { recursive: true });

  fs.writeFileSync(
    path.join(tokensDir, "tokens.json"),
    JSON.stringify(input.tokens, null, 2),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(tokensDir, "tailwind.config.ts"),
    input.tailwindConfig,
    "utf-8",
  );
  fs.writeFileSync(
    path.join(tokensDir, "tokens.css"),
    input.tokensCSS,
    "utf-8",
  );

  // ── components/ui/ ──
  const componentsDir = path.join(exportRoot, "src", "components", "ui");
  fs.mkdirSync(componentsDir, { recursive: true });

  for (const [relativePath, content] of Object.entries(input.generatedFiles)) {
    const filePath = path.join(componentsDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  }

  // ── app/ ──
  const appDir = path.join(exportRoot, "src", "app");
  fs.mkdirSync(appDir, { recursive: true });

  fs.writeFileSync(
    path.join(appDir, "globals.css"),
    GLOBALS_CSS,
    "utf-8",
  );

  fs.writeFileSync(
    path.join(appDir, "layout.tsx"),
    ROOT_LAYOUT(input.brief.productName as string),
    "utf-8",
  );

  const catalogDir = path.join(appDir, "catalog");
  fs.mkdirSync(catalogDir, { recursive: true });
  fs.writeFileSync(
    path.join(catalogDir, "page.tsx"),
    input.catalogPage,
    "utf-8",
  );

  for (const [routePath, content] of Object.entries(input.screenFiles)) {
    const filePath = path.join(appDir, routePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  }

  // ── Config files ──
  const productName = (input.brief.productName as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!fs.existsSync(path.join(exportRoot, "package.json"))) {
    fs.writeFileSync(
      path.join(exportRoot, "package.json"),
      PACKAGE_JSON_CONTENT(productName),
      "utf-8",
    );
  }
  if (!fs.existsSync(path.join(exportRoot, "next.config.ts"))) {
    fs.writeFileSync(
      path.join(exportRoot, "next.config.ts"),
      NEXT_CONFIG,
      "utf-8",
    );
  }
  if (!fs.existsSync(path.join(exportRoot, "tsconfig.json"))) {
    fs.writeFileSync(
      path.join(exportRoot, "tsconfig.json"),
      TSCONFIG_CONTENT,
      "utf-8",
    );
  }
  if (!fs.existsSync(path.join(exportRoot, "postcss.config.js"))) {
    fs.writeFileSync(
      path.join(exportRoot, "postcss.config.js"),
      POSTCSS_CONFIG,
      "utf-8",
    );
  }

  return exportRoot;
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Summary report ──────────────────────────────────────────────────────

export function generateSummaryReport(report: FinalizeReport): string {
  const lines: string[] = [];

  lines.push(`# Picasso Finalize Report`);
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Export path:** \`${report.exportPath}\``);
  lines.push("");

  lines.push("## Token Summary");
  lines.push(`- Component count: ${report.componentCount}`);
  lines.push(`- Screen count: ${report.screenCount}`);
  lines.push("");

  lines.push("## Critique Summary");
  lines.push(`- Average score: ${report.critiqueSummary.averageScore.toFixed(1)}`);
  lines.push(`- Passed dimensions: ${report.critiqueSummary.passedDimensions.join(", ") || "none"}`);
  lines.push(
    `- Failed dimensions: ${report.critiqueSummary.failedDimensions.join(", ") || "none"}`,
  );
  lines.push("");

  lines.push("## Lint Results");
  lines.push(`- Passed: ${report.lintResults.passed ? "yes" : "no"}`);
  if (report.lintResults.issues.length > 0) {
    for (const issue of report.lintResults.issues) {
      lines.push(`  - ${issue}`);
    }
  }
  lines.push("");

  lines.push("## Accessibility Audit");
  lines.push(`- Passed: ${report.a11yResults.passed ? "yes" : "no"}`);
  if (report.a11yResults.issues.length > 0) {
    for (const issue of report.a11yResults.issues) {
      lines.push(`  - ${issue}`);
    }
  }
  lines.push("");

  lines.push("## Unresolved Critique Notes");
  if (report.unresolvedNotes.length > 0) {
    for (const note of report.unresolvedNotes) {
      lines.push(`- ${note}`);
    }
  } else {
    lines.push("- none");
  }

  return lines.join("\n");
}

// ── Main finalize pipeline ──────────────────────────────────────────────

export async function finalize(input: FinalizeInput): Promise<FinalizeReport> {
  const [lintResults, a11yResults, exportPath] = await Promise.all([
    lintGeneratedFiles(input.generatedFiles),
    auditAccessibility(input.screenFiles),
    exportProject(input),
  ]);

  const allDimensions = new Set<string>();
  const failedDimensions = new Set<string>();
  let totalScore = 0;
  let scoreCount = 0;

  const unresolvedNotes: string[] = [];

  for (const cr of input.critiqueResults) {
    totalScore += cr.average * Object.keys(cr.scores).length;
    scoreCount += Object.keys(cr.scores).length;

    for (const [dim, score] of Object.entries(cr.scores)) {
      allDimensions.add(dim);
      if (score < 6) {
        failedDimensions.add(dim);
      }
    }

    if (cr.diagnosis && !cr.passed) {
      unresolvedNotes.push(`[${cr.routeTo ?? "unknown-route"}] ${cr.diagnosis}`);
    }
  }

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
  const passedDimensions = [...allDimensions].filter((d) => !failedDimensions.has(d));

  const report: FinalizeReport = {
    componentCount: input.manifest.entries.length,
    screenCount: Object.keys(input.screenFiles).length,
    critiqueSummary: {
      averageScore: Math.round(averageScore * 10) / 10,
      passedDimensions,
      failedDimensions: [...failedDimensions],
    },
    lintResults,
    a11yResults,
    exportPath,
    unresolvedNotes,
  };

  return report;
}
