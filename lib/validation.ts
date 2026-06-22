import { z } from "zod";
import { ROLES } from "@/lib/roles";

// Tax rates entered as a human percent (0–100, decimals allowed); converted to basis points on write.
const taxPercent = z.coerce.number().min(0).max(100).default(0);

// Login identifier: a username or an email. Stored in User.email (the unique login key).
const loginIdentifier = z.string().trim().min(1).max(200);

// Optional contact email (separate from the login). Blank → undefined.
const optionalEmail = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().email().optional(),
);

export const inviteUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: loginIdentifier,
  contactEmail: optionalEmail,
  role: z.enum(ROLES),
  defaultCostRate: z.coerce.number().int().min(0).default(0),
  defaultBillableRate: z.coerce.number().int().min(0).default(0),
  taxWithholdingPercent: taxPercent,
  employerCostPercent: taxPercent,
  fixedMonthlySalary: z.coerce.number().int().min(0).default(0),
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  email: loginIdentifier,
  contactEmail: optionalEmail,
  role: z.enum(ROLES),
  defaultCostRate: z.coerce.number().int().min(0),
  defaultBillableRate: z.coerce.number().int().min(0),
  taxWithholdingPercent: taxPercent,
  employerCostPercent: taxPercent,
  fixedMonthlySalary: z.coerce.number().int().min(0).default(0),
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

// Self-service password change (logged-in user; no email/token). Confirms current password.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
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

// Kết thúc phiên làm việc: chỉ nhận task + nội dung; date & hours được suy ra ở server từ phiên.
export const endSessionSchema = z.object({
  taskId: z.string().min(1),
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

// Month "YYYY-MM" (e.g. kỳ lương). Blank → undefined.
const optionalMonthString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().regex(/^\d{4}-\d{2}$/).optional(),
);

export const expenseSchema = z.object({
  projectId: optionalString,
  category: z.string().min(1).max(100),
  kind: z.enum(["REGULAR", "IRREGULAR"]).default("REGULAR"),
  amount: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

// Nguồn thu (income/cash-in): capital contributions, client advances, milestone revenue.
// Date is optional — undated income sits in the ledger but is excluded from a period's Tổng thu.
export const incomeSchema = z.object({
  source: z.string().min(1).max(200),
  projectId: optionalString, // null = không gắn dự án (thu cấp công ty)
  amount: z.coerce.number().int().positive(),
  date: optionalDateString,
  note: z.string().max(500).optional(),
});

// Thực chi: an actual payment to a person. The salary month (periodLabel) is entered
// explicitly (which month's pay this settles); blank → derived from the payment date.
// Reconciliation aggregates by date over the selected period.
export const disbursementSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodLabel: optionalMonthString,
  note: z.string().max(500).optional(),
});

export const fixedCostSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(100),
  monthlyAmount: z.coerce.number().int().positive(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: optionalDateString,
});

// A dated compensation period (rate or fixed salary) for a user.
export const compensationSchema = z.object({
  userId: z.string().min(1),
  kind: z.enum(["HOURLY", "FIXED"]),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: optionalDateString,
  costRate: z.coerce.number().int().min(0).default(0),
  billableRate: z.coerce.number().int().min(0).default(0),
  fixedMonthlySalary: z.coerce.number().int().min(0).default(0),
  taxWithholdingPercent: taxPercent,
  employerCostPercent: taxPercent,
});

export const redmineConnectSchema = z.object({
  apiKey: z.string().min(1).max(200),
});
