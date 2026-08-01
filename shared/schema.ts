import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  real,
  json,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Email verification
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  pendingEmail: text("pending_email"),
  pendingEmailToken: text("pending_email_token"),
  pendingEmailExpiry: timestamp("pending_email_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  // Email preferences
  newsletterSubscribed: boolean("newsletter_subscribed").notNull().default(true),
  productUpdates: boolean("product_updates").notNull().default(true),
  securityAlerts: boolean("security_alerts").notNull().default(true),
  billingUpdates: boolean("billing_updates").notNull().default(true),
  emailChangeCount: integer("email_change_count").notNull().default(0),
  theme: text("theme").notNull().default("system"),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  lastWorkspaceId: text("last_workspace_id"),
});

export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password" | "emailVerificationToken" | "emailVerificationExpiry" | "pendingEmailToken" | "pendingEmailExpiry" | "passwordResetToken" | "passwordResetExpiry">;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(64, "Display name too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  avatarUrl: z.string().max(500, "Avatar URL too long").nullable().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const onboardingStepSchema = z.object({
  step: z.number().int().min(0),
});

// ── Workspaces ─────────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;

export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id"),
  email: text("email").notNull(),
  role: text("role").notNull().default("editor"),
  inviteToken: text("invite_token"),
  inviteExpiry: timestamp("invite_expiry"),
  status: text("status").notNull().default("pending"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("workspace_member_email_idx").on(t.workspaceId, t.email),
]);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required").max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().url("Logo must be a valid URL").max(1000).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  logoUrl: z.string().url().max(1000).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
});

export const inviteWorkspaceMemberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  displayName: z.string().min(1).max(200).optional(),
});

export const bulkInviteMemberSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

// ── Subscriptions & Plans ─────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("free"),
  subscriptionStatus: text("subscription_status"),
  planRenewsAt: timestamp("plan_renews_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  billingPeriod: text("billing_period").notNull().default("monthly"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;

export const PLAN_TIERS = ["free", "pro", "team", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export type BillingPeriod = "monthly" | "annual";

export type PlanLimits = {
  label: string;
  prices: { monthly: number; annual: number };
  projects: number | "unlimited";
  designFiles: number | "unlimited";
  editors: number | "unlimited";
  viewers: number | "unlimited";
  storage: number;
  versionHistory: number;
  components: number;
  customFonts: boolean;
  exportPresets: boolean;
  advancedPrototyping: boolean;
  apiAccess: boolean;
  ssO: boolean;
  prioritySupport: boolean;
  aiCredits: { monthly: number | "unlimited"; daily: number | "unlimited" };
};

// Tier keys map to the new plan lineup:
//   free → Hobby, pro → Individual, team → Professional, enterprise → Enterprise
// 1 credit = $0.01 of AI API usage.
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    label: "Hobby", prices: { monthly: 0, annual: 0 },
    projects: 10, designFiles: 10, editors: 1, viewers: 1, storage: 100,
    versionHistory: 7, components: 10, customFonts: false,
    exportPresets: false, advancedPrototyping: false, apiAccess: false, ssO: false,
    prioritySupport: false, aiCredits: { monthly: 150, daily: 50 },
  },
  pro: {
    label: "Individual", prices: { monthly: 25, annual: 255 },
    projects: "unlimited", designFiles: 100, editors: 1, viewers: 10, storage: 2048,
    versionHistory: 30, components: 300, customFonts: true,
    exportPresets: true, advancedPrototyping: true, apiAccess: true, ssO: false,
    prioritySupport: false, aiCredits: { monthly: 1000, daily: 250 },
  },
  team: {
    label: "Professional", prices: { monthly: 50, annual: 510 },
    projects: "unlimited", designFiles: 500, editors: 5, viewers: 50, storage: 10240,
    versionHistory: 90, components: 1000, customFonts: true,
    exportPresets: true, advancedPrototyping: true, apiAccess: true, ssO: false,
    prioritySupport: true, aiCredits: { monthly: "unlimited", daily: "unlimited" },
  },
  enterprise: {
    label: "Enterprise", prices: { monthly: 75, annual: 765 },
    projects: "unlimited", designFiles: "unlimited", editors: "unlimited", viewers: "unlimited", storage: 51200,
    versionHistory: 365, components: 10000, customFonts: true,
    exportPresets: true, advancedPrototyping: true, apiAccess: true, ssO: true,
    prioritySupport: true, aiCredits: { monthly: "unlimited", daily: "unlimited" },
  },
};

