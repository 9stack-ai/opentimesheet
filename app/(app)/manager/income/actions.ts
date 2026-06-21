"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { incomeSchema } from "@/lib/validation";

export async function createIncome(formData: FormData) {
  const user = await requireManager();
  const parsed = incomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.income.create({
    data: {
      source: d.source,
      amount: d.amount,
      date: d.date ? new Date(d.date) : null,
      note: d.note ?? null,
      loggedById: user.id,
    },
  });
  revalidatePath("/manager/income");
  revalidatePath("/manager/reports/finance");
}

export async function updateIncome(formData: FormData) {
  await requireManager();
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
  revalidatePath("/manager/income");
  revalidatePath("/manager/reports/finance");
}

export async function deleteIncome(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.income.delete({ where: { id } });
  revalidatePath("/manager/income");
  revalidatePath("/manager/reports/finance");
}
