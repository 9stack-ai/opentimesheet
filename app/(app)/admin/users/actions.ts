"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import {
  inviteUserSchema,
  updateUserSchema,
  createUserSchema,
  adminSetPasswordSchema,
} from "@/lib/validation";
import { createInviteToken, hashVerifier } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/password";
import { percentToBps } from "@/lib/payroll";
import { recordAudit } from "@/lib/audit";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type InviteResult = { ok: boolean; message: string; inviteLink?: string };

/** Admin creates a user with a password set directly — active immediately, no invite-link round-trip. */
export async function createUserWithPassword(
  _prev: InviteResult | undefined,
  formData: FormData,
): Promise<InviteResult> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Dữ liệu không hợp lệ (mật khẩu tối thiểu 8 ký tự)." };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, message: "Email này đã tồn tại." };

  const passwordHash = await hashPassword(data.password);
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      contactEmail: data.contactEmail ?? null,
      role: data.role,
      status: "ACTIVE",
      defaultCostRate: data.defaultCostRate,
      defaultBillableRate: data.defaultBillableRate,
      taxWithholdingRateBps: percentToBps(data.taxWithholdingPercent),
      employerCostRateBps: percentToBps(data.employerCostPercent),
      fixedMonthlySalary: data.fixedMonthlySalary,
      passwordHash,
      mustChangePassword: true, // admin-set initial password → user changes it on first login
    },
  });

  await recordAudit(admin, "user.create", `Tạo tài khoản ${data.email} (${data.role})`);
  revalidatePath("/admin/users");
  return { ok: true, message: `Đã tạo tài khoản ${data.email}.` };
}

export type SetPasswordResult = { ok: boolean; message: string };

/** Admin resets a user's password. Activates an INVITED user and kills any stale invite link. */
export async function adminSetPassword(
  _prev: SetPasswordResult | undefined,
  formData: FormData,
): Promise<SetPasswordResult> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = adminSetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Mật khẩu phải có ít nhất 8 ký tự." };
  const { id, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, select: { status: true } });
  if (!user) return { ok: false, message: "Không tìm thấy người dùng." };

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      // Promote a pending invitee to ACTIVE; never override a DISABLED account.
      // Force the user to set their own password on next login.
      data: { passwordHash, mustChangePassword: true, ...(user.status === "INVITED" ? { status: "ACTIVE" } : {}) },
    }),
    // Invalidate any outstanding invite link now that a password exists.
    prisma.inviteToken.deleteMany({ where: { userId: id } }),
  ]);
  await recordAudit(admin, "user.password_reset", "Đặt lại mật khẩu cho 1 tài khoản", {
    type: "User",
    id,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "Đã đặt lại mật khẩu." };
}

export async function inviteUser(_prev: InviteResult | undefined, formData: FormData): Promise<InviteResult> {
  const admin = await requireRole(["ADMIN"]);

  const parsed = inviteUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Dữ liệu không hợp lệ." };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, message: "Email này đã tồn tại." };

  const { selector, verifier, linkToken } = createInviteToken();
  const tokenHash = await hashVerifier(verifier);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      contactEmail: data.contactEmail ?? null,
      role: data.role,
      status: "INVITED",
      defaultCostRate: data.defaultCostRate,
      defaultBillableRate: data.defaultBillableRate,
      taxWithholdingRateBps: percentToBps(data.taxWithholdingPercent),
      employerCostRateBps: percentToBps(data.employerCostPercent),
      fixedMonthlySalary: data.fixedMonthlySalary,
      inviteToken: {
        create: { selector, tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
      },
    },
  });

  await recordAudit(admin, "user.invite", `Mời tài khoản ${data.email} (${data.role})`);
  revalidatePath("/admin/users");
  // No email infra in v1: surface the invite link for the admin to share manually.
  return { ok: true, message: `Đã mời ${data.email}.`, inviteLink: `/set-password/${linkToken}` };
}

export async function updateUser(formData: FormData): Promise<void> {
  const admin = await requireRole(["ADMIN"]);
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { id, taxWithholdingPercent, employerCostPercent, contactEmail, ...rest } = parsed.data;
  // rest = { name, email (login/username), role, defaultCostRate, defaultBillableRate }
  // Guard: the new username must stay unique — skip silently if another account already uses it.
  const clash = await prisma.user.findFirst({
    where: { email: rest.email, NOT: { id } },
    select: { id: true },
  });
  if (clash) return;
  await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      contactEmail: contactEmail ?? null,
      taxWithholdingRateBps: percentToBps(taxWithholdingPercent),
      employerCostRateBps: percentToBps(employerCostPercent),
    },
  });
  await recordAudit(admin, "user.update", `Sửa tài khoản ${rest.email} (${rest.role})`, {
    type: "User",
    id,
  });
  revalidatePath("/admin/users");
}

export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status !== "ACTIVE" && status !== "DISABLED") return;
  await prisma.user.update({ where: { id }, data: { status } });
  await recordAudit(admin, "user.status", status === "DISABLED" ? "Vô hiệu hoá 1 tài khoản" : "Kích hoạt 1 tài khoản", {
    type: "User",
    id,
  });
  revalidatePath("/admin/users");
}
