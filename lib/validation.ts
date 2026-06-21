import { z } from "zod";
import { ROLES } from "@/lib/roles";

// Tax rates entered as a human percent (0–100, decimals allowed); converted to basis points on write.
const taxPercent = z.coerce.number().min(0).max(100).default(0);

export const inviteUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  role: z.enum(ROLES),
  defaultCostRate: z.coerce.number().int().min(0).default(0),
  defaultBillableRate: z.coerce.number().int().min(0).default(0),
  taxWithholdingPercent: taxPercent,
  employerCostPercent: taxPercent,
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  role: z.enum(ROLES),
  defaultCostRate: z.coerce.number().int().min(0),
  defaultBillableRate: z.coerce.number().int().min(0),
  taxWithholdingPercent: taxPercent,
  employerCostPercent: taxPercent,
});

// Admin creates a user and sets the password directly (active immediately, no invite link).
export const createUserSchema = inviteUserSchema.extend({
  password: z.string().min(8).max(200),
});

// Admin resets an existing user's password.
export const adminSetPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8).max(200),
});

export const setPasswordSchema = z.object({
  linkToken: z.string().min(1),
  password: z.string().min(8).max(200),
});

const optionalRate = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce.number().int().min(0).optional(),
);

export const clientSchema = z.object({
  name: z.string().min(1).max(200),
  contact: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(200),
});

export const taskSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
});

export const assignmentSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  costRateOverride: optionalRate,
  billableRateOverride: optionalRate,
});

export const timeEntrySchema = z.object({
  taskId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.coerce.number().positive().max(24),
  note: z.string().max(500).optional(),
});

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().optional(),
);

const optionalDateString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
);

export const expenseSchema = z.object({
  projectId: optionalString,
  category: z.string().min(1).max(100),
  kind: z.enum(["REGULAR", "IRREGULAR"]).default("REGULAR"),
  amount: z.coerce.number().int().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

export const fixedCostSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(100),
  monthlyAmount: z.coerce.number().int().min(0),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: optionalDateString,
});

export const redmineConnectSchema = z.object({
  apiKey: z.string().min(1).max(200),
});
