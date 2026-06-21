"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { effectiveRates } from "@/lib/rates";
import { nowSaigon } from "@/lib/clock";
import { pushApprovedEntries, retryPush } from "@/lib/redmine/push";

/**
 * Approve SUBMITTED entries. Snapshots the effective cost & billable rate onto each
 * entry (immutable thereafter). Only SUBMITTED entries are touched, so re-approving
 * never overwrites an existing snapshot.
 */
export async function approveEntries(formData: FormData) {
  const manager = await requireManager();
  const ids = formData.getAll("entryId").map(String).filter(Boolean);
  if (ids.length === 0) return;

  const entries = await prisma.timeEntry.findMany({
    where: { id: { in: ids }, status: "SUBMITTED" },
    select: { id: true, userId: true, task: { select: { projectId: true } } },
  });
  if (entries.length === 0) return;

  const approvedAt = nowSaigon();

  await prisma.$transaction(async (tx) => {
    for (const e of entries) {
      const [user, assignment] = await Promise.all([
        tx.user.findUniqueOrThrow({
          where: { id: e.userId },
          select: {
            defaultCostRate: true,
            defaultBillableRate: true,
            taxWithholdingRateBps: true,
            employerCostRateBps: true,
          },
        }),
        tx.assignment.findUnique({
          where: { projectId_userId: { projectId: e.task.projectId, userId: e.userId } },
          select: { costRateOverride: true, billableRateOverride: true },
        }),
      ]);
      const rates = effectiveRates(assignment, user);
      await tx.timeEntry.update({
        where: { id: e.id },
        data: {
          status: "APPROVED",
          costRateSnapshot: rates.costRate,
          billableRateSnapshot: rates.billableRate,
          // Freeze the owner's tax rates too, so payout/finance stay stable if rates change later.
          taxRateSnapshot: user.taxWithholdingRateBps,
          employerCostRateSnapshot: user.employerCostRateBps,
          approvedById: manager.id,
          approvedAt,
        },
      });
    }
  });

  // Best-effort: push approved time to Redmine for entries on Redmine-linked tasks.
  // Failures are recorded per entry and never affect the already-committed approval.
  await pushApprovedEntries(entries.map((e) => e.id));

  await recordAudit(manager, "timeentry.approve", `Duyệt ${entries.length} công`);
  revalidatePath("/manager/approvals");
}

/** Reject SUBMITTED entries with an optional reason; returns them to the freelancer to edit. */
export async function rejectEntries(formData: FormData) {
  const manager = await requireManager();
  const ids = formData.getAll("entryId").map(String).filter(Boolean);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (ids.length === 0) return;

  await prisma.timeEntry.updateMany({
    where: { id: { in: ids }, status: "SUBMITTED" },
    data: { status: "REJECTED", rejectReason: reason || null },
  });
  await recordAudit(manager, "timeentry.reject", `Từ chối ${ids.length} công${reason ? `: ${reason}` : ""}`);
  revalidatePath("/manager/approvals");
}

/** Re-attempt a failed Redmine push for one approved entry (manager-initiated). */
export async function retryRedminePush(formData: FormData) {
  await requireManager();
  const id = String(formData.get("entryId"));
  if (!id) return;
  await retryPush(id);
  revalidatePath("/manager/approvals");
}
