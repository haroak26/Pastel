/** Render 3 more BASE components (unmodified) and screenshot each. */
import fs from "node:fs";
import path from "node:path";
import { renderScreen, getWarmSandbox, clearWarmSandbox } from "../../server/lib/pastel-agent/picasso/pipeline/lib/sandbox-render";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "../../server/lib/pastel-agent/picasso/pipeline/lib/preview";

const RUN_DIR = path.resolve("picassotests/test6/output/e2e-1-1786397271062");
const SHOTS_DIR = path.resolve("picassotests/agentv7/screenshots");
const BASE_DIR = path.resolve("server/lib/pastel-agent/picasso/base-components/ui");

const accent = JSON.parse(
  fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"),
).color.accent["500"];

const demos: Record<string, { file: string; title: string; screen: (moduleName: string) => string }> = {
  input: {
    file: "input.tsx",
    title: "Base component — input",
    screen: (m) => `import { Input as ${m}Input } from "./${m}"

export default function Demo() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Base component — input</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>server/lib/pastel-agent/picasso/base-components/ui/input.tsx — unmodified</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
        <label style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Placeholder</label>
        <${m}Input placeholder="Enter habit name…" />
        <label style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 16 }}>With value</label>
        <${m}Input defaultValue="Morning stretch" />
        <label style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 16 }}>Disabled</label>
        <${m}Input disabled defaultValue="Read 20 pages" />
        <label style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 16 }}>File type</label>
        <${m}Input type="file" />
      </div>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 32 }}>Theme tokens from the agentv7 run: accent ${accent}</p>
    </div>
  )
}`,
  },
  card: {
    file: "card.tsx",
    title: "Base component — card",
    screen: (m) => `import { Card as ${m}Card, CardHeader as ${m}CardHeader, CardTitle as ${m}CardTitle, CardDescription as ${m}CardDescription, CardAction as ${m}CardAction, CardContent as ${m}CardContent, CardFooter as ${m}CardFooter } from "./${m}"

export default function Demo() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Base component — card</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>server/lib/pastel-agent/picasso/base-components/ui/card.tsx — unmodified</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, maxWidth: 880 }}>
        <${m}Card>
          <${m}CardHeader>
            <${m}CardTitle>Today's ticks</${m}CardTitle>
            <${m}CardDescription>5 habits scheduled for today.</${m}CardDescription>
          </${m}CardHeader>
          <${m}CardContent>3 of 5 habits completed so far.</${m}CardContent>
          <${m}CardFooter>Last tick: 08:00</${m}CardFooter>
        </${m}Card>
        <${m}Card>
          <${m}CardHeader>
            <${m}CardTitle>Streak</${m}CardTitle>
            <${m}CardDescription>Current streak across all habits.</${m}CardDescription>
            <${m}CardAction>12 days</${m}CardAction>
          </${m}CardHeader>
          <${m}CardContent>Best streak: 21 days · longest run in March.</${m}CardContent>
        </${m}Card>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 32 }}>Theme tokens from the agentv7 run: accent ${accent}</p>
    </div>
  )
}`,
  },
  badge: {
    file: "badge.tsx",
    title: "Base component — badge",
    screen: (m) => `import { Badge as ${m}Badge } from "./${m}"

export default function Demo() {
  const variants = ["default", "secondary", "destructive", "outline", "ghost"] as const
  const labels: Record<string, string> = { default: "3 of 5 completed", secondary: "Weekly", destructive: "Missed", outline: "Archived", ghost: "Optional" }
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Base component — badge</h1>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 32 }}>server/lib/pastel-agent/picasso/base-components/ui/badge.tsx — unmodified</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {variants.map((v) => (
          <${m}Badge key={v} variant={v}>{labels[v]}</${m}Badge>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 32 }}>Theme tokens from the agentv7 run: accent ${accent}</p>
    </div>
  )
}`,
  },
};

async function main() {
  const support = { cn: `export function cn(...args: any[]) { return args.filter(Boolean).join(" "); }` };
  const globalsCSS = fs.readFileSync(path.join(RUN_DIR, "src/globals.css"), "utf8");
  const tokens = JSON.parse(fs.readFileSync(path.join(RUN_DIR, "docs/design/DesignTokens.json"), "utf8"));

  for (const [name, def] of Object.entries(demos)) {
    const moduleName = name === "input" ? "TextInput" : name === "card" ? "CardBase" : "BadgeBase";
    const source = fs.readFileSync(path.join(BASE_DIR, def.file), "utf8");
    const screen = def.screen(moduleName);
    const components: Record<string, string> = { [name]: source };
    const screens: Record<string, string> = { [`${name}-demo`]: screen };

    const compiled = await compileStylesForRun({ globalsCSS, components, screens, support });
    if (!compiled) { console.error(`${name}: styles failed`); continue; }
    const bundle = await bundleScreenForPreview(`${name}-demo`, screen, components, support);
    if (!bundle) { console.error(`${name}: bundle failed`); continue; }

    const html = buildPreviewHtml(def.title, bundle, compiled, [
      tokens.typography.fontFamily.display,
      tokens.typography.fontFamily.body,
      tokens.typography.fontFamily.mono,
    ]);

    const warm = await getWarmSandbox();
    const result = await renderScreen({ html, screenName: name, warmSandbox: warm });
    if (result.screenshot) {
      const out = path.join(SHOTS_DIR, `base-${name}.png`);
      fs.writeFileSync(out, result.screenshot);
      console.log(`base-${name}.png saved (${result.screenshot.length} bytes)`);
    } else {
      console.error(`${name}: render failed — ${result.errors.join("; ")}`);
    }
  }
  clearWarmSandbox();
}
main().catch((e) => { console.error("crashed:", e.message); clearWarmSandbox(); process.exit(1); });
