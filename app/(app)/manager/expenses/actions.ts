"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { expenseSchema } from "@/lib/validation";

export async function createExpense(formData: FormData) {
  const user = await requireManager();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.expense.create({
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
  revalidatePath("/manager/expenses");
  revalidatePath("/manager/irregular-expenses");
}

export async function deleteExpense(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/manager/expenses");
  revalidatePath("/manager/irregular-expenses");
}
