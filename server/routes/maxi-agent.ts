import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { MaxiEvent, AgentManifest, BrandKit } from "../lib/maxi-agent/types";
import { getRunState, getLatestRunForProject, subscribeToRun, getRunLiveStatus } from "../lib/maxi-agent/run-store";
import type { User, PlanTier } from "@shared/schema";
import { requireAuth } from "./helpers";
import { storage } from "../storage";
import * as creditService from "../lib/credit-service";
import { calcCost, CREDIT_PER_DOLLAR } from "../lib/pricing";
import { MODELS, MAX_TOKENS_PER_CALL } from "../lib/maxi-agent/gateway";

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

export function registerMaxiAgentRoutes(app: Express) {
  // ── Knowledge base catalog (company gallery for the clarify step) ─────
  app.get("/api/maxi-agent/knowledge", requireAuth, async (_req: Request, res: Response) => {
    try {
      const { listCatalog } = await import("../lib/maxi-agent/knowledge/index");
      const catalog = await listCatalog();
      return res.json({ companies: catalog });
    } catch (err: any) {
      console.error("[maxi-agent] knowledge error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Company reference imagery (V10) — preview.png / references/*.png ────
  app.get("/api/maxi-agent/knowledge/:slug/image/:file", requireAuth, async (req: Request, res: Response) => {
    try {
      const { readCompanyImage, companyImageFiles } = await import("../lib/maxi-agent/knowledge/index");
      const slug = String(req.params.slug ?? "");
      const file = String(req.params.file ?? "");
      const available = companyImageFiles(slug);
      if (!available.includes(file)) {
        return res.status(404).json({ message: "Image not found" });
      }
      const buf = readCompanyImage(slug, file);
      if (!buf) return res.status(404).json({ message: "Image not found" });
      const mime = file.endsWith(".png") ? "image/png"
        : file.endsWith(".webp") ? "image/webp"
        : file.endsWith(".jpg") || file.endsWith(".jpeg") ? "image/jpeg"
        : "application/octet-stream";
      res.set("Content-Type", mime);
      res.set("Cache-Control", "public, max-age=3600");
      return res.send(buf);
    } catch (err: any) {
      console.error("[maxi-agent] company image error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Clarify (intake + ambiguity engine + inspiration suggestions) ─────
  app.post("/api/maxi-agent/clarify", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const parsed = clarifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }

      const planTier = await getPlanTier(user.id);
      const estimatedPrompt = 6000 + parsed.data.prompt.length;
      const estimatedOutput = MAX_TOKENS_PER_CALL.clarify * 4;
      const estCost = calcCost(MODELS.clarify, estimatedPrompt, estimatedOutput);
      const allowance = await creditService.checkAllowance(user.id, planTier, estCost.credits);
      if (!allowance.allowed) {
        return res.status(402).json({ message: allowance.reason, balance: allowance.balance, monthlyUsed: allowance.monthlyUsed, monthlyAllowance: allowance.monthlyAllowance });
      }

      const { runClarify } = await import("../lib/maxi-agent/agents/clarify");
      const { result } = await runClarify({ prompt: parsed.data.prompt });
      return res.json(result);
    } catch (err: any) {
      const message = err?.message || String(err);
      const code = err?.status || err?.statusCode || 500;
      console.error("[maxi-agent] clarify error:", message);
      return res.status(code).json({ message });
    }
  });

  // ── Cost estimate (before the user commits) ──────────────────────────
  app.get("/api/maxi-agent/estimate", requireAuth, async (req: Request, res: Response) => {
    try {
      const prompt = String(req.query.prompt ?? "").slice(0, 4000);
      const estimatedCredits = estimateRunCredits(prompt);
      const user = req.user as User;
      const balance = await creditService.getBalance(user.id);
      return res.json({ estimatedCredits, balance: balance.balance, minRequired: 5 });
    } catch (err: any) {
      console.error("[maxi-agent] estimate error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Start a run ──────────────────────────────────────────────────────
  app.post("/api/maxi-agent/generate", requireAuth, async (req: Request, res: Response) => {
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

      const { createRun } = await import("../lib/maxi-agent/run-store");
      const { startAgentLoop } = await import("../lib/maxi-agent/engine");

      const run = await createRun({
        projectId: parsed.data.projectId,
        userId: user.id,
        prompt: parsed.data.prompt,
        answers: parsed.data.answers ?? {},
      });

      let holdId: string | undefined;
      try {
        holdId = await creditService.createHold(user.id, estCredits, run.id);
      } catch (err) {
        console.error("[maxi-agent] hold creation failed — run will not be chargeable:", err instanceof Error ? err.message : err);
      }

      startAgentLoop(run.id, parsed.data.prompt, parsed.data.answers ?? {}, parsed.data.projectId, holdId, user.id, {
        maxCredits: Math.max(estCredits * 2, 10),
         holdAmount: estCredits,
      }).catch(
        (err) => console.error("[maxi-agent] loop crashed:", err instanceof Error ? err.message : err),
      );

      return res.status(201).json({ runId: run.id, status: "running", holdId });
    } catch (err: any) {
      console.error("[maxi-agent] generate error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Run event stream (SSE) ───────────────────────────────────────────
  app.get("/api/maxi-agent/runs/:runId/events", async (req: Request, res: Response) => {
    const runId = String(req.params.runId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const write = (event: MaxiEvent) => {
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
        if (state.run.status === "done" || state.run.status === "done_needs_review") {
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

  // ── Wireframe confirmation gate decision (V8 §4.4) ─────────────────────
  // The pipeline blocks in the `wireframe-review` phase until the client
  // posts approve / revise / cancel here. Revisions are bounded; a cancel
  // refunds the credit hold (the run's `startPicassoAgentLoop` handles that).
  const wireframeDecisionSchema = z.object({
    action: z.enum(["approve", "revise", "cancel"]),
    notes: z.record(z.string()).optional(),
  });

  app.post("/api/maxi-agent/runs/:runId/wireframe-decision", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = wireframeDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid decision", errors: parsed.error.issues });
      }
      const runId = String(req.params.runId);
      const { resolveWireframeReview, getPendingWireframeReview } = await import("../lib/maxi-agent/wireframe-gate");

      if (!getPendingWireframeReview(runId)) {
        return res.status(409).json({ message: "No wireframe review is pending for this run (already decided or timed out)." });
      }

      const decision = parsed.data.action === "revise"
        ? { action: "revise" as const, notes: parsed.data.notes ?? {} }
        : { action: parsed.data.action as "approve" | "cancel" };
      const resolved = resolveWireframeReview(runId, decision);
      if (!resolved) {
        return res.status(409).json({ message: "Wireframe review already resolved." });
      }
      return res.json({ ok: true, action: parsed.data.action });
    } catch (err: any) {
      console.error("[maxi-agent] wireframe decision error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Project agent state (restore after refresh / new tab) ───────────
  app.get("/api/maxi-agent/projects/:projectId/state", async (req: Request, res: Response) => {
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
      console.error("[maxi-agent] state error:", err?.message || err);
      return res.status(500).json({ message: err?.message || "Internal error" });
    }
  });

  // ── Screen preview ──────────────────────────────────────────────────
  app.get("/api/maxi-agent/runs/:runId/preview/:screen", async (req: Request, res: Response) => {
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
          "script-src 'unsafe-inline'",
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
<style>
${styles?.content ?? "* { box-sizing: border-box; margin: 0; padding: 0; }"}
html, body { height: 100%; }
/* Pastel editor — component selection & resize chrome */
html.maxi-edit-on * { cursor: default !important; }
html.maxi-edit-on:not(.maxi-has-sel) *:hover { outline: 1px solid rgba(11, 153, 255, 0.4) !important; outline-offset: -1px; }
html.maxi-edit-on .maxi-sel, html.maxi-edit-on .maxi-sel:hover { outline: 2px solid #0B99FF !important; outline-offset: -2px; }
html.maxi-edit-on .maxi-handle { outline: none !important; }
html.maxi-dragging * { user-select: none !important; -webkit-user-select: none !important; }
</style>
<script>
/* Pastel editor — injected into every preview so components are
   individually selectable (blue box + resize handles) and the screen
   background can be grabbed to drag the frame around the canvas. */
(function () {
  var EDIT = false;
  var sel = null;
  var dragState = null;
  var hud = null;
  var chip = null;

  function send(msg) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch (e) {}
  }
  function makeEl(tag, style, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (style) el.style.cssText = style;
    return el;
  }
  function ensureHud() {
    if (hud) return hud;
    hud = makeEl("div", "position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;", "maxi-hud");
    document.body.appendChild(hud);
    chip = makeEl("div", "position:fixed;padding:2px 6px;background:#0B99FF;color:#fff;font:600 10px/1.4 Inter,system-ui,sans-serif;border-radius:3px;pointer-events:none;white-space:nowrap;z-index:2147483647;display:none;", "maxi-chip");
    document.body.appendChild(chip);
    return hud;
  }
  function handleCursor(dir) {
    switch (dir) {
      case "n": case "s": return "ns-resize";
      case "e": case "w": return "ew-resize";
      case "nw": case "se": return "nwse-resize";
      default: return "nesw-resize";
    }
  }
  function labelOf(el) {
    var t = el.tagName ? el.tagName.toLowerCase() : "?";
    if (el.id) return t + "#" + el.id;
    var cn = el.className;
    if (typeof cn === "string") {
      var parts = cn.split(/\\s+/).filter(function (c) { return c && c !== "maxi-sel"; }).slice(0, 2);
      if (parts.length) return t + "." + parts.join(".");
    }
    return t;
  }
  function refreshHud() {
    if (!sel) return;
    var r = sel.getBoundingClientRect();
    ensureHud();
    hud.innerHTML = "";
    var dirs = [["nw",0,0],["n",0.5,0],["ne",1,0],["e",1,0.5],["se",1,1],["s",0.5,1],["sw",0,1],["w",0,0.5]];
    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      var h = makeEl("div",
        "position:absolute;width:9px;height:9px;background:#fff;border:1.5px solid #0B99FF;border-radius:2px;" +
        "transform:translate(-50%,-50%);pointer-events:auto;cursor:" + handleCursor(d[0]) +
        ";left:" + (r.left + d[1] * r.width) + "px;top:" + (r.top + d[2] * r.height) + "px;",
        "maxi-handle");
      h.setAttribute("data-dir", d[0]);
      hud.appendChild(h);
    }
    chip.textContent = labelOf(sel);
    chip.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 140)) + "px";
    chip.style.top = Math.max(4, r.top - 22) + "px";
  }
  function clearSel() {
    if (sel) { sel.classList.remove("maxi-sel"); sel = null; }
    if (hud) hud.innerHTML = "";
    if (chip) chip.style.display = "none";
    document.documentElement.classList.remove("maxi-has-sel");
  }
  function select(el) {
    clearSel();
    if (!el) return;
    sel = el;
    el.classList.add("maxi-sel");
    document.documentElement.classList.add("maxi-has-sel");
    if (chip) chip.style.display = "block";
    refreshHud();
  }

  document.addEventListener("pointerdown", function (e) {
    if (!EDIT) return;
    var handle = e.target.closest ? e.target.closest(".maxi-handle") : null;
    if (handle && sel) {
      e.preventDefault();
      e.stopPropagation();
      var r = sel.getBoundingClientRect();
      dragState = { mode: "resize", dir: handle.getAttribute("data-dir"), sx: e.clientX, sy: e.clientY, rect: { l: r.left, t: r.top, w: r.width, h: r.height } };
      document.documentElement.classList.add("maxi-dragging");
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      return;
    }
    var rootEl = document.getElementById("root");
    if (e.target === rootEl || e.target === document.body || e.target === document.documentElement) {
      e.preventDefault();
      dragState = { mode: "screen", sx: e.clientX, sy: e.clientY, moved: 0 };
      document.documentElement.classList.add("maxi-dragging");
      return;
    }
    select(e.target);
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener("pointermove", function (e) {
    if (!dragState) return;
    if (dragState.mode === "resize") {
      var r = dragState.rect;
      var dir = dragState.dir;
      var w = r.w, h = r.h;
      if (dir.indexOf("e") >= 0) w = r.w + (e.clientX - dragState.sx);
      if (dir.indexOf("s") >= 0) h = r.h + (e.clientY - dragState.sy);
      if (dir.indexOf("w") >= 0) w = r.w - (e.clientX - dragState.sx);
      if (dir.indexOf("n") >= 0) h = r.h - (e.clientY - dragState.sy);
      w = Math.max(16, Math.round(w));
      h = Math.max(16, Math.round(h));
      sel.style.width = w + "px";
      sel.style.height = h + "px";
      refreshHud();
    } else if (dragState.mode === "screen") {
      var dx = e.clientX - dragState.sx;
      var dy = e.clientY - dragState.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = 1;
      if (dragState.moved) send({ type: "maxi:screen-drag", dx: dx, dy: dy, px: e.clientX, py: e.clientY });
    }
  });

  function endDrag() {
    if (dragState && dragState.mode === "screen" && dragState.moved) {
      send({ type: "maxi:screen-drag-end" });
    }
    dragState = null;
    document.documentElement.classList.remove("maxi-dragging");
  }
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || typeof d !== "object") return;
    if (d.type === "maxi:edit-mode") {
      var on = !!d.on;
      if (on === EDIT) return;
      EDIT = on;
      if (!on) clearSel();
    }
  });
})();
</script>
</head>
(function () {
  function send(msg) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, "*"); } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    send({ type: "maxi:error", message: e.message || "Runtime error" });
  });
  window.addEventListener("unhandledrejection", function (e) {
    send({ type: "maxi:error", message: String((e.reason && e.reason.message) || e.reason || "Unhandled rejection") });
  });
  setTimeout(function () {
    var root = document.getElementById("root");
    if (!window.__maxiMounted && root && root.children.length === 0) {
      send({ type: "maxi:blank" });
    }
    reportHeight();
  }, 9000);
  function reportHeight() {
    var h = document.documentElement.scrollHeight;
    if (h > 50) send({ type: "maxi:height", height: h });
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
      console.error("[maxi-agent] preview error:", err?.message || err);
      return res.status(500).send("Preview failed");
    }
  });
}

async function getPlanTier(userId: string): Promise<PlanTier> {
  const sub = await storage.getSubscription(userId);
  return (sub?.plan as PlanTier) || "free";
}

/**
 * Maxi Agent v25 run cost estimate.
 *
 * Call graph (the Auteur pipeline):
 *   direction (strong)       × 1   — the concept blueprint
 *   author (strong)          × ~11 — components ∥ screens in parallel
 *   repair (strong)          × 0-3 — bounded polish
 *   review (strong)          × 1   — advisory scorecard
 */
function estimateRunCredits(prompt: string): number {
  const customComponents = 8;
  const screens = 3;
  const repairs = 2;

  const directionCost = calcCost(MODELS.direction, prompt.length + 6000, 9000);
  const componentCost = calcCost(MODELS.author, 4000, 5000);
  const screenCost = calcCost(MODELS.author, 9000, 6000);
  const repairCost = calcCost(MODELS.repair, 6000, 5000);
  const reviewCost = calcCost(MODELS.review, prompt.length + 3000, 1500);

  const subtotal =
    directionCost.costDollars
    + componentCost.costDollars * customComponents * 1.2
    + screenCost.costDollars * screens
    + repairCost.costDollars * repairs
    + reviewCost.costDollars;

  const totalDollars = subtotal * 1.15 + 0.002;
  return Math.max(3, Math.ceil(totalDollars * CREDIT_PER_DOLLAR * 100) / 100);
}
