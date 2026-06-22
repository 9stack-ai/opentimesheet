"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";

export type ChangePasswordResult = { ok: boolean; message: string };

/** Self-service password change for the logged-in user. Verifies the current password first;
 *  no email/token involved. */
export async function changePassword(
  _prev: ChangePasswordResult | undefined,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const actor = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ (mật khẩu mới tối thiểu 8 ký tự).",
    };
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: actor.id }, select: { passwordHash: true } });
  if (!user?.passwordHash) return { ok: false, message: "Tài khoản chưa có mật khẩu — liên hệ quản trị viên." };
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false, message: "Mật khẩu hiện tại không đúng." };
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    return { ok: false, message: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  }

  await prisma.user.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await recordAudit(actor, "user.password_change", "Tự đổi mật khẩu");
  return { ok: true, message: "Đã đổi mật khẩu thành công." };
}
