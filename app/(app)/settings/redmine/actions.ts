"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { redmineConnectSchema } from "@/lib/validation";
import { connectRedmineForUser, disconnectRedmineForUser } from "@/lib/redmine/connection";
import { RedmineError } from "@/lib/redmine/types";

export type RedmineConnectResult = { ok: boolean; message: string };

export async function connectRedmine(
  _prev: RedmineConnectResult | undefined,
  formData: FormData,
): Promise<RedmineConnectResult> {
  const user = await requireUser();
  if (!process.env.REDMINE_URL) {
    return { ok: false, message: "Quản trị viên chưa cấu hình REDMINE_URL." };
  }
  const parsed = redmineConnectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "API key không hợp lệ." };

  try {
    const { login } = await connectRedmineForUser(user.id, parsed.data.apiKey);
    revalidatePath("/settings/redmine");
    return { ok: true, message: `Đã kết nối Redmine với tài khoản ${login}.` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof RedmineError ? e.message : "Không kết nối được Redmine.",
    };
  }
}

export async function disconnectRedmine(): Promise<void> {
  const user = await requireUser();
  await disconnectRedmineForUser(user.id);
  revalidatePath("/settings/redmine");
}