// ── Usage Tracking ────────────────────────────────────────────────────────

export const usage = pgTable("usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  storageUsed: integer("storage_used").notNull().default(0),
  projectsCount: integer("projects_count").notNull().default(0),
  designFilesCount: integer("design_files_count").notNull().default(0),
  versionCount: integer("version_count").notNull().default(0),
  componentCount: integer("component_count").notNull().default(0),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Usage = typeof usage.$inferSelect;

// ── User Credits ─────────────────────────────────────────────────────────

export const userCredits = pgTable("user_credits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  balance: real("balance").notNull().default(0),
  lifetimePurchased: real("lifetime_purchased").notNull().default(0),
  lifetimeUsed: real("lifetime_used").notNull().default(0),
  dailyUsed: real("daily_used").notNull().default(0),
  dailyResetAt: timestamp("daily_reset_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserCredits = typeof userCredits.$inferSelect;

export const CREDIT_TRANSACTION_TYPES = ["purchase", "usage", "usage_hold", "usage_refund", "grant"] as const;
export type CreditTransactionType = (typeof CREDIT_TRANSACTION_TYPES)[number];

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  balanceAfter: real("balance_after").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("credit_transactions_user_idx").on(t.userId, t.createdAt.desc()),
]);

export type CreditTransaction = typeof creditTransactions.$inferSelect;

export const CREDIT_HOLD_STATUSES = ["active", "released", "refunded", "cancelled"] as const;
export type CreditHoldStatus = (typeof CREDIT_HOLD_STATUSES)[number];

export const creditHolds = pgTable("credit_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  runId: uuid("run_id"),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("credit_holds_user_idx").on(t.userId),
  index("credit_holds_run_idx").on(t.runId),
]);

export type CreditHold = typeof creditHolds.$inferSelect;

// ── API Integrations ───────────────────────────────────────────────────────

export const apiIntegrations = pgTable("api_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  provider: text("provider").notNull(),
  apiKey: text("api_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiIntegration = typeof apiIntegrations.$inferSelect;

// ── Onboarding ────────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  "signup",
  "email_verification",
  "profile_name",
  "workspace",
  "finalizing",
  "complete",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_SESSION_STATUSES = ["active", "complete", "abandoned"] as const;
export type OnboardingSessionStatus = (typeof ONBOARDING_SESSION_STATUSES)[number];

export const ONBOARDING_TASK_STATUSES = ["not_started", "pending", "complete", "skipped", "failed"] as const;
export type OnboardingTaskStatus = (typeof ONBOARDING_TASK_STATUSES)[number];

export const onboardingSessions = pgTable("onboarding_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  status: text("status").notNull().default("active"),
  currentStep: text("current_step").notNull().default("signup"),
  emailVerificationStatus: text("email_verification_status").notNull().default("pending"),
  displayNameStatus: text("display_name_status").notNull().default("not_started"),
  workspaceStatus: text("workspace_status").notNull().default("not_started"),
  workspaceId: uuid("workspace_id"),
  workspaceName: text("workspace_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (t) => [
  uniqueIndex("onboarding_sessions_user_id_idx").on(t.userId),
]);

export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export const ONBOARDING_TOTAL_STEPS = ONBOARDING_STEPS.length;

// ── Projects ───────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  workspaceId: uuid("workspace_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  color: text("color").notNull().default("#8b5cf6"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("projects_workspace_idx").on(t.workspaceId, t.isArchived),
]);

export type Project = typeof projects.$inferSelect;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  coverUrl: z.string().url().max(1000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isArchived: z.boolean().optional(),
});

// ── Project Members ────────────────────────────────────────────────────────

export const PROJECT_ROLES = ["owner", "editor", "viewer"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull().default("editor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("project_member_idx").on(t.projectId, t.userId),
]);

export type ProjectMember = typeof projectMembers.$inferSelect;

// ── Design Files ──────────────────────────────────────────────────────────

export const DESIGN_FILE_TYPES = ["design", "prototype", "whiteboard"] as const;
export type DesignFileType = (typeof DESIGN_FILE_TYPES)[number];

