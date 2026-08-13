/**
 * Build + upload the Maxi Agent v23 e2b template.
 *
 * Run: E2B_API_KEY=... npx tsx server/lib/maxi-agent/sandbox-image/build.ts
 *
 * The template bakes Node 20 + Chromium + the pinned JS toolchain so cold
 * sandbox boots skip every package install (see template.ts).
 */
import { Template, defaultBuildLogger } from "e2b";
import { template, SANDBOX_TEMPLATE_NAME } from "./template";

async function main() {
  if (!process.env.E2B_API_KEY) {
    throw new Error("E2B_API_KEY is required to build the sandbox template");
  }
  const info = await Template.build(template, SANDBOX_TEMPLATE_NAME, {
    cpuCount: 2,
    memoryMB: 2048,
    onBuildLogs: defaultBuildLogger({ minLevel: "info" }),
  });
  console.log(`[sandbox-image] template "${SANDBOX_TEMPLATE_NAME}" built: template=${info.templateId} build=${info.buildId}`);
}

main().catch((err) => {
  console.error("[sandbox-image] template build failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
