"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { timeEntrySchema } from "@/lib/validation";

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

export async function createEntry(formData: FormData) {
  const user = await requireUser();
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  if (!(await isAssignedToTask(user.id, parsed.data.taskId))) return;

  await prisma.timeEntry.create({
    data: {
      userId: user.id,
      taskId: parsed.data.taskId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      note: parsed.data.note ?? null,
      status: "DRAFT",
    },
  });
  revalidatePath("/timesheet");
}

export async function updateEntry(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const parsed = timeEntrySchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;

  // Own DRAFT entries only.
  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });
  if (!existing || existing.userId !== user.id || existing.status !== "DRAFT" && existing.status !== "REJECTED") return;
  if (!(await isAssignedToTask(user.id, parsed.data.taskId))) return;

  await prisma.timeEntry.update({
    where: { id },
    data: {
      taskId: parsed.data.taskId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      note: parsed.data.note ?? null,
    },
  });
  revalidatePath("/timesheet");
}

export async function deleteEntry(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  if (!id) return;
  const existing = await prisma.timeEntry.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });
  if (!existing || existing.userId !== user.id || existing.status !== "DRAFT" && existing.status !== "REJECTED") return;
  await prisma.timeEntry.delete({ where: { id } });
  revalidatePath("/timesheet");
}

export async function submitPeriod(formData: FormData) {
  const user = await requireUser();
  const start = String(formData.get("start"));
  const end = String(formData.get("end"));
  if (!start || !end) return;
  await prisma.timeEntry.updateMany({
    where: {
      userId: user.id,
      status: { in: ["DRAFT", "REJECTED"] },
      date: { gte: new Date(start), lt: new Date(end) },
    },
    data: { status: "SUBMITTED" },
  });
  revalidatePath("/timesheet");
}