export const designFiles = pgTable("design_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("design"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  canvasWidth: integer("canvas_width").notNull().default(1440),
  canvasHeight: integer("canvas_height").notNull().default(900),
  version: integer("version").notNull().default(1),
  isFavorited: boolean("is_favorited").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("design_files_project_idx").on(t.projectId, t.isArchived),
  index("design_files_workspace_idx").on(t.workspaceId),
]);

export type DesignFile = typeof designFiles.$inferSelect;

export const createDesignFileSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(DESIGN_FILE_TYPES).default("design"),
  description: z.string().max(2000).optional(),
  canvasWidth: z.number().int().min(1).max(10000).optional(),
  canvasHeight: z.number().int().min(1).max(10000).optional(),
});

export const updateDesignFileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  thumbnailUrl: z.string().url().max(1000).nullable().optional(),
  canvasWidth: z.number().int().min(1).max(10000).optional(),
  canvasHeight: z.number().int().min(1).max(10000).optional(),
  isFavorited: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ── Design Versions ────────────────────────────────────────────────────────

export const designVersions = pgTable("design_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  designFileId: uuid("design_file_id").notNull().references(() => designFiles.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  data: jsonb("data").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueFileVersion: uniqueIndex("design_version_unique").on(t.designFileId, t.versionNumber),
}));

export type DesignVersion = typeof designVersions.$inferSelect;

export const createDesignVersionSchema = z.object({
  description: z.string().max(500).optional(),
});

// ── Canvases (pages within a design file) ─────────────────────────────────

export const canvases = pgTable("canvases", {
  id: uuid("id").primaryKey().defaultRandom(),
  designFileId: uuid("design_file_id").notNull().references(() => designFiles.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Canvas 1"),
  orderIndex: integer("order_index").notNull().default(0),
  backgroundColor: text("background_color").notNull().default("#ffffff"),
  width: integer("width").notNull().default(1440),
  height: integer("height").notNull().default(900),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("canvases_design_file_idx").on(t.designFileId, t.orderIndex),
]);

export type Canvas = typeof canvases.$inferSelect;

export const createCanvasSchema = z.object({
  name: z.string().min(1).max(200).default("Canvas 1"),
  backgroundColor: z.string().default("#ffffff"),
  width: z.number().int().min(1).max(10000).default(1440),
  height: z.number().int().min(1).max(10000).default(900),
});

export const updateCanvasSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  orderIndex: z.number().int().min(0).optional(),
  backgroundColor: z.string().optional(),
  width: z.number().int().min(1).max(10000).optional(),
  height: z.number().int().min(1).max(10000).optional(),
});

// ── Layers (design elements on a canvas) ───────────────────────────────────

export const LAYER_TYPES = ["frame", "group", "text", "shape", "image", "svg", "component", "instance", "line", "ellipse", "rectangle", "polygon", "star", "vector", "boolean_operation"] as const;
export type LayerType = (typeof LAYER_TYPES)[number];

