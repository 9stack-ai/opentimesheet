"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { disbursementSchema } from "@/lib/validation";

export async function createDisbursement(formData: FormData) {
  const user = await requireManager();
  const parsed = disbursementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.disbursement.create({
    data: {
      userId: d.userId,
      amount: d.amount,
      date: new Date(d.date),
      periodLabel: d.periodLabel,
      note: d.note ?? null,
      loggedById: user.id,
    },
  });
  revalidatePath("/manager/disbursements");
}

export async function deleteDisbursement(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.disbursement.delete({ where: { id } });
  revalidatePath("/manager/disbursements");
}
