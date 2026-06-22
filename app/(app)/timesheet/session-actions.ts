"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { endSessionSchema } from "@/lib/validation";
import { sessionHours } from "@/lib/work-session";
import { now } from "@/lib/clock";

/** Saigon (UTC+7) calendar date of an instant → UTC-midnight Date (matches how entries store `date`). */
function saigonDate(at: Date): Date {
  return new Date(new Date(at.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
}

/** Start a work session for the current user. Sessions are personal (never on-behalf). */
export async function startSession() {
  const actor = await requireUser();
  // Idempotent: one open session per user (userId is unique) — re-clicking does nothing.
  const existing = await prisma.workSession.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (existing) return;
  await prisma.workSession.create({ data: { userId: actor.id } });
  await recordAudit(actor, "session.start", "Bắt đầu phiên làm việc");
  revalidatePath("/timesheet");
}

/** End the session: create a DRAFT TimeEntry whose hours = elapsed (server-computed, capped 4h). */
export async function endSession(formData: FormData) {
  const actor = await requireUser();
  const parsed = endSessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { taskId, note } = parsed.data;

  // Owner must be assigned to the task's project (same guard as manual createEntry).
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) return;
  const assigned = await prisma.assignment.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: actor.id } },
    select: { id: true },
  });
  if (!assigned) return;

  const endedAt = now();
  await prisma.$transaction(async (tx) => {
    const session = await tx.workSession.findUnique({ where: { userId: actor.id } });
    if (!session) return; // already ended / never started
    // Claim-once: deleting the session is the guard — only the call that removes it records the entry,
    // so a double-click / second tab can't create two entries.
    const del = await tx.workSession.deleteMany({ where: { id: session.id } });
    if (del.count !== 1) return;
    const { hours } = sessionHours(session.startedAt, endedAt);
    if (hours <= 0) return; // session too short to record (rounds to 0.00h)
    await tx.timeEntry.create({
      data: {
        userId: actor.id,
        taskId,
        date: saigonDate(session.startedAt),
        hours,
        note: note ?? null,
        status: "DRAFT",
      },
    });
  });
  await recordAudit(actor, "session.end", "Kết thúc phiên — ghi công nháp từ phiên");
  revalidatePath("/timesheet");
}

/** Discard the open session without recording any time (started by mistake). */
export async function cancelSession() {
  const actor = await requireUser();
  await prisma.workSession.deleteMany({ where: { userId: actor.id } });
  await recordAudit(actor, "session.cancel", "Huỷ phiên làm việc (không ghi công)");
  revalidatePath("/timesheet");
}
