"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setPasswordSchema } from "@/lib/validation";
import { parseLinkToken, verifyVerifier } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/password";

export type SetPasswordResult = { ok: false; message: string };

export async function setPassword(
  _prev: SetPasswordResult | undefined,
  formData: FormData,
): Promise<SetPasswordResult | undefined> {
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Mật khẩu phải có ít nhất 8 ký tự." };

  const link = parseLinkToken(parsed.data.linkToken);
  if (!link) return { ok: false, message: "Liên kết mời không hợp lệ." };

  const invite = await prisma.inviteToken.findUnique({ where: { selector: link.selector } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { ok: false, message: "Liên kết mời không hợp lệ hoặc đã hết hạn." };
  }

  const valid = await verifyVerifier(link.verifier, invite.tokenHash);
  if (!valid) return { ok: false, message: "Liên kết mời không hợp lệ." };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: invite.userId }, data: { passwordHash, status: "ACTIVE" } }),
    prisma.inviteToken.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?set=1");
}
