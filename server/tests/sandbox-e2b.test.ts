import test from "node:test";
import assert from "node:assert/strict";

import {
  isInstallCommand,
  getSandboxCommandLog,
  resetSandboxCommandLog,
  resetSandboxPool,
  warmPoolSize,
  totalSandboxCount,
  acquireSandbox,
  SANDBOX_READY_MARKER,
} from "../lib/maxi-agent/lib/sandbox-render";

// ── Install-antipattern detection (the regression guard's core) ──────────

test("isInstallCommand: package-install shell-outs are detected", () => {
  for (const cmd of [
    "apt-get install -y chromium",
    "apt-get update && apt-get install libnss3",
    "sudo apt-get install -y libgtk-3-0",
    "npm install puppeteer",
    "npm install --no-audit react",
    "pip install pillow",
    "apt install chromium",
    "pnpm add foo",
    "yarn add bar",
  ]) {
    assert.ok(isInstallCommand(cmd), `must detect: ${cmd}`);
  }
});

test("isInstallCommand: normal sandbox jobs are not false-flagged", () => {
  for (const cmd of [
    "cd /home/user && node run-smoke.js",
    "cd /home/user && node shot.js",
    "test -f /home/user/.maxi-sandbox-ready",
    "node --version",
    "mkdir -p /home/user/output && mv screen.png out/",
    "chromium --version",
    "cat /home/user/smoke.cjs",
  ]) {
    assert.ok(!isInstallCommand(cmd), `must not flag: ${cmd}`);
  }
});

// ── Cold-start regression (integration — requires E2B_API_KEY) ────────────

test("cold sandbox boot never shells out to apt-get or npm install", { skip: !process.env.E2B_API_KEY && "E2B_API_KEY not set — cold-start regression guard skipped" }, async () => {
  resetSandboxCommandLog();
  await resetSandboxPool();
  assert.equal(totalSandboxCount(), 0, "pool starts empty — this is a genuine cold start");

  // Warm the pool: this CREATES sandboxes from the template. The marker
  // check is the template-intactness assertion; no package installation is
  // ever allowed at runtime.
  const lease = await acquireSandbox();
  try {
    assert.ok(warmPoolSize() >= 1, "at least one warm sandbox in the pool");
  } finally {
    await lease.release();
  }

  const log = getSandboxCommandLog();
  assert.ok(log.length > 0, "commands were recorded");
  assert.ok(log.some((entry) => entry.cmd.includes(SANDBOX_READY_MARKER)), "the readiness-marker check ran on cold start");

  const installs = log.filter((entry) => isInstallCommand(entry.cmd));
  assert.deepEqual(
    installs.map((i) => i.cmd),
    [],
    `cold start executed install commands — the template-based boot is broken: ${installs.map((i) => i.cmd).join(" | ")}`,
  );

  await resetSandboxPool();
  resetSandboxCommandLog();
});
