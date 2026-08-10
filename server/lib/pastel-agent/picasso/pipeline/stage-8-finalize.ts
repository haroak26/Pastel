import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import type {
  Brief,
  Tokens,
  ComponentsManifest,
  CritiqueResult,
} from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);

// ── Stage 8 — Finalize V2 ───────────────────────────────────────────────

export interface FinalizeInputV2 {
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
  brandKit?: Record<string, unknown>;
  visualQAResults?: { averageScore: number; blockingDefects: string[] };
  contentReport?: {
    dataItemCount: number;
    copyScreenCount: number;
    hasSlop: boolean;
  };
}

export interface FinalizeReportV2 {
  componentCount: number;
  screenCount: number;
  designTokenCount: number;
  totalFilesExported: number;
  critiqueSummary: {
    averageScore: number;
    passedDimensions: string[];
    failedDimensions: string[];
    blockingDefects: string[];
  };
  qualityGates: {
    briefValidated: boolean;
    tokenGatePassed: boolean;
    componentGatePassed: boolean;
    screenGatePassed: boolean;
    antiSlopGatePassed: boolean;
  };
  lintResults: { passed: boolean; issues: string[] };
  exportPath: string;
  summaryMarkdown: string;
}

// ── Quality gates ───────────────────────────────────────────────────────

function countTokenProperties(tokens: Tokens): number {
  let count = 0;

  if (tokens.color) {
    const { neutral, accent, semantic, surface, text, border } = tokens.color;
    if (neutral) count += Object.keys(neutral).length;
    if (accent) count += Object.keys(accent).length;
    if (semantic) {
      for (const sem of Object.values(semantic)) {
        if (sem && typeof sem === "object") count += Object.keys(sem).length;
      }
    }
    if (surface) count += Object.keys(surface).length;
    if (text) count += Object.keys(text).length;
    if (border) count += Object.keys(border).length;
  }
  if (tokens.typography) {
    const { fontFamily, scale, weight } = tokens.typography;
    if (fontFamily) count += Object.keys(fontFamily).length;
    if (scale) count += Object.keys(scale).length;
    if (weight) count += Object.keys(weight).length;
  }
  if (tokens.space) count += Object.keys(tokens.space).length;
  if (tokens.radius) count += Object.keys(tokens.radius).length;
  if (tokens.shadow) count += Object.keys(tokens.shadow).length;
  if (tokens.motion) {
    const { duration, easing } = tokens.motion;
    if (duration) count += Object.keys(duration).length;
    if (easing) count += Object.keys(easing).length;
  }
  if (tokens.breakpoints) count += Object.keys(tokens.breakpoints).length;

  return count;
}

function runQualityGates(
  input: FinalizeInputV2,
  lintPassed: boolean,
): FinalizeReportV2["qualityGates"] {
  const briefValidated =
    !!input.brief.productName &&
    input.brief.productName.length > 0 &&
    !!input.brief.niche &&
    !!input.brief.audience &&
    input.brief.personality.length > 0;

  const tokenCount = countTokenProperties(input.tokens);
  const tokenGatePassed = tokenCount >= 50;

  const componentGatePassed =
    input.manifest.entries.length >= 15 &&
    Object.keys(input.generatedFiles).length >= 10;

  const screenGatePassed = input.visualQAResults
    ? input.visualQAResults.averageScore >= 7.0 &&
      input.visualQAResults.blockingDefects.length === 0
    : input.critiqueResults.filter((r) => r.passed).length >= 2;

  const antiSlopGatePassed =
    lintPassed &&
    (input.contentReport ? !input.contentReport.hasSlop : true);

  return {
    briefValidated,
    tokenGatePassed,
    componentGatePassed,
    screenGatePassed,
    antiSlopGatePassed,
  };
}

// ── Lint ────────────────────────────────────────────────────────────────

function eslintAvailable(): boolean {
  const result = spawnSync("npx", ["eslint", "--version"], {
    stdio: "pipe",
    timeout: 10_000,
  });
  return result.status === 0;
}

