"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { disbursementSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function revalidate() {
  revalidatePath("/manager/disbursements");
  revalidatePath("/manager/reports/finance");
}

export async function createDisbursement(formData: FormData) {
  const user = await requireManager();
  const parsed = disbursementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const recipient = await prisma.user.findUnique({ where: { id: d.userId }, select: { name: true } });
  const created = await prisma.disbursement.create({
    data: {
      userId: d.userId,
      amount: d.amount,
      date: new Date(d.date),
      // Salary month settled: explicit if entered, else derived from the payment date.
      periodLabel: d.periodLabel ?? d.date.slice(0, 7),
      note: d.note ?? null,
      loggedById: user.id,
    },
  });
  await recordAudit(user, "disbursement.create", `Ghi thực chi ${vnd(d.amount)} cho ${recipient?.name ?? "?"}`, {
    type: "Disbursement",
    id: created.id,
  });
  revalidate();
}

export async function updateDisbursement(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const parsed = disbursementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const d = parsed.data;
  const recipient = await prisma.user.findUnique({ where: { id: d.userId }, select: { name: true } });
  await prisma.disbursement.update({
    where: { id },
    data: {
      userId: d.userId,
      amount: d.amount,
      date: new Date(d.date),
      periodLabel: d.periodLabel ?? d.date.slice(0, 7),
      note: d.note ?? null,
    },
  });
  await recordAudit(user, "disbursement.update", `Sửa thực chi ${vnd(d.amount)} cho ${recipient?.name ?? "?"}`, {
    type: "Disbursement",
    id,
  });
  revalidate();
}

export async function deleteDisbursement(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const rec = await prisma.disbursement.findUnique({
    where: { id },
    select: { amount: true, user: { select: { name: true } } },
  });
  await prisma.disbursement.deleteMany({ where: { id } }); // idempotent: no-op if already deleted (double-click safe)
  if (rec) {
    await recordAudit(user, "disbursement.delete", `Xoá thực chi ${vnd(rec.amount)} của ${rec.user.name}`, {
      type: "Disbursement",
      id,
    });
  }
  revalidate();
}
