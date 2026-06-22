"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { snapshotRatesForEntry } from "@/lib/compensation-db";
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
    select: { id: true, userId: true, date: true, task: { select: { projectId: true } } },
  });
  if (entries.length === 0) return;

  const approvedAt = nowSaigon();

  await prisma.$transaction(async (tx) => {
    for (const e of entries) {
      // Freeze the rates effective on the entry's DATE (compensation period) — a later rate change
      // doesn't touch this entry. Reads use the base client; only the write stays in the transaction.
      const snap = await snapshotRatesForEntry(e.userId, e.task.projectId, e.date);
      await tx.timeEntry.update({
        where: { id: e.id },
        data: { status: "APPROVED", ...snap, approvedById: manager.id, approvedAt },
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
