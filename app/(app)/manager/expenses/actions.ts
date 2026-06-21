"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { expenseSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function revalidate() {
  revalidatePath("/manager/expenses");
  revalidatePath("/manager/irregular-expenses");
  revalidatePath("/manager/reports/finance");
}

export async function createExpense(formData: FormData) {
  const user = await requireManager();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const created = await prisma.expense.create({
    data: {
      projectId: d.projectId ?? null,
      category: d.category,
      kind: d.kind,
      amount: d.amount,
      date: new Date(d.date),
      note: d.note ?? null,
      loggedById: user.id,
    },
  });
  await recordAudit(user, "expense.create", `Thêm chi phí "${d.category}" ${vnd(d.amount)} (${d.kind})`, {
    type: "Expense",
    id: created.id,
  });
  revalidate();
}

export async function updateExpense(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.expense.update({
    where: { id },
    data: {
      projectId: d.projectId ?? null,
      category: d.category,
      kind: d.kind,
      amount: d.amount,
      date: new Date(d.date),
      note: d.note ?? null,
    },
  });
  await recordAudit(user, "expense.update", `Sửa chi phí "${d.category}" ${vnd(d.amount)} (${d.kind})`, {
    type: "Expense",
    id,
  });
  revalidate();
}

export async function deleteExpense(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const rec = await prisma.expense.findUnique({ where: { id }, select: { category: true, amount: true } });
  await prisma.expense.deleteMany({ where: { id } }); // idempotent: no-op if already deleted (double-click safe)
  if (rec) {
    await recordAudit(user, "expense.delete", `Xoá chi phí "${rec.category}" ${vnd(rec.amount)}`, {
      type: "Expense",
      id,
    });
  }
  revalidate();
}
