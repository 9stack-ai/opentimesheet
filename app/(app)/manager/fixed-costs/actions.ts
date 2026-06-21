"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { fixedCostSchema } from "@/lib/validation";

export async function createFixedCost(formData: FormData) {
  await requireManager();
  const parsed = fixedCostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.fixedCost.create({
    data: {
      name: d.name,
      category: d.category,
      monthlyAmount: d.monthlyAmount,
      effectiveFrom: new Date(d.effectiveFrom),
      effectiveTo: d.effectiveTo ? new Date(d.effectiveTo) : null,
    },
  });
  revalidatePath("/manager/fixed-costs");
}

export async function updateFixedCost(formData: FormData) {
  await requireManager();
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
  revalidatePath("/manager/fixed-costs");
}

export async function deleteFixedCost(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.fixedCost.delete({ where: { id } });
  revalidatePath("/manager/fixed-costs");
}
