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
  /** Per-screen DOM-geometry reports from the sandboxed DESKTOP render. */
  geometryReports: Record<string, GeometryReport>;
  /**
   * V24 (WS6): geometry per (viewport width → screen). The gate consumes
   * EVERY viewport — an overflow at 375px is a blocking failure, so mobile
   * clipping can no longer hide behind the desktop-only render.
   */
  geometryReportsByViewport: Record<number, Record<string, GeometryReport>>;
  /** Why capture produced nothing (for activity logging). */
  reason?: string;
}

const MAX_SHOT_BYTES = 1_500_000; // keep vision prompts sane
const MAX_SCREENS = 8;

/** V24: every screen renders at these widths — 1440 (review PNGs), 768 and
 *  375 (the v16-standard geometry widths, now actually gate-enforced). */
export const CAPTURE_VIEWPORTS: Array<{ width: number; height: number }> = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 375, height: 844 },
];

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
  /** V24: viewports to render+measure (default CAPTURE_VIEWPORTS). */
  viewports?: Array<{ width: number; height: number }>;
}): Promise<CaptureResult> {
  const bundleEntries = Object.entries(opts.bundles)
    .filter(([, js]) => js && js.trim().length > 0)
    .slice(0, MAX_SCREENS);

  if (bundleEntries.length === 0) {
    return { screenshots: [], geometryReports: {}, geometryReportsByViewport: {}, reason: "no verified screen bundles to render" };
  }

  // Render every (screen × viewport) concurrently — the warm pool (default 3
  // sandboxes) replaces the old hard-capped serialized single-browser render.
  const rendered = await Promise.all(
    bundleEntries.flatMap(([name, bundle]) => {
      const html = buildPreviewHtml(name, bundle, opts.styles, opts.fonts ?? []);
      const viewports = opts.viewports ?? CAPTURE_VIEWPORTS;
      return viewports.map(async ({ width, height }) => {
        const result = await renderScreenInSandbox({
          html,
          screenName: name,
          width,
          height,
          heroScalePx: opts.heroScalePx,
          fontFamilies: opts.fonts ?? [],
        });
        const errors = [...result.errors, ...(opts.knownErrors?.[name] ?? [])];
        const png = result.screenshot;
        return { name, width, height, result, png, errors };
      });
    }),
  );

  const screenshots: CapturedScreenshot[] = [];
  const geometryReports: Record<string, GeometryReport> = {};
  const geometryReportsByViewport: Record<number, Record<string, GeometryReport>> = {};
  const failures: string[] = [];
  for (const r of rendered) {
    if (!r.png || r.errors.length > 0) {
      failures.push(`${r.name}@${r.width}: ${r.errors.join("; ")}`);
      continue;
    }
    if (r.png.byteLength > MAX_SHOT_BYTES) {
      failures.push(`${r.name}@${r.width}: screenshot exceeds the vision-prompt byte cap`);
      continue;
    }
    // Desktop PNGs feed the visual review; every viewport's geometry feeds
    // the gate (WS6: overflow at 375px is blocking).
    if (r.width === 1440) {
      screenshots.push({ name: r.name, dataUrl: `data:image/png;base64,${r.png.toString("base64")}` });
    }
    if (r.result.geometry) {
      geometryReportsByViewport[r.width] ??= {};
      geometryReportsByViewport[r.width]![r.name] = r.result.geometry;
      if (r.width === 1440) geometryReports[r.name] = r.result.geometry;
    }
  }

  if (screenshots.length === 0 && Object.keys(geometryReportsByViewport).length === 0) {
    return { screenshots, geometryReports, geometryReportsByViewport, reason: failures.length > 0 ? `every render failed: ${failures.join(" | ").slice(0, 300)}` : "every screenshot render failed" };
  }
  if (failures.length > 0) {
    return { screenshots, geometryReports, geometryReportsByViewport, reason: failures.slice(0, 3).join(" | ") };
  }
  return { screenshots, geometryReports, geometryReportsByViewport };
}