export const layers = pgTable("layers", {
  id: uuid("id").primaryKey().defaultRandom(),
  designFileId: uuid("design_file_id").notNull().references(() => designFiles.id, { onDelete: "cascade" }),
  canvasId: uuid("canvas_id").notNull().references(() => canvases.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  name: text("name").notNull().default("Layer"),
  type: text("type").notNull().default("rectangle"),
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  width: real("width").notNull().default(100),
  height: real("height").notNull().default(100),
  rotation: real("rotation").notNull().default(0),
  opacity: real("opacity").notNull().default(1),
  visible: boolean("visible").notNull().default(true),
  locked: boolean("locked").notNull().default(false),
  zIndex: integer("z_index").notNull().default(0),
  properties: jsonb("properties").$type<Record<string, unknown>>().default({}).notNull(),
  styles: jsonb("styles").$type<{
    fills?: Array<{ type: string; color?: string; opacity?: number }>;
    strokes?: Array<{ color: string; width: number }>;
    shadows?: Array<{ type: string; color: string; offsetX: number; offsetY: number; blur: number; spread: number }>;
    blurs?: Array<{ type: string; radius: number }>;
    cornerRadius?: number;
    borderRadius?: { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number };
    opacity?: number;
  }>().default({}).notNull(),
  exportSettings: jsonb("export_settings").$type<Array<{ format: string; suffix: string; constraint?: { type: string; value: number } }>>().default([]).notNull(),
  componentId: uuid("component_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("layers_canvas_idx").on(t.canvasId, t.zIndex),
  index("layers_parent_idx").on(t.parentId),
  index("layers_design_file_idx").on(t.designFileId),
]);

export type Layer = typeof layers.$inferSelect;

export const layerPropertiesSchema = z.object({
  name: z.string().min(1).max(200).default("Layer"),
  type: z.enum(LAYER_TYPES).default("rectangle"),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().default(100),
  height: z.number().default(100),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  properties: z.record(z.unknown()).default({}),
  styles: z.record(z.unknown()).default({}),
});

// ── Component Sets (reusable component libraries) ─────────────────────────

export const componentSets = pgTable("component_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("component_sets_workspace_idx").on(t.workspaceId),
]);

export type ComponentSet = typeof componentSets.$inferSelect;

// ── Components ────────────────────────────────────────────────────────────

export const components = pgTable("components", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull().unique(),
  componentSetId: uuid("component_set_id").references(() => componentSets.id, { onDelete: "set null" }),
  designFileId: uuid("design_file_id").references(() => designFiles.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("component"),
  properties: jsonb("properties").$type<{
    variants?: Array<{ name: string; values: Record<string, string> }>;
    variantProperties?: string[];
    defaultVariant?: string;
  }>().default({}).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("components_workspace_idx").on(t.workspaceId),
  index("components_set_idx").on(t.componentSetId),
]);

export type Component = typeof components.$inferSelect;

export const createComponentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  properties: z.record(z.unknown()).optional(),
});

export const updateComponentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  properties: z.record(z.unknown()).optional(),
  thumbnailUrl: z.string().url().max(1000).nullable().optional(),
});

// ── Assets (uploaded images, icons, fonts) ──────────────────────────────

export const ASSET_TYPES = ["image", "font", "icon", "illustration", "other"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  designFileId: uuid("design_file_id").references(() => designFiles.id, { onDelete: "set null" }),
  uploaderId: uuid("uploader_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("image"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  size: integer("size").notNull().default(0),
  mimeType: text("mime_type"),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("assets_workspace_idx").on(t.workspaceId),
  index("assets_design_file_idx").on(t.designFileId),
]);

export type Asset = typeof assets.$inferSelect;

// ── Design Tokens ─────────────────────────────────────────────────────────

export const TOKEN_TYPES = ["color", "typography", "spacing", "radius", "shadow", "opacity", "font_family", "font_weight", "line_height", "letter_spacing"] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export const designTokens = pgTable("design_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("design_token_name_type_idx").on(t.workspaceId, t.name, t.type),
]);

export type DesignToken = typeof designTokens.$inferSelect;

export const createDesignTokenSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(TOKEN_TYPES),
  value: z.union([z.string(), z.number(), z.record(z.unknown())]),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});

export const updateDesignTokenSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(TOKEN_TYPES).optional(),
  value: z.union([z.string(), z.number(), z.record(z.unknown())]).optional(),
  description: z.string().max(500).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
});

// ── Comments ──────────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  designFileId: uuid("design_file_id").notNull().references(() => designFiles.id, { onDelete: "cascade" }),
  canvasId: uuid("canvas_id").references(() => canvases.id, { onDelete: "cascade" }),
  layerId: uuid("layer_id").references(() => layers.id, { onDelete: "set null" }),
  authorId: uuid("author_id").notNull(),
  body: text("body").notNull(),
  x: real("x"),
  y: real("y"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedById: uuid("resolved_by_id"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("comments_design_file_idx").on(t.designFileId, t.createdAt),
  index("comments_canvas_idx").on(t.canvasId),
]);

export type Comment = typeof comments.$inferSelect;

export const commentReplies = pgTable("comment_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("comment_replies_comment_idx").on(t.commentId),
]);

export type CommentReply = typeof commentReplies.$inferSelect;

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  layerId: z.string().uuid().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  pinned: z.boolean().optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

export const createCommentReplySchema = z.object({
  body: z.string().min(1).max(5000),
});

// ── Design Shares ──────────────────────────────────────────────────────────

export const SHARE_ROLES = ["viewer", "editor"] as const;
export type ShareRole = (typeof SHARE_ROLES)[number];

