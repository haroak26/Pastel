/** Render the BASE button component (unmodified) and screenshot it. */
import fs from "node:fs";
import path from "node:path";
import { renderScreen, getWarmSandbox, clearWarmSandbox } from "../../server/lib/pastel-agent/picasso/pipeline/lib/sandbox-render";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "../../server/lib/pastel-agent/picasso/pipeline/lib/preview";

const RUN_DIR = path.resolve("picassotests/test6/output/e2e-1-1786397271062");
const OUT = path.resolve("picassotests/agentv7/screenshots/base-button.png");

const buttonSource = fs.readFileSync(
  path.resolve("server/lib/pastel-agent/picasso/base-components/ui/button.tsx"),
  "utf8",
);

const accent = JSON.parse(
  fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"),
).color.accent["500"];

const demo = `import { Button, buttonVariants } from "./button"

export default function BaseButtonDemo() {
  const variants = [
    ["default", "Default"],
    ["outline", "Outline"],
    ["secondary", "Secondary"],
    ["ghost", "Ghost"],
    ["destructive", "Destructive"],
    ["link", "Link"],
  ] as const
  const sizes = [["xs", "xs"], ["sm", "sm"], ["default", "default"], ["lg", "lg"], ["icon", "icon"]] as const
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Base component — button</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>server/lib/pastel-agent/picasso/base-components/ui/button.tsx — unmodified</p>
      {variants.map(([variant, label]) => (
        <div key={variant} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <span style={{ width: 110, fontSize: 13, color: "var(--muted-foreground)" }}>{label}</span>
          {sizes.map(([size, sizeLabel]) => (
            <Button key={size} variant={variant} size={size}>
              {size === "icon" ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" /></svg> : sizeLabel}
            </Button>
          ))}
        </div>
      ))}
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 24 }}>
        Theme tokens from the agentv7 run: accent ${accent}
      </p>
    </div>
  )
}
`;

async function main() {
  const components: Record<string, string> = { button: buttonSource };
  const screens: Record<string, string> = { "base-button-demo": demo };
  const support = { cn: `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }` };

  const globalsCSS = fs.readFileSync(path.join(RUN_DIR, "src/globals.css"), "utf8");
  const compiled = await compileStylesForRun({ globalsCSS, components, screens, support });
  if (!compiled) { console.error("styles: tailwind compilation failed"); process.exit(1); }
  console.log("styles compiled");

  const bundle = await bundleScreenForPreview("base-button-demo", demo, components, support);
  if (!bundle) { console.error("bundle failed"); process.exit(1); }
  console.log("bundle ok");

  const tokens = JSON.parse(fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"));
  const html = buildPreviewHtml("Base Button", bundle, compiled, [
    tokens.typography.fontFamily.display,
    tokens.typography.fontFamily.body,
    tokens.typography.fontFamily.mono,
  ]);

  const warm = await getWarmSandbox();
  const result = await renderScreen({ html, screenName: "base-button", warmSandbox: warm });
  if (result.screenshot) {
    fs.writeFileSync(OUT, result.screenshot);
    console.log(`saved → ${OUT} (${result.screenshot.length} bytes)`);
  } else {
    console.error("render failed:", result.errors.join("; "));
  }
  clearWarmSandbox();
}
main().catch((e) => { console.error("crashed:", e.message); clearWarmSandbox(); process.exit(1); });
