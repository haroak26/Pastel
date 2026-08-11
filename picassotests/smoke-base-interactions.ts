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
  "combo-interactive": `import * as React from "react"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export default function Demo() {
  const [value, setValue] = React.useState("")
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <Combobox items={frameworks} value={value} onValueChange={setValue} data-testid="combobox-root">
        <ComboboxInput placeholder="Select a framework" data-testid="combo-input" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList data-testid="combo-list">
            {(item) => (
              <ComboboxItem key={item} value={item} data-testid={"combo-item-" + item}>{item}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p data-testid="combo-selected" style={{ fontSize: 13, marginTop: 24 }}>Selected: {JSON.stringify(value) || "—"}</p>
    </div>
  )
}`,

  "qnr-interactive": `import * as React from "react"
import { Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError, QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSkip, QuestionnaireSubmit, QuestionnaireTitle } from "./questionnaire"

export default function Demo() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", padding: "48px 64px", fontFamily: "var(--font-body, sans-serif)" }}>
      <Questionnaire
        defaultItem="goal"
        items={[
          { name: "goal", choices: [{ value: "read" }, { value: "code" }], required: true },
          { name: "notes" },
        ]}
        onSubmit={(e) => { e.preventDefault() }}
      >
        <QuestionnaireProgress data-testid="qnr-progress" />
        <QuestionnaireItem name="goal" required>
          <QuestionnaireTitle>What is your main goal?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="read" data-testid="choice-read">Read more books</QuestionnaireChoice>
            <QuestionnaireChoice value="code" data-testid="choice-code">Build in public</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireItem name="notes">
          <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
          <QuestionnaireInput placeholder="Add a note…" data-testid="qnr-input" />
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireActions>
          <QuestionnairePrevious data-testid="qnr-prev" />
          <QuestionnaireSkip data-testid="qnr-skip" />
          <QuestionnaireNext data-testid="qnr-next" />
          <QuestionnaireSubmit data-testid="qnr-submit" />
        </QuestionnaireActions>
      </Questionnaire>
    </div>
  )
}`,
};

async function main() {
  const globalsCSS = fs
    .readFileSync(path.join(BASE_DIR, "../theme/globals.css"), "utf8")
    .replace('@import "@fontsource-variable/inter";', "");

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

  const check = (label: string, ok: boolean, extra = "") => {
    console.log(`${ok ? "PASS" : "FAIL"} ${label}${ok ? "" : " — " + extra}`);
    if (!ok) failures += 1;
  };

  // ── Combobox interactions ─────────────────────────────────────────────
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.setContent(htmlFiles["combo-interactive"], { waitUntil: "load" });
    await page.waitForTimeout(800);

    const input = page.getByTestId("combo-input");

    // Open via focus+typing
    await input.click();
    await input.press("ArrowDown");
    const listVisible = await page.getByTestId("combo-list").isVisible();
    check("combobox opens popup", listVisible, "listbox not visible after ArrowDown");

    const itemCount = await page.getByTestId("combo-list").locator("[role=option]").count();
    check("combobox renders 5 options", itemCount === 5, `got ${itemCount}`);

    // Filter
    await input.fill("nux");
    const filtered = await page.getByTestId("combo-list").locator("[role=option]:visible").count();
    check("combobox filters to 1", filtered === 1, `got ${filtered}`);
    const emptyVisible = await page.locator("[data-slot=combobox-empty]").isVisible();
    check("combobox empty hidden when matches", !emptyVisible);

    await input.fill("zzz");
    const emptyVisible2 = await page.locator("[data-slot=combobox-empty]").isVisible();
    check("combobox empty shown on no match", emptyVisible2);

    // Select via keyboard
    await input.fill("svelte");
    await input.press("Enter");
    const selectedText = await page.getByTestId("combo-selected").innerText();
    check("combobox selects via Enter", selectedText.includes("SvelteKit"), selectedText);
    const listHiddenAfter = await page.getByTestId("combo-list").isVisible();
    check("combobox closes after single select", !listHiddenAfter);

    // Reopen + click select
    await input.click();
    await input.press("ArrowDown");
    await page.getByTestId("combo-item-Remix").click();
    const selectedText2 = await page.getByTestId("combo-selected").innerText();
    check("combobox selects via click", selectedText2.includes("Remix"), selectedText2);

    check("combobox no page errors", pageErrors.length === 0, pageErrors.join(" | "));
    await page.close();
  }

  // ── Questionnaire interactions ────────────────────────────────────────
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.setContent(htmlFiles["qnr-interactive"], { waitUntil: "load" });
    await page.waitForTimeout(800);

    const progress = await page.getByTestId("qnr-progress").innerText();
    check("questionnaire shows Question 1 of 2", progress.includes("1 of 2"), progress);

    // Next on required unanswered → stays + error shows
    await page.getByTestId("qnr-next").click();
    const stillOnOne = (await page.getByTestId("qnr-progress").innerText()).includes("1 of 2");
    const errorVisible = await page.locator("[data-slot=questionnaire-error]").isVisible();
    check("questionnaire blocks next on required unanswered", stillOnOne && errorVisible);

    // Choose an answer → next works
    await page.getByTestId("choice-code").click();
    await page.getByTestId("qnr-next").click();
    const onTwo = (await page.getByTestId("qnr-progress").innerText()).includes("2 of 2");
    check("questionnaire advances after answering", onTwo);

    // Skip → submit visible on last item
    const skipVisible = await page.getByTestId("qnr-skip").isVisible();
    check("questionnaire skip visible on non-required", skipVisible);
    await page.getByTestId("qnr-skip").click();
    const submitVisible = await page.getByTestId("qnr-submit").isVisible();
    check("questionnaire submit visible after skip", submitVisible);

    // Previous returns
    await page.getByTestId("qnr-prev").click();
    const backOnOne = (await page.getByTestId("qnr-progress").innerText()).includes("1 of 2");
    check("questionnaire previous works", backOnOne);

    check("questionnaire no page errors", pageErrors.length === 0, pageErrors.join(" | "));
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? "ALL INTERACTION PASS" : `${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
