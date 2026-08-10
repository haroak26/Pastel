export interface RenderQualityResult {
  isRenderable: boolean;
  isBlank: boolean;
  width: number;
  height: number;
  fileSize: number; // bytes
  fileSizeKB: number;
  contentDetectionScore: number; // 0-1, 1 = definitely has content
  issues: string[];
}

/**
 * Check if a screenshot buffer represents a meaningful render (not blank/empty).
 * Analyzes PNG buffer for size, dimensions, and basic content signals.
 */
export function analyzeScreenshotQuality(buf: Buffer): RenderQualityResult {
  const issues: string[] = [];
  const fileSize = buf.length;
  const fileSizeKB = Math.round((fileSize / 1024) * 10) / 10;

  // PNG signature check
  const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;

  if (!isPNG) {
    return {
      isRenderable: false,
      isBlank: true,
      width: 0,
      height: 0,
      fileSize,
      fileSizeKB,
      contentDetectionScore: 0,
      issues: ["Not a valid PNG image"],
    };
  }

  // Extract IHDR chunk for dimensions (IHDR is first chunk after signature)
  // PNG structure: 8-byte sig, 4-byte length, 4-byte type, data, 4-byte CRC
  let width = 0;
  let height = 0;

  try {
    // IHDR is at offset 16 (8 sig + 4 len + 4 "IHDR")
    if (buf.length >= 24) {
      width = buf.readUInt32BE(16);
      height = buf.readUInt32BE(20);
    }
  } catch {
    issues.push("Could not read image dimensions");
  }

  // Blank screen detection heuristics:
  // 1. Very small file size for given dimensions (< 5KB for 1440x900 = likely blank)
  // 2. Size suggests single solid color
  const expectedMinSize = (width * height) / 100; // rough heuristic: ~100 bytes per 100px
  const isProbablyBlank = fileSize < expectedMinSize * 0.2 || fileSize < 3000;

  // Content detection score based on file size relative to expected
  let contentScore = 0;
  if (width > 0 && height > 0) {
    const ratio = fileSize / expectedMinSize;
    contentScore = Math.min(1, Math.max(0, ratio * 0.8));
  }

  if (isProbablyBlank) {
    issues.push(`Screenshot appears blank or near-empty (${fileSizeKB}KB for ${width}x${height} — too small)`);
  }

  if (width < 100 || height < 100) {
    issues.push(`Screenshot dimensions too small: ${width}x${height}`);
  }

  return {
    isRenderable: isPNG && width > 0 && height > 0,
    isBlank: isProbablyBlank,
    width,
    height,
    fileSize,
    fileSizeKB,
    contentDetectionScore: Math.round(contentScore * 100) / 100,
    issues,
  };
}

/**
 * Validate multiple screenshots and return a summary.
 */
export function validateScreenshotSet(
  screenshots: Record<string, Buffer>,
): { allValid: boolean; results: Record<string, RenderQualityResult>; summary: string } {
  const results: Record<string, RenderQualityResult> = {};

  for (const [name, buf] of Object.entries(screenshots)) {
    results[name] = analyzeScreenshotQuality(buf);
  }

  const allValid = Object.values(results).every((r) => r.isRenderable && !r.isBlank);
  const blankCount = Object.values(results).filter((r) => r.isBlank).length;
  const totalCount = Object.keys(results).length;

  const summary = `${totalCount} screenshots: ${totalCount - blankCount} valid, ${blankCount} blank/missing content`;

  return { allValid, results, summary };
}

/**
 * Generate a minimal placeholder screenshot as an SVG buffer when rendering fails.
 * This is better than trying to fake image data.
 */
export function createPlaceholderScreenshot(
  screenName: string,
  message: string,
  width: number = 1440,
  height: number = 900,
): Buffer {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#F3F4F6"/>
  <rect x="${width / 2 - 200}" y="${height / 2 - 80}" width="400" height="160" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="${width / 2}" y="${height / 2 - 20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#374151">${escapeXml(screenName)}</text>
  <text x="${width / 2}" y="${height / 2 + 15}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#9CA3AF">${escapeXml(message)}</text>
  <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#D1D5DB">Picasso V2 — Screenshot Unavailable</text>
</svg>`;

  return Buffer.from(svg, "utf-8");
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
