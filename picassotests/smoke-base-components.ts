import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { bundleScreenForPreview, compileStylesForRun, buildPreviewHtml } from "/home/runner/workspace/server/lib/pastel-agent/picasso/pipeline/lib/preview";

const BASE_DIR = "/home/runner/workspace/server/lib/pastel-agent/picasso/base-components/ui";

function rewrite(code: string): string {
  return code
    .replace(/from\s+["']@\/lib\/utils["']/g, 'from "./cn"')
    .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, (_m: string, name: string) => `from "./${name}"`);
}

function load(...names: string[]): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of names) {
    files[name] = rewrite(fs.readFileSync(path.join(BASE_DIR, `${name}.tsx`), "utf8"));
  }
  return files;
}

const components = {
  ...load("button", "input", "textarea", "input-group", "combobox", "message-scroller", "questionnaire"),
};

const cn = `export function cn(...args: any[]) {
  return args.filter(Boolean).join(" ");
}`;

const screens: Record<string, string> = {
  "combobox-single": `import * as React from "react"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export default function Demo() {
  const [value, setValue] = React.useState("")
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Combobox — single, input pattern</h1>
      <Combobox items={frameworks} value={value} onValueChange={setValue}>
        <ComboboxInput placeholder="Select a framework" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 24 }}>Selected: {JSON.stringify(value) || "—"}</p>
    </div>
  )
}`,

  "combobox-multiple": `import * as React from "react"
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue } from "./combobox"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export default function Demo() {
  const [value, setValue] = React.useState<string[]>([])
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Combobox — multiple with chips</h1>
      <Combobox items={frameworks} multiple value={value} onValueChange={setValue}>
        <ComboboxChips>
          <ComboboxValue>
            {value.map((item) => (
              <ComboboxChip key={item}>{item}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput placeholder="Add framework" />
        </ComboboxChips>
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}`,

  "combobox-trigger": `import * as React from "react"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger, ComboboxValue, ComboboxClear } from "./combobox"
import { buttonVariants } from "./button"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export default function Demo() {
  const [value, setValue] = React.useState("Next.js")
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Combobox — trigger pattern</h1>
      <Combobox items={frameworks} value={value} onValueChange={setValue}>
        <ComboboxTrigger className={buttonVariants({ variant: "outline", size: "default" })}>
          <ComboboxValue />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput showTrigger={false} showClear />
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}`,

  "message-scroller": `import * as React from "react"
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "./message-scroller"

const messages = Array.from({ length: 24 }, (_, i) => ({
  id: "m" + i,
  role: i % 2 === 0 ? "user" : "assistant",
  text: "Message " + (i + 1) + " — the quick brown fox jumps over the lazy dog while the stream keeps growing.",
}))

export default function Demo() {
  const [items, setItems] = React.useState(messages.slice(0, 12))
  React.useEffect(() => {
    const t = setTimeout(() => setItems(messages), 400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Message Scroller</h1>
      <div style={{ height: 420, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="h-full">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {items.map((m) => (
                  <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={m.role === "user"}>
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: m.role === "user" ? "var(--primary)" : "var(--muted)", color: m.role === "user" ? "var(--primary-foreground)" : "var(--foreground)", maxWidth: "80%" }}>{m.text}</div>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
    </div>
  )
}`,

  "questionnaire": `import * as React from "react"
import { Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoiceDescription, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError, QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSkip, QuestionnaireSubmit, QuestionnaireTitle } from "./questionnaire"

export default function Demo() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Questionnaire</h1>
      <div style={{ maxWidth: 560 }}>
        <Questionnaire
          defaultItem="goal"
          items={[
            { name: "goal", choices: [{ value: "read" }, { value: "code" }], required: true },
            { name: "frequency", choices: [{ value: "daily" }, { value: "weekly" }] },
            { name: "notes" },
          ]}
          onSubmit={(e) => { e.preventDefault() }}
        >
          <QuestionnaireProgress />
          <QuestionnaireItem name="goal" required>
            <QuestionnaireTitle>What is your main goal?</QuestionnaireTitle>
            <QuestionnaireDescription>Choose the option that fits best.</QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="read">Read more books<QuestionnaireChoiceDescription>10 pages a day</QuestionnaireChoiceDescription></QuestionnaireChoice>
              <QuestionnaireChoice value="code">Build in public</QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireItem name="frequency">
            <QuestionnaireTitle>How often?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="daily">Daily</QuestionnaireChoice>
              <QuestionnaireChoice value="weekly">Weekly</QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireInput placeholder="Add a note…" />
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </Questionnaire>
      </div>
    </div>
  )
}`,

  "button": `import * as React from "react"
import { Button } from "./button"

export default function Demo() {
  const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
  const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Button variants</h1>
      {variants.map((variant) => (
        <div key={variant} style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size as never}>Button</Button>
          ))}
        </div>
      ))}
    </div>
  )
}`,
};

async function main() {
  const globalsCSS = fs
    .readFileSync(
      "/home/runner/workspace/server/lib/pastel-agent/picasso/base-components/theme/globals.css",
      "utf8"
    )
    .replace('@import "@fontsource-variable/inter";', "");

  console.log("[smoke] compiling styles…");
  const styles = await compileStylesForRun({ globalsCSS, components, screens, support: { cn } });
  if (!styles) {
    console.error("FAIL: style compilation");
    process.exit(1);
  }

  const htmlFiles: Record<string, string> = {};
  for (const [name, code] of Object.entries(screens)) {
    const bundle = await bundleScreenForPreview(name, code, components, { cn });
    if (!bundle) {
      console.error(`FAIL: bundle ${name}`);
      process.exit(1);
    }
    htmlFiles[name] = buildPreviewHtml(name, bundle, styles, []);
  }

  const browser = await chromium.launch({
    executablePath: "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  let failures = 0;
  for (const [name, html] of Object.entries(htmlFiles)) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const diag = await page.evaluate(() => {
      const d = (window as unknown as { __picassoDiagnostics?: { errors: string[]; console: string[] } }).__picassoDiagnostics;
      return d ? { errors: d.errors, console: d.console } : null;
    });
    const mounted = await page.evaluate(() => (window as unknown as { __pastelMounted?: boolean }).__pastelMounted === true);

    const errors = [...pageErrors, ...(diag?.errors ?? []), ...(diag?.console ?? [])];
    const ok = mounted && errors.length === 0;

    await page.screenshot({ path: `/tmp/opencode/smoke-${name}.png` });
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : " — " + errors.slice(0, 3).join(" | ")}`);
    if (!ok) failures += 1;
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