export const designShares = pgTable("design_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  designFileId: uuid("design_file_id").notNull().references(() => designFiles.id, { onDelete: "cascade" }),
  shareToken: text("share_token").notNull().unique(),
  role: text("role").notNull().default("viewer"),
  password: text("password"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("design_shares_file_idx").on(t.designFileId),
]);

export type DesignShare = typeof designShares.$inferSelect;

export const createDesignShareSchema = z.object({
  role: z.enum(SHARE_ROLES).default("viewer"),
  password: z.string().min(1).max(100).optional(),
  expiresAt: z.coerce.date().optional(),
});

// ── Export Presets ─────────────────────────────────────────────────────────

export const EXPORT_FORMATS = ["png", "jpg", "svg", "pdf", "webp"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const exportPresets = pgTable("export_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull().default("png"),
  scale: real("scale").notNull().default(1),
  suffix: text("suffix").default(""),
  quality: integer("quality").default(100),
  includeBackground: boolean("include_background").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("export_presets_workspace_idx").on(t.workspaceId),
]);

export type ExportPreset = typeof exportPresets.$inferSelect;

// ── Notifications ─────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = ["comment", "mention", "share", "invite", "version", "approval"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").notNull().default(false),
  designFileId: uuid("design_file_id"),
  projectId: uuid("project_id"),
  commentId: uuid("comment_id"),
  actorId: uuid("actor_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_user_idx").on(t.userId, t.read, t.createdAt.desc()),
]);

export type Notification = typeof notifications.$inferSelect;

// ── Activity Log ──────────────────────────────────────────────────────────

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id"),
  projectId: uuid("project_id"),
  designFileId: uuid("design_file_id"),
  action: text("action").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("activity_logs_workspace_idx").on(t.workspaceId, t.createdAt.desc()),
  index("activity_logs_design_file_idx").on(t.designFileId),
]);

export type ActivityLog = typeof activityLogs.$inferSelect;

// ── Plugins ────────────────────────────────────────────────────────────────

export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconUrl: text("icon_url"),
  manifest: jsonb("manifest").$type<Record<string, unknown>>().default({}).notNull(),
  isBuiltIn: boolean("is_built_in").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Plugin = typeof plugins.$inferSelect;

export const pluginInstallations = pgTable("plugin_installations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pluginId: uuid("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}).notNull(),
  installedBy: uuid("installed_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniquePluginInstall: uniqueIndex("plugin_install_unique").on(t.pluginId, t.workspaceId),
}));

export type PluginInstallation = typeof pluginInstallations.$inferSelect;

// ── Audit Log ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ── Session Tables ─────────────────────────────────────────────────────────

export const sessionTable = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
}, (t) => ({
  expireIndex: index("IDX_session_expire").on(t.expire),
}));

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull().unique(),
  userAgent: text("user_agent"),
  browser: text("browser"),
  os: text("os"),
  device: text("device"),
  ipAddress: text("ip_address"),
  location: text("location"),
  isCurrent: boolean("is_current").notNull().default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userSessionsUserIdIdx: index("user_sessions_user_id_idx").on(t.userId),
  userSessionsSessionIdIdx: uniqueIndex("user_sessions_session_id_idx").on(t.sessionId),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

// ── Pastel Agent Runs ──────────────────────────────────────────────────────

export const AGENT_RUN_STATUSES = ["running", "done", "error"] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  prompt: text("prompt").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().default({}).notNull(),
  title: text("title"),
  status: text("status").notNull().default("running"),
  phase: text("phase"),
  error: text("error"),
  // manifest: { screens: string[], docs: string[], brandKit: {...}, phases: Record<phase, status> }
  manifest: jsonb("manifest").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("agent_runs_project_idx").on(t.projectId, t.createdAt),
  index("agent_runs_user_idx").on(t.userId, t.createdAt),
]);

export type AgentRun = typeof agentRuns.$inferSelect;

// ── Pastel Agent Documents (markdown design docs generated during a run) ────

export const AGENT_DOCUMENT_KINDS = ["brief", "system", "screen-spec", "component-spec"] as const;
export type AgentDocumentKind = (typeof AGENT_DOCUMENT_KINDS)[number];

export const agentDocuments = pgTable("agent_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => agentRuns.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("brief"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("agent_documents_run_path_idx").on(t.runId, t.path),
]);

export type AgentDocument = typeof agentDocuments.$inferSelect;

