"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { compensationSchema } from "@/lib/validation";
import { percentToBps } from "@/lib/payroll";
import { recordAudit } from "@/lib/audit";

/** Add a dated compensation period. An open-ended new period auto-closes the user's current open
 *  period (the day before this one starts) so they don't overlap. */
export async function addCompensation(formData: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const parsed = compensationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const from = new Date(d.effectiveFrom);

  if (!d.effectiveTo) {
    // Close any existing open period the day before the new one starts.
    const dayBefore = new Date(from.getTime() - 86_400_000);
    await prisma.compensation.updateMany({
      where: { userId: d.userId, effectiveTo: null, effectiveFrom: { lt: from } },
      data: { effectiveTo: dayBefore },
    });
  }

  await prisma.compensation.create({
    data: {
      userId: d.userId,
      effectiveFrom: from,
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
      kind: d.kind,
      costRate: d.costRate,
      billableRate: d.billableRate,
      fixedMonthlySalary: d.fixedMonthlySalary,
      taxWithholdingRateBps: percentToBps(d.taxWithholdingPercent),
      employerCostRateBps: percentToBps(d.employerCostPercent),
    },
  });
  await recordAudit(admin, "compensation.add", `Thêm giai đoạn lương ${d.kind} từ ${d.effectiveFrom}`, {
    type: "User",
    id: d.userId,
  });
  revalidatePath("/admin/users");
}

export async function deleteCompensation(formData: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.compensation.deleteMany({ where: { id } }); // idempotent
  await recordAudit(admin, "compensation.delete", "Xoá 1 giai đoạn lương", { type: "Compensation", id });
  revalidatePath("/admin/users");
}
