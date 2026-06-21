"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/rbac";
import { syncAllForUser } from "@/lib/redmine/sync";
import { RedmineError } from "@/lib/redmine/types";

export type SyncResult = { ok: boolean; message: string };

export async function syncRedmine(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: SyncResult | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<SyncResult> {
  const user = await requireUser();
  try {
    const c = await syncAllForUser(user.id);
    revalidatePath("/timesheet");
    if (c.projects === 0) {
      return { ok: true, message: "Chưa có dự án nào liên kết Redmine (hoặc bạn chưa được phân vào)." };
    }
    return {
      ok: true,
      message: `Đồng bộ ${c.projects} dự án: +${c.created} mới, ${c.updated} cập nhật, ${c.closed} đã đóng.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof RedmineError ? e.message : "Đồng bộ thất bại." };
  }
}
