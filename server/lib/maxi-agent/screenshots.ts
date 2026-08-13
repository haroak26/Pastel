/**
 * Maxi Agent v23 — screenshot capture, sandboxed.
 *
 * Every render runs inside the e2b sandbox (lib/sandbox-render.ts) against
 * the template-baked Chromium. The old local-unsandboxed-Chromium path is
 * gone: generated code never executes on the app server.
 *
 * Availability is best-effort: if e2b is not configured, capture resolves to
 * an empty result and the pipeline falls back to code-only review.
 */

import { renderScreenInSandbox } from "./lib/sandbox-render";
import type { GeometryReport } from "./lib/sandbox-render";

export interface CapturedScreenshot {
  /** screen name (bundle key) */
  name: string;
  /** data:image/png;base64,... */
  dataUrl: string;
}

export interface CapturedScreenRender {
  screenshot: CapturedScreenshot;
  geometry: GeometryReport | null;
  errors: string[];
}

export interface CaptureResult {
  screenshots: CapturedScreenshot[];
  /** Per-screen DOM-geometry reports from the sandboxed render. */
  geometryReports: Record<string, GeometryReport>;
  /** Why capture produced nothing (for activity logging). */
  reason?: string;
}

const MAX_SHOT_BYTES = 1_500_000; // keep vision prompts sane
const MAX_SCREENS = 8;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Shared preview HTML builder (sandboxed screenshots + preview route). */
export function buildPreviewHtml(screen: string, bundle: string, styles: string, fonts: string[]): string {
  const fontLinks = [...new Set(fonts)]
    .filter((f) => /^[a-zA-Z0-9 ]+$/.test(f))
    .map((f) => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(screen)}</title>
${fontLinks}
<script src="https://cdn.tailwindcss.com"></script>
<style>
${styles}
html, body { height: 100%; }
</style>
</head>
<body>
<div id="root"></div>
<script>
${bundle}
</script>
</body>
</html>`;
}

/**
 * Render every verified screen bundle in the e2b sandbox (concurrently —
 * the warm sandbox pool is the concurrency limit, not 1) and return base64
 * PNG data URLs + DOM-geometry reports.
 */
export async function captureScreenshots(opts: {
  bundles: Record<string, string>;
  styles: string;
  fonts?: string[];
  heroScalePx?: number;
  /** Per-screen errors from the sandboxed smoke stage (attributed). */
  knownErrors?: Record<string, string[]>;
}): Promise<CaptureResult> {
  const bundleEntries = Object.entries(opts.bundles)
    .filter(([, js]) => js && js.trim().length > 0)
    .slice(0, MAX_SCREENS);

  if (bundleEntries.length === 0) {
    return { screenshots: [], geometryReports: {}, reason: "no verified screen bundles to render" };
  }

  // Render the batch concurrently — the warm pool (default 3 sandboxes)
  // replaces the old hard-capped serialized single-browser render.
  const rendered = await Promise.all(
    bundleEntries.map(async ([name, bundle]) => {
      const html = buildPreviewHtml(name, bundle, opts.styles, opts.fonts ?? []);
      const result = await renderScreenInSandbox({
        html,
        screenName: name,
        width: 1440,
        height: 900,
        heroScalePx: opts.heroScalePx,
        fontFamilies: opts.fonts ?? [],
      });
      const errors = [...result.errors, ...(opts.knownErrors?.[name] ?? [])];
      if (!result.screenshot || errors.length > 0) {
        return { name, out: null as CapturedScreenRender | null, errors };
      }
      const png = result.screenshot;
      if (png.byteLength > MAX_SHOT_BYTES) {
        return { name, out: null, errors: [...errors, "screenshot exceeds the vision-prompt byte cap"] };
      }
      return {
        name,
        out: {
          screenshot: { name, dataUrl: `data:image/png;base64,${png.toString("base64")}` },
          geometry: result.geometry,
          errors,
        } as CapturedScreenRender,
        errors,
      };
    }),
  );

  const screenshots: CapturedScreenshot[] = [];
  const geometryReports: Record<string, GeometryReport> = {};
  const failures: string[] = [];
  for (const r of rendered) {
    if (r.out) {
      screenshots.push(r.out.screenshot);
      if (r.out.geometry) geometryReports[r.name] = r.out.geometry;
    } else {
      failures.push(`${r.name}: ${r.errors.join("; ")}`);
    }
  }

  if (screenshots.length === 0) {
    return { screenshots, geometryReports, reason: failures.length > 0 ? `every render failed: ${failures.join(" | ").slice(0, 300)}` : "every screenshot render failed" };
  }
  if (failures.length > 0) {
    return { screenshots, geometryReports, reason: failures.slice(0, 3).join(" | ") };
  }
  return { screenshots, geometryReports };
}