// ── Pastel Agent Files (virtual file system + compiled screen bundles) ─────

export const AGENT_FILE_KINDS = ["screen", "component", "style", "entry", "build"] as const;
export type AgentFileKind = (typeof AGENT_FILE_KINDS)[number];

export const agentFiles = pgTable("agent_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => agentRuns.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  kind: text("kind").notNull().default("component"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("agent_files_run_path_idx").on(t.runId, t.path),
]);

export type AgentFile = typeof agentFiles.$inferSelect;

// ── Pastel Agent Project State (persistent structured state per project) ───
//
// The v2 pipeline is built around this table: every stage reads compact
// structured slices of state instead of reprocessing long prompts, and every
// artifact is generated once, persisted here, and reused across runs.

export const agentProjectState = pgTable("agent_project_state", {
  projectId: uuid("project_id").primaryKey().references(() => projects.id, { onDelete: "cascade" }),
  intake: jsonb("intake").$type<Record<string, unknown>>(),
  creativeBrief: jsonb("creative_brief").$type<Record<string, unknown>>(),
  productSpec: jsonb("product_spec").$type<Record<string, unknown>>(),
  brandStrategy: jsonb("brand_strategy").$type<Record<string, unknown>>(),
  designSystem: jsonb("design_system").$type<Record<string, unknown>>(), // stage 5 — the brand kit
  informationArchitecture: jsonb("information_architecture").$type<Record<string, unknown>>(),
  userFlowPlan: jsonb("user_flow_plan").$type<Record<string, unknown>>(),
  screenPlan: jsonb("screen_plan").$type<Record<string, unknown>>(),
  layoutPlan: jsonb("layout_plan").$type<Record<string, unknown>>(),
  patternContext: jsonb("pattern_context").$type<Record<string, unknown>>(),
  interactionPlan: jsonb("interaction_plan").$type<Record<string, unknown>>(),
  architecture: jsonb("architecture").$type<Record<string, unknown>>(), // stage 10 + 12 assembled
  styleSeed: text("style_seed"),
  decisionLog: jsonb("decision_log").$type<unknown[]>().default([]).notNull(),
  artifactHashes: jsonb("artifact_hashes").$type<Record<string, string>>().default({}).notNull(),
  version: integer("version").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AgentProjectState = typeof agentProjectState.$inferSelect;

// ── Pastel Agent Component Registry (validated, reusable components) ───────

export const AGENT_COMPONENT_KINDS = ["shared", "layout", "screen"] as const;
export type AgentComponentKind = (typeof AGENT_COMPONENT_KINDS)[number];

export const AGENT_COMPONENT_STATUSES = ["validated", "fallback", "deprecated"] as const;
export type AgentComponentStatus = (typeof AGENT_COMPONENT_STATUSES)[number];

export const agentComponentRegistry = pgTable("agent_component_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("shared"),
  spec: jsonb("spec").$type<Record<string, unknown>>().default({}).notNull(),
  contract: jsonb("contract").$type<Record<string, unknown>>().default({}).notNull(),
  source: text("source").notNull().default(""),
  sourceHash: text("source_hash").notNull().default(""),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("validated"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("agent_component_registry_project_name_idx").on(t.projectId, t.name),
  index("agent_component_registry_project_idx").on(t.projectId),
]);

export type AgentComponentRegistryEntry = typeof agentComponentRegistry.$inferSelect;

// ── Pastel Agent Design Patterns (curated library, embedding search) ────────
//
// Stage 11 (design pattern retrieval) embeds a query from the project's
// brief/spec/brand strategy and cosine-searches this table. Seeded by
// script/seed-design-patterns.ts. Requires the pgvector extension (migration
// 0004 creates it); the pipeline falls back to the static pattern library
// when this table is unavailable or empty.

export const designPatterns = pgTable("design_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  /** structured anatomy: layout description, sections, component hints, spacing hints */
  structure: jsonb("structure").$type<Record<string, unknown>>().default({}).notNull(),
  /** product/screen types this pattern suits (used for ranking + filtering) */
  bestFor: jsonb("best_for").$type<string[]>().default([]).notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("design_patterns_name_idx").on(t.name),
  index("design_patterns_category_idx").on(t.category),
]);

export type DesignPattern = typeof designPatterns.$inferSelect;


