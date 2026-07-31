import type { ArchitecturePlan, ComponentContract, ComponentKind, ProductSpec } from "../schemas/plan-schemas";
import type { Sitemap } from "../types";

/** Deterministic derivations — structure the models never get to invent. */

/** Strip annotations models add to component refs — "Card (highlighted)" → "Card". */
export function normalizeComponentRef(ref: string): string {
  return String(ref).replace(/\s*[([].*?[)\]].*$/, "").trim();
}

export function toPascalCase(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  const pascal = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return pascal || "Screen";
}

/** camelCase token key → kebab-case CSS custom property suffix (textMuted → text-muted). */
export function cssTokenName(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function screenDocPath(screenName: string): string {
  return `docs/screens/${screenName}.md`;
}

export function screenSourcePath(screenName: string): string {
  return `src/screens/${screenName}.jsx`;
}

export function screenBundlePath(screenName: string): string {
  return `.build/${screenName}.js`;
}

/**
 * Canonical source path for a registered component:
 *   shared → src/components/<Name>.jsx        (reusable across screens)
 *   layout → src/layouts/<Name>.jsx           (app chrome — nav shells, footers)
 *   screen → src/features/<Screen>/<Name>.jsx (owned by exactly one screen)
 */
export function pathForComponent(name: string, kind: ComponentKind, ownerScreen?: string | null): string {
  const pascal = toPascalCase(name);
  if (kind === "layout") return `src/layouts/${pascal}.jsx`;
  if (kind === "screen") return `src/features/${toPascalCase(ownerScreen ?? "Shared")}/${pascal}.jsx`;
  return `src/components/${pascal}.jsx`;
}

/** Relative import path from a file to a component (POSIX-style). */
export function relativeImport(fromPath: string, toPath: string): string {
  const fromDir = fromPath.split("/").slice(0, -1);
  const toParts = toPath.split("/");
  while (fromDir.length > 0 && toParts.length > 0 && fromDir[0] === toParts[0]) {
    fromDir.shift();
    toParts.shift();
  }
  const ups = fromDir.map(() => "..");
  return [...ups, ...toParts].join("/") || toParts.join("/");
}

/**
 * Shared components = candidates appearing on more than one screen.
 * Screen-local candidates belong to their owning screen only.
 */
export function deriveSharedComponents(spec: ProductSpec): string[] {
  const usage = new Map<string, number>();
  for (const screen of spec.screens) {
    for (const component of new Set(screen.components.map(toPascalCase))) {
      usage.set(component, (usage.get(component) ?? 0) + 1);
    }
  }
  return [...usage.entries()].filter(([, count]) => count >= 2).map(([name]) => name);
}

/** Flat sitemap view for prompts/manifests — computed, never model-authored. */
export function deriveSitemap(spec: ProductSpec): Sitemap {
  return {
    screens: spec.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      purpose: screen.purpose,
      sections: screen.sections.map((section) => section.name),
      components: screen.components.map(toPascalCase),
    })),
    components: deriveSharedComponents(spec),
  };
}

/** name → canonical path for every component in the architecture plan. */
export function componentPathMap(plan: ArchitecturePlan): Map<string, string> {
  const map = new Map<string, string>();
  for (const contract of plan.components) {
    map.set(toPascalCase(contract.name), pathForComponent(contract.name, contract.kind, contract.ownerScreen));
  }
  return map;
}

export function contractsRequiredByScreen(plan: ArchitecturePlan, screenName: string): ComponentContract[] {
  const blueprint = plan.screens.find((screen) => screen.name === screenName);
  if (!blueprint) return [];
  const wanted = new Set<string>([
    ...(blueprint.layout ? [blueprint.layout] : []),
    ...blueprint.sections.flatMap((section) => section.components),
  ].map(toPascalCase));
  return plan.components.filter((contract) => wanted.has(toPascalCase(contract.name)));
}

export interface ArchitectureIssue {
  message: string;
}

/**
 * Structural validation of an architecture plan — every reference must resolve,
 * every screen from the product spec must be planned, paths must be unique.
 */
export function validateArchitecture(plan: ArchitecturePlan, spec: ProductSpec): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const contractNames = new Set(plan.components.map((c) => toPascalCase(c.name)));
  if (contractNames.size !== plan.components.length) {
    issues.push({ message: "architecture contains duplicate component names" });
  }

  const specScreens = new Set(spec.screens.map((s) => s.name));
  const plannedScreens = new Set(plan.screens.map((s) => s.name));
  for (const name of specScreens) {
    if (!plannedScreens.has(name)) issues.push({ message: `product spec screen ${name} has no architecture blueprint` });
  }
  for (const name of plannedScreens) {
    if (!specScreens.has(name)) issues.push({ message: `blueprint ${name} is not in the product spec` });
  }

  const layoutNames = new Set(plan.components.filter((c) => c.kind === "layout").map((c) => toPascalCase(c.name)));
  for (const screen of plan.screens) {
    if (screen.layout && !layoutNames.has(screen.layout)) {
      issues.push({ message: `screen ${screen.name} references unknown layout ${screen.layout}` });
    }
    for (const section of screen.sections) {
      for (const ref of section.components) {
        if (!contractNames.has(toPascalCase(ref))) {
          issues.push({ message: `screen ${screen.name} section "${section.name}" references unknown component ${ref}` });
        }
      }
    }
  }

  for (const contract of plan.components) {
    for (const user of contract.usedBy) {
      if (!plannedScreens.has(toPascalCase(user)) && !contractNames.has(toPascalCase(user))) {
        issues.push({ message: `component ${contract.name}.usedBy references unknown screen/component ${user}` });
      }
    }
    if (contract.kind === "screen" && contract.ownerScreen && !plannedScreens.has(contract.ownerScreen)) {
      issues.push({ message: `component ${contract.name} is owned by unknown screen ${contract.ownerScreen}` });
    }
  }

  const paths = plan.components.map((c) => pathForComponent(c.name, c.kind, c.ownerScreen));
  if (new Set(paths).size !== paths.length) issues.push({ message: "architecture produces duplicate file paths" });

  return issues;
}