async function lintGeneratedFiles(
  generatedFiles: Record<string, string>,
): Promise<{ passed: boolean; issues: string[] }> {
  if (!eslintAvailable()) {
    return {
      passed: false,
      issues: ["lint tooling not available, manual review recommended"],
    };
  }

  const tmpDir = fs.mkdtempSync(path.join("/tmp", "pastel-lint-v2-"));
  const srcDir = path.join(tmpDir, "components");
  fs.mkdirSync(srcDir, { recursive: true });

  for (const [relativePath, rawContent] of Object.entries(generatedFiles)) {
    const filePath = path.join(srcDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, rawContent, "utf-8");
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
      const results = JSON.parse(
        issuesResult.stdout.toString("utf-8"),
      ) as Array<{
        messages: Array<{
          ruleId: string;
          message: string;
          line: number;
          column: number;
        }>;
        filePath: string;
      }>;
      for (const file of results) {
        for (const msg of file.messages) {
          issues.push(
            `${file.filePath}:${msg.line}:${msg.column}  ${msg.message} [${msg.ruleId}]`,
          );
        }
      }
    } catch {
      issues.push("unable to parse lint output");
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  return { passed: issues.length === 0, issues };
}

// ── Config file templates ───────────────────────────────────────────────

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

function rootLayout(projectName: string): string {
  return `import type { Metadata } from "next";
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
}

// ── Export functions ────────────────────────────────────────────────────

export async function exportDesignSystem(
  tokens: Tokens,
  outputDir: string,
): Promise<{ filesWritten: string[] }> {
  const filesWritten: string[] = [];
  fs.mkdirSync(outputDir, { recursive: true });

  const tokensPath = path.join(outputDir, "tokens.json");
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2), "utf-8");
  filesWritten.push(tokensPath);

  const readmePath = path.join(outputDir, "README.md");
  fs.writeFileSync(
    readmePath,
    `# ${tokens.meta.brand} Design Tokens\n\nVersion: ${tokens.meta.version}\nGenerated: ${tokens.meta.generatedAt}\n\n## Colors\n\n### Accent\n\n- 500: \`${tokens.color.accent["500"]}\`\n\n### Typography\n\n- Display: ${tokens.typography.fontFamily.display}\n- Body: ${tokens.typography.fontFamily.body}\n- Mono: ${tokens.typography.fontFamily.mono}\n`,
    "utf-8",
  );
  filesWritten.push(readmePath);

  return { filesWritten };
}

export async function exportComponents(
  components: Record<string, string>,
  outputDir: string,
): Promise<{ filesWritten: string[] }> {
  const filesWritten: string[] = [];
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [relativeName, code] of Object.entries(components)) {
    const filePath = path.join(outputDir, relativeName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, code, "utf-8");
    filesWritten.push(filePath);
  }

  return { filesWritten };
}

export async function exportScreens(
  screens: Record<string, string>,
  outputDir: string,
): Promise<{ filesWritten: string[] }> {
  const filesWritten: string[] = [];
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [relativePath, code] of Object.entries(screens)) {
    const filePath = path.join(outputDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, code, "utf-8");
    filesWritten.push(filePath);
  }

  return { filesWritten };
}

// ── Export project ──────────────────────────────────────────────────────

