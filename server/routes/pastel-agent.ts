import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { PastelEvent } from "../lib/pastel-agent/types";

const clarifySchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

const generateSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  answers: z.record(z.string()).optional(),
});

export function registerPastelAgentRoutes(app: Express) {
  app.post("/api/pastel-agent/clarify", async (req: Request, res: Response) => {
    try {
      const parsed = clarifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }

      const { runClarify } = await import("../lib/pastel-agent/engine");
      const result = await runClarify(parsed.data.prompt);
      return res.json(result);
    } catch (err: any) {
      const message = err?.message || String(err);
      const code = err?.status || err?.statusCode || 500;
      console.error("[pastel-agent] clarify error:", message);
      return res.status(code).json({ message });
    }
  });

  app.post("/api/pastel-agent/generate", async (req: Request, res: Response) => {
    try {
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const emit = (event: PastelEvent) => {
        try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch {}
      };

      try {
        const { runPipeline } = await import("../lib/pastel-agent/engine");
        const result = await runPipeline(parsed.data.prompt, emit, parsed.data.answers);
        emit({
          type: "done",
          result: {
            code: result.finalCode || result.code,
            concept: { mood: result.concept.mood, seed: result.usedSeed },
            designSystem: { colors: result.designSystem.colors, spacing: result.designSystem.spacing },
            critique: result.critique,
          },
        });
      } catch (err: any) {
        const message = err?.message || String(err);
        console.error("[pastel-agent] pipeline error:", message);
        emit({ type: "error", message });
      }

      res.end();
    } catch (err: any) {
      console.error("[pastel-agent] generate error:", err?.message || err);
      if (!res.headersSent) {
        return res.status(500).json({ message: err?.message || "Internal error" });
      }
      try { res.end(); } catch {}
    }
  });
}
