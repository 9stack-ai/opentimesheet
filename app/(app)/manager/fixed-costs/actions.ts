"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { fixedCostSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function revalidate() {
  revalidatePath("/manager/fixed-costs");
  revalidatePath("/manager/reports/finance");
}

export async function createFixedCost(formData: FormData) {
  const user = await requireManager();
  const parsed = fixedCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const created = await prisma.fixedCost.create({
    data: {
      name: d.name,
      category: d.category,
      monthlyAmount: d.monthlyAmount,
      effectiveFrom: new Date(d.effectiveFrom),
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
    },
  });
  await recordAudit(user, "fixedcost.create", `Thêm chi phí cố định "${d.name}" ${vnd(d.monthlyAmount)}/tháng`, {
    type: "FixedCost",
    id: created.id,
  });
  revalidate();
}

export async function updateFixedCost(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const parsed = fixedCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.fixedCost.update({
    where: { id },
    data: {
      name: d.name,
      category: d.category,
      monthlyAmount: d.monthlyAmount,
      effectiveFrom: new Date(d.effectiveFrom),
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
    },
  });
  await recordAudit(user, "fixedcost.update", `Sửa chi phí cố định "${d.name}" ${vnd(d.monthlyAmount)}/tháng`, {
    type: "FixedCost",
    id,
  });
  revalidate();
}

export async function deleteFixedCost(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const rec = await prisma.fixedCost.findUnique({ where: { id }, select: { name: true, monthlyAmount: true } });
  await prisma.fixedCost.deleteMany({ where: { id } }); // idempotent: no-op if already deleted (double-click safe)
  if (rec) {
    await recordAudit(user, "fixedcost.delete", `Xoá chi phí cố định "${rec.name}" ${vnd(rec.monthlyAmount)}/tháng`, {
      type: "FixedCost",
      id,
    });
  }
  revalidate();
}
