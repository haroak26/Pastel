import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { injectMeta } from "./html-inject";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDistPublic(): string {
  const fromDirname = path.resolve(__dirname, "../public");
  if (fs.existsSync(fromDirname + "/index.html")) return fromDirname;
  const fromCwd = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(fromCwd + "/index.html")) return fromCwd;
  return path.resolve(__dirname, "public");
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPublic();
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (req, res) => {
    const html = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");
    const injected = injectMeta(html, req.originalUrl);
    res.status(200).set({ "Content-Type": "text/html" }).end(injected);
  });
}
