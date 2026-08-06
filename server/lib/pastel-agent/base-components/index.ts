import fs from "node:fs";
import path from "node:path";
import { pastelAssetRoot } from "../asset-paths";

/**
 * V6 base component library — the shared, proven adaptation source.
 *
 * These are reference implementations the builder ADAPTS per run (product-
 * specific props, variants, and company-flavored styling). They are never
 * shipped verbatim. Kept in sync with the SANDBOX_CONTRACT.
 */

export function baseComponentDir(): string {
  return path.join(pastelAssetRoot(), "base-components");
}

export function baseComponentNames(): string[] {
  const dir = baseComponentDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".jsx"))
    .map((f) => f.replace(/\.jsx$/, ""));
}

export function baseComponentCode(name: string): string | null {
  const p = path.join(baseComponentDir(), `${name}.jsx`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}
