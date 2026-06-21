"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { timeEntrySchema } from "@/lib/validation";
import { effectiveRates } from "@/lib/rates";
import { resolveTargetUserId, canModifyEntry } from "@/lib/timesheet-access";

/** A user may only log against a task in a project they are assigned to. */
async function isAssignedToTask(userId: string, taskId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) return false;
  const assignment = await prisma.assignment.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId } },
    select: { id: true },
  });
  return assignment !== null;
}

/** A DISABLED user may not receive time logged on their behalf. */
async function isActiveUser(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  return !!u && u.status !== "DISABLED";
}

/**
 * Recompute the frozen rate snapshot for an APPROVED entry that ADMIN edits, so payout/billing/
 * profitability reports stay internally consistent with the entry's (possibly changed) task & owner.
 */
async function snapshotForApproved(
  ownerId: string,
  taskId: string,
): Promise<
  | {
      costRateSnapshot: number;
      billableRateSnapshot: number;
      taxRateSnapshot: number;
      employerCostRateSnapshot: number;
    }
  | undefined
> {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) return undefined;
  const [owner, assignment] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: {
        defaultCostRate: true,
        defaultBillableRate: true,
        taxWithholdingRateBps: true,
        employerCostRateBps: true,
      },
    }),
    prisma.assignment.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: ownerId } },
      select: { costRateOverride: true, billableRateOverride: true },
    }),
  ]);
  const rates = effectiveRates(assignment, owner);
  return {
    costRateSnapshot: rates.costRate,
    billableRateSnapshot: rates.billableRate,
    taxRateSnapshot: owner.taxWithholdingRateBps,
    employerCostRateSnapshot: owner.employerCostRateBps,
  };
}

export async function createEntry(formData: FormData) {
  const actor = await requireUser();
  const targetUserId = resolveTargetUserId(actor, formData.get("targetUserId")?.toString());
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  // When ADMIN logs on behalf, the target must be an active (non-disabled) user.
  if (targetUserId !== actor.id && !(await isActiveUser(targetUserId))) return;
  if (!(await isAssignedToTask(targetUserId, parsed.data.taskId))) return;

  const created = await prisma.timeEntry.create({
    data: {
      userId: targetUserId,
      taskId: parsed.data.taskId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      note: parsed.data.note ?? null,
      status: "DRAFT",
    },
  });
  await recordAudit(
    actor,
    "timeentry.create",
    `Tạo công ${parsed.data.hours}h ngày ${parsed.data.date}${targetUserId !== actor.id ? " (chấm hộ)" : ""}`,
    { type: "TimeEntry", id: created.id },
  );
  revalidatePath("/timesheet");
}

export async function updateEntry(formData: FormData) {
  const actor = await requireUser();
  const id = String(formData.get("id"));
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;

  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { userId: true, status: true, redmineTimeEntryId: true },
  });
  if (!existing) return;
  // ADMIN may edit any entry/status; the owner may only edit their own DRAFT/REJECTED entry.
  if (!canModifyEntry(actor.role, existing.userId === actor.id, existing.status)) return;
  // An entry already pushed to Redmine is locked: editing it here would silently diverge from the
  // Redmine time entry (push is idempotent and never reconciles). Block to keep the two in sync.
  if (existing.redmineTimeEntryId != null) return;
  // The entry's OWNER (not the actor) must be assigned to the chosen task.
  if (!(await isAssignedToTask(existing.userId, parsed.data.taskId))) return;

  // Editing an already-APPROVED entry re-freezes its rate snapshot (ADMIN-only path).
  const snapshot =
    existing.status === "APPROVED"
      ? await snapshotForApproved(existing.userId, parsed.data.taskId)
      : undefined;

  await prisma.timeEntry.update({
    where: { id },
    data: {
      taskId: parsed.data.taskId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      note: parsed.data.note ?? null,
      ...(snapshot ?? {}),
    },
  });
  await recordAudit(actor, "timeentry.update", `Sửa công ${parsed.data.hours}h ngày ${parsed.data.date}`, {
    type: "TimeEntry",
    id,
  });
  revalidatePath("/timesheet");
}

export async function deleteEntry(formData: FormData) {
  const actor = await requireUser();
  const id = String(formData.get("id"));
  if (!id) return;
  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { userId: true, status: true, redmineTimeEntryId: true },
  });
  if (!existing) return;
  if (!canModifyEntry(actor.role, existing.userId === actor.id, existing.status)) return;
  // Deleting a pushed entry would orphan its Redmine time entry — keep them in sync by blocking.
  if (existing.redmineTimeEntryId != null) return;
  await prisma.timeEntry.deleteMany({ where: { id } }); // idempotent: no-op if already deleted
  await recordAudit(actor, "timeentry.delete", "Xoá 1 dòng công", { type: "TimeEntry", id });

  revalidatePath("/timesheet");
}

export async function submitPeriod(formData: FormData) {
  const actor = await requireUser();
  const targetUserId = resolveTargetUserId(actor, formData.get("targetUserId")?.toString());
  const start = String(formData.get("start"));
  const end = String(formData.get("end"));
  if (!start || !end) return;
  if (targetUserId !== actor.id && !(await isActiveUser(targetUserId))) return;
  const res = await prisma.timeEntry.updateMany({
    where: {
      userId: targetUserId,
      status: { in: ["DRAFT", "REJECTED"] },
      date: { gte: new Date(start), lt: new Date(end) },
    },
    data: { status: "SUBMITTED" },
  });
  await recordAudit(
    actor,
    "timeentry.submit",
    `Gửi duyệt ${res.count} công (${start.slice(0, 10)} → ${end.slice(0, 10)})${targetUserId !== actor.id ? " (hộ)" : ""}`,
  );
  revalidatePath("/timesheet");
}
