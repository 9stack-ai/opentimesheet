"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { inviteUserSchema, updateUserSchema } from "@/lib/validation";
import { createInviteToken, hashVerifier } from "@/lib/auth-tokens";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type InviteResult = { ok: boolean; message: string; inviteLink?: string };

export async function inviteUser(_prev: InviteResult | undefined, formData: FormData): Promise<InviteResult> {
  await requireRole(["ADMIN"]);

  const parsed = inviteUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, message: "A user with that email already exists." };

  const { selector, verifier, linkToken } = createInviteToken();
  const tokenHash = await hashVerifier(verifier);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      status: "INVITED",
      defaultCostRate: data.defaultCostRate,
      defaultBillableRate: data.defaultBillableRate,
      inviteToken: {
        create: { selector, tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
      },
    },
  });

  revalidatePath("/admin/users");
  // No email infra in v1: surface the invite link for the admin to share manually.
  return { ok: true, message: `Invited ${data.email}.`, inviteLink: `/set-password/${linkToken}` };
}

export async function updateUser(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { id, ...data } = parsed.data;
  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
}

export async function setUserStatus(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status !== "ACTIVE" && status !== "DISABLED") return;
  await prisma.user.update({ where: { id }, data: { status } });
  revalidatePath("/admin/users");
}
