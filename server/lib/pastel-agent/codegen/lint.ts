import type { ArchitecturePlan } from "../schemas/plan-schemas";
import { componentPathMap, screenSourcePath, toPascalCase } from "./derive";
import type { SandboxError } from "../sandbox";

/**
 * Deterministic static lint over generated artifacts — catches the failures
 * that used to burn sandbox+model fix rounds, before any model call happens.
 */

export interface LintIssue {
  path: string;
  message: string;
  severity: "high" | "medium";
}

const RELATIVE_IMPORT_MISSING_EXT = /from\s+["'](\.[^"']+)["']/g;
const ALLOWED_BARE_IMPORTS = /^react(-dom)?(\/.*)?$/;

/** Per-artifact lint, run immediately after generation. */
export function lintGeneratedFile(path: string, content: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const isJs = path.endsWith(".jsx") || path.endsWith(".js");
  if (!isJs) return issues;

  if (/import React\b/.test(content)) {
    issues.push({ path, severity: "medium", message: "unnecessary React import (JSX automatic runtime)" });
  }

  for (const match of content.matchAll(RELATIVE_IMPORT_MISSING_EXT)) {
    const imp = match[1];
    if (!imp.endsWith(".jsx") && !imp.endsWith(".js") && !imp.endsWith(".css")) {
      issues.push({ path, severity: "high", message: `import "${imp}" is missing its file extension` });
    }
  }

  for (const match of content.matchAll(/from\s+["']([^."'][^"']*)["']/g)) {
    const imp = match[1];
    if (!ALLOWED_BARE_IMPORTS.test(imp)) {
      issues.push({ path, severity: "high", message: `external package "${imp}" is not available in the sandbox (only react/react-dom)` });
    }
  }

  // TypeScript syntax leaking into .jsx — historically the most common failure.
  if (/\binterface\s+\w+\s*\{/.test(content) || /\)\s*:\s*(string|number|boolean|ReactNode|JSX)/.test(content)) {
    issues.push({ path, severity: "high", message: "TypeScript syntax in a .jsx file (interfaces / type annotations are not allowed)" });
  }

  const isComponentFile = /^src\/(components|layouts|features)\//.test(path);
  const isScreenFile = /^src\/screens\//.test(path);
  if (isComponentFile || isScreenFile) {
    if (!/export\s+default\s+(function|class|const)/.test(content) && !/export\s*\{\s*\w+\s+as\s+default\s*\}/.test(content)) {
      issues.push({ path, severity: "high", message: "missing default export" });
    }
  }

  return issues;
}

/** Contract conformance for a single component artifact. */
export function lintComponentContract(path: string, content: string, componentName: string): LintIssue[] {
  const issues = lintGeneratedFile(path, content);
  const pascal = toPascalCase(componentName);
  if (!new RegExp(`export\\s+default\\s+function\\s+${pascal}\\b`).test(content)
    && !new RegExp(`const\\s+${pascal}\\s*=`).test(content)) {
    issues.push({ path, severity: "high", message: `component must define and default-export ${pascal}` });
  }
  return issues;
}

/**
 * Screen conformance: every contract component the blueprint references must
 * be imported from its canonical registry path, and never re-implemented inline.
 */
export function lintScreenAgainstRegistry(
  screenName: string,
  content: string,
  plan: ArchitecturePlan,
): LintIssue[] {
  const screenPath = screenSourcePath(screenName);
  const issues = lintGeneratedFile(screenPath, content);
  const paths = componentPathMap(plan);

  const blueprint = plan.screens.find((screen) => screen.name === screenName);
  if (!blueprint) return issues;
  const required = new Set<string>([
    ...(blueprint.layout ? [blueprint.layout] : []),
    ...blueprint.sections.flatMap((section) => section.components),
  ].map(toPascalCase));

  for (const name of required) {
    const target = paths.get(name);
    if (!target) {
      issues.push({ path: screenPath, severity: "high", message: `blueprint references ${name}, which is not in the architecture plan` });
      continue;
    }
    const targetNoExt = target.replace(/\.jsx$/, "").split("/").pop()!;
    const importPattern = new RegExp(`import\\s+${targetNoExt}\\s+from\\s+["'][^"']*${name}\\.jsx["']`);
    if (!importPattern.test(content)) {
      issues.push({ path: screenPath, severity: "high", message: `screen must import shared component ${target} instead of recreating it inline` });
    }
    // inline re-definition of a shared component (e.g. `function Navbar(` in the screen file)
    if (new RegExp(`function\\s+${name}\\s*\\(`).test(content)) {
      issues.push({ path: screenPath, severity: "high", message: `screen re-defines component ${name} inline — import it from ${target}` });
    }
  }
  return issues;
}

/**
 * Project-wide import contract — the sandbox-level guarantee that screens use
 * registry components. Ported from the v1 componentImportErrors check.
 */
export function projectContractErrors(
  files: Record<string, string>,
  plan: ArchitecturePlan,
): SandboxError[] {
  const errors: SandboxError[] = [];
  const paths = componentPathMap(plan);

  for (const screen of plan.screens) {
    const screenPath = screenSourcePath(screen.name);
    const content = files[screenPath];
    if (!content) continue;

    const required = new Set<string>([
      ...(screen.layout ? [screen.layout] : []),
      ...screen.sections.flatMap((section) => section.components),
    ].map(toPascalCase));

    for (const name of required) {
      const componentPath = paths.get(name);
      if (!componentPath) continue;
      if (!files[componentPath]) {
        errors.push({ file: screenPath, message: `Missing planned shared component ${componentPath}` });
        continue;
      }
      const importPattern = new RegExp(`import\\s+${name}\\s+from\\s+["'][^"']*${name}\\.jsx["']`);
      if (!importPattern.test(content)) {
        errors.push({ file: screenPath, message: `${screenPath} must import shared component ${componentPath} instead of recreating it inline` });
      }
    }
  }
  return errors;
}
