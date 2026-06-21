"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { incomeSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function revalidate() {
  revalidatePath("/manager/income");
  revalidatePath("/manager/reports/finance");
}

export async function createIncome(formData: FormData) {
  const user = await requireManager();
  const parsed = incomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const created = await prisma.income.create({
    data: {
      source: d.source,
      amount: d.amount,
      date: d.date ? new Date(d.date) : null,
      note: d.note ?? null,
      loggedById: user.id,
    },
  });
  await recordAudit(user, "income.create", `Thêm nguồn thu "${d.source}" ${vnd(d.amount)}`, {
    type: "Income",
    id: created.id,
  });
  revalidate();
}

export async function updateIncome(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const parsed = incomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.income.update({
    where: { id },
    data: {
      source: d.source,
      amount: d.amount,
      date: d.date ? new Date(d.date) : null,
      note: d.note ?? null,
    },
  });
  await recordAudit(user, "income.update", `Sửa nguồn thu "${d.source}" ${vnd(d.amount)}`, {
    type: "Income",
    id,
  });
  revalidate();
}

export async function deleteIncome(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const rec = await prisma.income.findUnique({ where: { id }, select: { source: true, amount: true } });
  await prisma.income.deleteMany({ where: { id } }); // idempotent: no-op if already deleted (double-click safe)
  if (rec) {
    await recordAudit(user, "income.delete", `Xoá nguồn thu "${rec.source}" ${vnd(rec.amount)}`, {
      type: "Income",
      id,
    });
  }
  revalidate();
}
