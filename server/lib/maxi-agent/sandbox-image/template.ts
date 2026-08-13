/**
 * Maxi Agent v23 — e2b sandbox template definition.
 *
 * The template bakes the ENTIRE render toolchain into the image so a cold
 * sandbox boots in seconds instead of running `apt-get install` + `npm
 * install puppeteer` on every cold start (that was the literal bug in the
 * retired Picasso `picasso/pipeline/lib/sandbox-render.ts::createSandbox()`).
 *
 * Baked in:
 *   - Node 20
 *   - Chromium + font packages (system browser — no browser download at boot)
 *   - playwright-core (drives the system chromium; no bundled browser)
 *   - react / react-dom / lucide-react pinned to the app's own versions so
 *     the sandbox smoke-render behaves identically to the app server
 *   - the readiness marker file /home/user/.maxi-sandbox-ready
 *
 * Build:  E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts
 * Use:    Sandbox.create({ template: "maxi-agent-v23" })  (lib/sandbox-render.ts)
 *
 * A cold start NEVER runs package installation — the regression guard is
 * server/tests/sandbox-e2b.test.ts.
 */
import { Template } from "e2b";

export const SANDBOX_TEMPLATE_NAME = "maxi-agent-v23";

export const template = Template()
  .fromNodeImage("20")
  // Browser runtime + fonts (system chromium — headless render + geometry).
  .runCmd(
    "apt-get update -qq && apt-get install -y -qq --no-install-recommends chromium fonts-dejavu-core fonts-liberation fontconfig ca-certificates curl",
    { user: "root" },
  )
  // The exact toolchain the app server bundles against — pinned versions.
  .setWorkdir("/home/user")
  .runCmd("npm install --no-audit --no-fund react@18.3.1 react-dom@18.3.1 lucide-react@0.453.0 playwright-core", { user: "root" })
  // Readiness marker — lib/sandbox-render.ts verifies it on cold start and
  // the CI regression test asserts it exists. No marker = broken template;
  // the sandbox module must NEVER fall back to installing packages itself.
  .runCmd("mkdir -p /home/user && echo maxi-agent-v23 > /home/user/.maxi-sandbox-ready", { user: "root" })
  .setEnvs({ PLAYWRIGHT_BROWSERS_PATH: "0" });

export default template;
