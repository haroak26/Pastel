import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { PastelEvent, AgentManifest, BrandKit } from "../lib/pastel-agent/types";
import { getRunState, getLatestRunForProject, subscribeToRun, getRunLiveStatus } from "../lib/pastel-agent/run-store";
import type { User, PlanTier } from "@shared/schema";
import { requireAuth } from "./helpers";
import { storage } from "../storage";
import * as creditService from "../lib/credit-service";
import { calcCost, toCredits } from "../lib/pricing";
import { MODELS } from "../lib/pastel-agent/gateway";

const clarifySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

const generateSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  answers: z.record(z.string()).optional(),
  projectId: z.string().uuid().optional(),
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function registerPastelAgentRoutes(app: Express) {
  // ── Clarify (GPT 5.4 nano) ───────────────────────────────────────────
  app.post("/api/pastel-agent/clarify", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const parsed = clarifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }

      const planTier = await getPlanTier(user.id);
      const estimatedPrompt = clarifySystemPromptLength() + parsed.data.prompt.length;
      const estimatedOutput = 2000;
      const estCost = calcCost(MODELS.clarify, estimatedPrompt, estimatedOutput);
      const allowance = await creditService.checkAllowance(user.id, planTier, estCost.credits);
      if (!allowance.allowed) {
        return res.status(402).json({ message: allowance.reason, balance: allowance.balance, monthlyUsed: allowance.monthlyUsed, monthlyAllowance: allowance.monthlyAllowance });
      }

      const { runClarify } = await import("../lib/pastel-agent/engine");
      const result = await runClarify(parsed.data.prompt, user.id);
      return res.json(result);
    } catch (err: any) {
      const message = err?.message || String(err);
      const code = err?.status || err?.statusCode || 500;
      console.error("[pastel-agent] clarify error:", message);
      return res.status(code).json({ message });
    }
  });

  // ── Start a run ──────────────────────────────────────────────────────
  app.post("/api/pastel-agent/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }

      const planTier = await getPlanTier(user.id);
      const estCredits = estimateRunCredits(parsed.data.prompt);
      const allowance = await creditService.checkAllowance(user.id, planTier, estCredits);
      if (!allowance.allowed) {
        return res.status(402).json({ message: allowance.reason, balance: allowance.balance, monthlyUsed: allowance.monthlyUsed, monthlyAllowance: allowance.monthlyAllowance });
      }

      const holdId = await creditService.createHold(user.id, estCredits, undefined);

      const { createRun } = await import("../lib/pastel-agent/run-store");
      const { startAgentLoop } = await import("../lib/pastel-agent/engine");

      const run = await createRun({
        projectId: parsed.data.projectId,
        userId: user.id,
        prompt: parsed.data.prompt,
        answers: parsed.data.answers ?? {},
      });

      startAgentLoop(run.id, parsed.data.prompt, parsed.data.answers ?? {}, parsed.data.projectId, holdId, user.id).catch(
        (err) => console.error("[pastel-agent] loop crashed:", err instanceof Error ? err.message : err),
      );

      return res.status(201).json({ runId: run.id, status: "running", holdId });
    } catch (err: any) {
      console.error("[pastel-agent] generate error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Run event stream (SSE) ───────────────────────────────────────────
  app.get("/api/pastel-agent/runs/:runId/events", async (req: Request, res: Response) => {
    const runId = String(req.params.runId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const write = (event: PastelEvent) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch {}
    };

    const live = getRunLiveStatus(runId);
    let unsubscribe: (() => void) | null = null;

    try {
      const state = await getRunState(runId);
      if (!state) {
        write({ type: "error", message: "Run not found" });
        res.end();
        return;
      }
      unsubscribe = subscribeToRun(runId, write);

      if (!live || live.status !== "running") {
        if (state.run.status === "done") {
          const manifest = (state.run.manifest ?? {}) as unknown as AgentManifest;
          write({
            type: "done",
            result: {
              screens: manifest.screens ?? [],
              docs: manifest.docs ?? [],
              brandKit: manifest.brandKit ?? null,
              failedScreens: manifest.failedScreens ?? [],
            },
          });
        } else if (state.run.status === "error") {
          write({ type: "error", message: state.run.error || "Run failed" });
        }
      }
    } catch (err: any) {
      write({ type: "error", message: err?.message || "Failed to attach to run" });
    }

    const heartbeat = setInterval(() => {
      try { res.write(`: heartbeat\n\n`); } catch {}
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe?.();
      try { res.end(); } catch {}
    });
  });

  // ── Project agent state (restore after refresh / new tab) ───────────
  app.get("/api/pastel-agent/projects/:projectId/state", async (req: Request, res: Response) => {
    try {
      const state = await getLatestRunForProject(String(req.params.projectId));
      if (!state) return res.json({ run: null });

      return res.json({
        run: {
          id: state.run.id,
          projectId: state.run.projectId,
          prompt: state.run.prompt,
          answers: state.run.answers,
          title: state.run.title,
          status: state.run.status,
          phase: state.run.phase,
          error: state.run.error,
          manifest: state.run.manifest,
          createdAt: state.run.createdAt,
        },
        docs: state.docs.map((d) => ({ path: d.path, title: d.title, kind: d.kind, content: d.content })),
        files: state.files
          .filter((f) => f.kind !== "build")
          .map((f) => ({ path: f.path, kind: f.kind, content: f.content })),
        liveStatus: state.liveStatus,
        livePhase: state.livePhase,
      });
    } catch (err: any) {
      console.error("[pastel-agent] state error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Screen preview ──────────────────────────────────────────────────
  app.get("/api/pastel-agent/runs/:runId/preview/:screen", async (req: Request, res: Response) => {
    try {
      const runId = String(req.params.runId);
      const screen = String(req.params.screen);
      const state = await getRunState(runId);
      if (!state) return res.status(404).send("Run not found");

      const bundle = state.files.find((f) => f.kind === "build" && f.path === `.build/${screen}.js`);
      const styles = state.files.find((f) => f.path === "src/styles.css");

      if (!bundle) {
        return res.status(404).send(`No verified build for screen "${screen}"`);
      }

      const manifest = (state.run.manifest ?? {}) as unknown as AgentManifest;
      const brandKit = manifest.brandKit as BrandKit | null;

      const fontFamilies = brandKit?.fonts ? [...new Set(Object.values(brandKit.fonts))] : [];
      const fontLinks = fontFamilies
        .map(
          (f) =>
            `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`,
        )
        .join("\n");

      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'none'",
          "script-src 'unsafe-inline' https://cdn.tailwindcss.com",
          "style-src 'unsafe-inline' https://fonts.googleapis.com",
          "font-src https://fonts.gstatic.com",
          "img-src data:",
          "frame-ancestors 'self'",
        ].join("; "),
      );
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "private, max-age=60");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(screen)}</title>
${fontLinks}
<script src="https://cdn.tailwindcss.com"></script>
<style>
${styles?.content ?? "* { box-sizing: border-box; margin: 0; padding: 0; }"}
html, body { height: 100%; }
</style>
<script>
(function () {
  function send(msg) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    send({ type: "pastel:error", message: e.message || "Runtime error" });
  });
  window.addEventListener("unhandledrejection", function (e) {
    send({ type: "pastel:error", message: String((e.reason && e.reason.message) || e.reason || "Unhandled rejection") });
  });
  setTimeout(function () {
    var root = document.getElementById("root");
    if (!window.__pastelMounted && root && root.children.length === 0) {
      send({ type: "pastel:blank" });
    }
    reportHeight();
  }, 9000);
  function reportHeight() {
    var h = document.documentElement.scrollHeight;
    if (h > 50) send({ type: "pastel:height", height: h });
  }
  if (typeof MutationObserver !== "undefined") {
    var timer = null;
    var obs = new MutationObserver(function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(reportHeight, 200);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  }
})();
</script>
</head>
<body>
<div id="root"></div>
<script>
${bundle.content}
</script>
</body>
</html>`;

      return res.send(html);
    } catch (err: any) {
      console.error("[pastel-agent] preview error:", err?.message || err);
      return res.status(500).send("Preview failed");
    }
  });
}

async function getPlanTier(userId: string): Promise<PlanTier> {
  const sub = await storage.getSubscription(userId);
  return (sub?.plan as PlanTier) || "free";
}

function estimateRunCredits(prompt: string): number {
  const totalEstChars = prompt.length + 200000;
  const avgModelPrice = 0.000003;
  const estTokens = Math.ceil(totalEstChars / 4);
  const estCostDollars = estTokens * avgModelPrice;
  return Math.max(2, Math.ceil(estCostDollars * 5 * 100) / 100);
}

function clarifySystemPromptLength(): number {
  return 500;
}
