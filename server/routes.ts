import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import passport from "passport";
import rateLimit from "express-rate-limit";
import multer from "multer";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, comparePasswords } from "./auth";
import { sendVerificationEmail, sendEmailChangeVerification, sendPasswordResetEmail, sendTwoFactorEmail, sendAdminTwoFactorEmail, sendPinEmail, sendWelcomeEmail, sendWorkspaceInviteEmail, sendNewDeviceEmail } from "./email";
import { generateTotpSecret, verifyTotp, buildOtpauthUrl } from "./totp";
import { registerAuthRoutes } from "./routes/auth";
import { registerRemainingRoutes } from "./routes/remaining";
import { registerPastelAgentRoutes } from "./routes/pastel-agent";
import { buildOnboardingSession } from "./onboarding-session";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
  PLAN_LIMITS,
  type PlanTier,
  type User,
  workspaces,
  users,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingStepSchema,
} from "@shared/schema";

// Stripe plan helpers — single source of truth for what Stripe price IDs map to which tier.
const STRIPE_API_VERSION = "2026-02-25.clover" as const;
type PaidPlan = "dev" | "startup" | "scale" | "enterprise";

function stripePriceFor(plan: PaidPlan): string | null {
  const map: Record<PaidPlan, string | undefined> = {
    dev: process.env.STRIPE_PRICE_DEV,
    startup: process.env.STRIPE_PRICE_STARTUP,
    scale: process.env.STRIPE_PRICE_SCALE,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[plan] || null;
}

function planFromPriceId(priceId: string | undefined | null): PaidPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_DEV) return "dev";
  if (priceId === process.env.STRIPE_PRICE_STARTUP) return "startup";
  if (priceId === process.env.STRIPE_PRICE_SCALE) return "scale";
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
  return null;
}

function safeUserPayload(u: User) {
  const {
    password: _p,
    emailVerificationToken: _t,
    emailVerificationExpiry: _e,
    pendingEmailToken: _pt,
    pendingEmailExpiry: _pe,
    passwordResetToken: _prt,
    passwordResetExpiry: _pre,
    totpSecret: _ts,
    ...rest
  } = u;
  const publicUserId = `usr_${createHash("sha256")
    .update(`${u.id}:${u.createdAt.toISOString()}`)
    .digest("hex")
    .slice(0, 24)}`;
  return { ...rest, publicUserId };
}


type LoginChallenge = {
  id: string;
  userId: string;
  email: string;
  code: string;
  token: string;
  expiresAt: number;
  verifiedAt?: number;
};

const loginChallenges = new Map<string, LoginChallenge>();

function createLoginChallenge(user: User): LoginChallenge {
  const id = randomBytes(16).toString("hex");
  const token = randomBytes(24).toString("hex");
  const code = String(randomInt(100000, 1000000));
  const challenge: LoginChallenge = {
    id,
    userId: user.id,
    email: user.email,
    code,
    token,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  loginChallenges.set(id, challenge);
  return challenge;
}

function getActiveChallenge(challengeId: string): LoginChallenge | null {
  const challenge = loginChallenges.get(challengeId);
  if (!challenge) return null;
  if (challenge.expiresAt < Date.now()) {
    loginChallenges.delete(challengeId);
    return null;
  }
  return challenge;
}

setInterval(() => {
  const now = Date.now();
  loginChallenges.forEach((challenge, id) => {
    if (challenge.expiresAt < now) loginChallenges.delete(id);
  });
}, 60_000).unref();

// ── New Device Detection ──────────────────────────────────────────────────────

const knownDevices = new Map<string, Set<string>>();

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = "Unknown browser";
  let os = "Unknown OS";

  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";

  if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("CrOS")) os = "ChromeOS";

  return { browser, os };
}

function isKnownDevice(userId: string, deviceFingerprint: string): boolean {
  const devices = knownDevices.get(userId);
  if (!devices) return false;
  return devices.has(deviceFingerprint);
}

function markDeviceKnown(userId: string, deviceFingerprint: string): void {
  let devices = knownDevices.get(userId);
  if (!devices) {
    devices = new Set();
    knownDevices.set(userId, devices);
  }
  devices.add(deviceFingerprint);
}

async function checkAndNotifyNewDevice(req: Request, user: User): Promise<void> {
  try {
    const ua = req.headers["user-agent"] || "";
    const ip = req.ip || req.socket.remoteAddress || "Unknown";
    const fingerprint = `${ua}|${ip}`;

    if (isKnownDevice(user.id, fingerprint)) return;

    const { browser, os } = parseUserAgent(ua);
    const baseUrl = getPublicUrl(req);
    const hostname = baseUrl.replace(/^https?:\/\//, "").split(".").slice(-2).join(".") || "Unknown";
    const location = `${hostname} (${ip})`;

    await sendNewDeviceEmail(user.email, user.displayName || user.email, {
      browser,
      os,
      ip,
      location,
      time: new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }),
    });

    markDeviceKnown(user.id, fingerprint);
  } catch (err) {
    console.error("[device] new device check failed:", err);
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export function normalizePublicUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function parseAbsoluteUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!parsed.protocol || !parsed.host) return null;
    return normalizePublicUrl(parsed.toString());
  } catch {
    return null;
  }
}

export function firstHeaderValue(value: string | string[] | undefined) {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const first = raw.split(",")[0]?.trim();
  return first || null;
}


export function extractClientIp(req: Request) {
  const candidates = [
    firstHeaderValue(req.headers["cf-connecting-ip"]),
    firstHeaderValue(req.headers["x-real-ip"]),
    firstHeaderValue(req.headers["x-client-ip"]),
    firstHeaderValue(req.headers["x-forwarded-for"]),
    req.socket.remoteAddress ?? null,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const ip = value.replace(/^::ffff:/, "").trim();
    if (!ip || ip.toLowerCase() === "unknown") continue;
    return ip;
  }
  return "";
}


export function getPublicUrl(req: Request) {
  const envPublicUrl = parseAbsoluteUrl(process.env.PUBLIC_URL);
  if (envPublicUrl) return envPublicUrl;
  return normalizePublicUrl(`${req.protocol}://${req.hostname}`);
}



export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });

  const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });

  const publicRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });

  const publicStrictRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });

  // ── Verification attempt tracking (in-memory) ───────────────────────────
  const verificationAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
  const MAX_VERIFICATION_ATTEMPTS = 5;

  function trackVerificationAttempt(email: string): boolean {
    const normalized = email.toLowerCase();
    const entry = verificationAttempts.get(normalized);
    const now = Date.now();
    if (!entry) {
      verificationAttempts.set(normalized, { attempts: 1, lastAttempt: now });
      return true;
    }
    if (entry.attempts >= MAX_VERIFICATION_ATTEMPTS) return false;
    entry.attempts += 1;
    entry.lastAttempt = now;
    return true;
  }

  function clearVerificationAttempts(email: string) {
    verificationAttempts.delete(email.toLowerCase());
  }

  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    verificationAttempts.forEach((v, k) => { if (v.lastAttempt < cutoff) verificationAttempts.delete(k); });
  }, 60_000).unref();

  // ── Health Check ──────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.status(200).json({ status: "ok", db: true });
    } catch (e) {
      console.error("[health] db check failed:", e);
      res.status(503).json({ status: "degraded", db: false });
    }
  });

  registerAuthRoutes(app);
  registerRemainingRoutes(app);
  registerPastelAgentRoutes(app);

  return httpServer;
}