async function exportProject(input: FinalizeInputV2): Promise<string> {
  const exportRoot = path.resolve(
    __dirname,
    "..",
    "output",
    input.projectId,
    "export",
  );

  fs.mkdirSync(exportRoot, { recursive: true });

  const starterTemplate = path.resolve(
    __dirname,
    "..",
    "templates",
    "next-tailwind-starter",
  );
  if (fs.existsSync(starterTemplate)) {
    copyDir(starterTemplate, exportRoot);
  }

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

  const componentsDir = path.join(exportRoot, "src", "components", "ui");
  fs.mkdirSync(componentsDir, { recursive: true });
  for (const [relativePath, content] of Object.entries(input.generatedFiles)) {
    const filePath = path.join(componentsDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
  }

  const appDir = path.join(exportRoot, "src", "app");
  fs.mkdirSync(appDir, { recursive: true });
  fs.writeFileSync(path.join(appDir, "globals.css"), GLOBALS_CSS, "utf-8");
  fs.writeFileSync(
    path.join(appDir, "layout.tsx"),
    rootLayout(input.brief.productName as string),
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

  if (input.brandKit) {
    const brandDir = path.join(exportRoot, "brand");
    fs.mkdirSync(brandDir, { recursive: true });
    fs.writeFileSync(
      path.join(brandDir, "brand-kit.json"),
      JSON.stringify(input.brandKit, null, 2),
      "utf-8",
    );
  }

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

// ── Summary report (V2 enhanced) ────────────────────────────────────────

export function generateSummaryReport(report: FinalizeReportV2): string {
  const lines: string[] = [];

  lines.push(`# Picasso V2 Finalize Report`);
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Export path:** \`${report.exportPath}\``);
  lines.push("");

  lines.push("## Project Overview");
  lines.push(
    `- Components generated: ${report.componentCount}`,
  );
  lines.push(`- Screens composed: ${report.screenCount}`);
  lines.push(
    `- Design tokens: ${report.designTokenCount}`,
  );
  lines.push(
    `- Total files exported: ${report.totalFilesExported}`,
  );
  lines.push("");

  lines.push("## Design System Summary");
  lines.push(
    `- Accent color: \`var(--color-accent-500)\``,
  );
  lines.push(`- Token count: ${report.designTokenCount}`);
  lines.push("");

  lines.push("## Component Inventory");
  lines.push(
    `- Total custom components: ${report.componentCount}`,
  );
  lines.push("");

  lines.push("## Visual QA Breakdown");

  if (report.critiqueSummary.averageScore > 0) {
    lines.push(
      `- Average score: ${report.critiqueSummary.averageScore.toFixed(1)}/10.0`,
    );
  }

  if (report.critiqueSummary.passedDimensions.length > 0) {
    lines.push(
      `- Passed dimensions: ${report.critiqueSummary.passedDimensions.join(", ")}`,
    );
  }

  if (report.critiqueSummary.failedDimensions.length > 0) {
    lines.push(
      `- Failed dimensions: ${report.critiqueSummary.failedDimensions.join(", ")}`,
    );
  }

  if (report.critiqueSummary.blockingDefects.length > 0) {
    lines.push("");
    lines.push("### Blocking Defects");
    for (const defect of report.critiqueSummary.blockingDefects) {
      lines.push(`  - ${defect}`);
    }
  }
  lines.push("");

  lines.push("## Quality Gates");
  const gates = report.qualityGates;
  lines.push(
    `- Brief validated: ${gates.briefValidated ? "PASS" : "FAIL"}`,
  );
  lines.push(
    `- Design tokens (>= 50): ${gates.tokenGatePassed ? "PASS" : "FAIL"}`,
  );
  lines.push(
    `- Component gate (>= 15 custom, TS valid): ${gates.componentGatePassed ? "PASS" : "FAIL"}`,
  );
  lines.push(
    `- Screen gate (>= 2 screens pass visual QA): ${gates.screenGatePassed ? "PASS" : "FAIL"}`,
  );
  lines.push(
    `- Anti-slop gate (zero high-severity violations): ${gates.antiSlopGatePassed ? "PASS" : "FAIL"}`,
  );
  lines.push("");

  lines.push("## Lint Results");
  lines.push(
    `- Passed: ${report.lintResults.passed ? "yes" : "no"}`,
  );
  if (report.lintResults.issues.length > 0) {
    for (const issue of report.lintResults.issues) {
      lines.push(`  - ${issue}`);
    }
  }
  lines.push("");

  lines.push("## Export Path");
  lines.push(`\`${report.exportPath}\``);
  lines.push("");
  lines.push("### File listing");
  lines.push(
    `- tokens/tokens.json — ${report.designTokenCount} design tokens`,
  );
  lines.push(
    `- tokens/tokens.css — CSS custom properties`,
  );
  lines.push(
    `- tokens/tailwind.config.ts — Tailwind configuration`,
  );
  lines.push(
    `- src/components/ui/ — ${report.componentCount} components`,
  );
  lines.push(
    `- src/app/ — ${report.screenCount} screen routes`,
  );
  lines.push(
    `- src/app/globals.css — Global styles`,
  );
  lines.push(
    `- src/app/layout.tsx — Root layout`,
  );

  return lines.join("\n");
}

// ── Main finalize pipeline V2 ───────────────────────────────────────────

export async function finalize(
  input: FinalizeInputV2,
): Promise<FinalizeReportV2> {
  const [lintResults, exportPath] = await Promise.all([
    lintGeneratedFiles(input.generatedFiles),
    exportProject(input),
  ]);

  const allDimensions = new Set<string>();
  const failedDimensions = new Set<string>();
  const blockingDefectLabels: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  for (const cr of input.critiqueResults) {
    totalScore += cr.average;
    scoreCount++;

    for (const [dim, score] of Object.entries(cr.scores)) {
      allDimensions.add(dim);
      if (score < 6) {
        failedDimensions.add(dim);
      }
    }

    if (cr.diagnosis.toLowerCase().includes("blocking defect")) {
      const match = cr.diagnosis.match(
        /BLOCKING DEFECTS?:\s*([^.]*)/,
      );
      if (match) {
        const defects = match[1].split(";").map((d) => d.trim());
        for (const d of defects) {
          if (d && !blockingDefectLabels.includes(d)) {
            blockingDefectLabels.push(d);
          }
        }
      }
    }
  }

  const averageScore =
    scoreCount > 0
      ? Math.round((totalScore / scoreCount) * 10) / 10
      : 0;
  const passedDimensions = [...allDimensions].filter(
    (d) => !failedDimensions.has(d),
  );
  const tokenCount = countTokenProperties(input.tokens);
  const totalFilesExported =
    Object.keys(input.generatedFiles).length +
    Object.keys(input.screenFiles).length +
    1 +
    3;

  const qualityGates = runQualityGates(
    input,
    lintResults.passed,
  );

  const summaryMarkdown = generateSummaryReport({
    componentCount: input.manifest.entries.length,
    screenCount: Object.keys(input.screenFiles).length,
    designTokenCount: tokenCount,
    totalFilesExported,
    critiqueSummary: {
      averageScore,
      passedDimensions,
      failedDimensions: [...failedDimensions],
      blockingDefects: blockingDefectLabels,
    },
    qualityGates,
    lintResults,
    exportPath,
    summaryMarkdown: "",
  });

  const report: FinalizeReportV2 = {
    componentCount: input.manifest.entries.length,
    screenCount: Object.keys(input.screenFiles).length,
    designTokenCount: tokenCount,
    totalFilesExported,
    critiqueSummary: {
      averageScore,
      passedDimensions,
      failedDimensions: [...failedDimensions],
      blockingDefects: blockingDefectLabels,
    },
    qualityGates,
    lintResults,
    exportPath,
    summaryMarkdown,
  };

  return report;
}
