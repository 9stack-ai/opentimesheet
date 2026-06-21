"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { projectSchema, taskSchema, assignmentSchema } from "@/lib/validation";

export async function createProject(formData: FormData) {
  await requireManager();
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const project = await prisma.project.create({ data: parsed.data });
  revalidatePath(`/manager/clients/${parsed.data.clientId}`);
  redirect(`/manager/projects/${project.id}`);
}

export async function renameProject(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  if (!id || !name) return;
  await prisma.project.update({ where: { id }, data: { name } });
  revalidatePath(`/manager/projects/${id}`);
}

export async function setProjectStatus(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status !== "ACTIVE" && status !== "ARCHIVED") return;
  await prisma.project.update({ where: { id }, data: { status } });
  revalidatePath(`/manager/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const clientId = String(formData.get("clientId"));
  if (!id) return;
  // Guard: never delete a project that has logged time (protects approved timesheet data).
  const entries = await prisma.timeEntry.count({ where: { task: { projectId: id } } });
  if (entries > 0) return;
  await prisma.$transaction([
    // Keep any project-tagged expenses as company-level rather than deleting them.
    prisma.expense.updateMany({ where: { projectId: id }, data: { projectId: null } }),
    prisma.assignment.deleteMany({ where: { projectId: id } }),
    prisma.task.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);
  revalidatePath(`/manager/clients/${clientId}`);
  redirect(`/manager/clients/${clientId}`);
}

export async function createTask(formData: FormData) {
  await requireManager();
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await prisma.task.create({ data: parsed.data });
  revalidatePath(`/manager/projects/${parsed.data.projectId}`);
}

export async function updateTask(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const projectId = String(formData.get("projectId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await prisma.task.update({ where: { id }, data: { name } });
  revalidatePath(`/manager/projects/${projectId}`);
}

export async function deleteTask(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const projectId = String(formData.get("projectId"));
  if (!id) return;
  const entries = await prisma.timeEntry.count({ where: { taskId: id } });
  if (entries > 0) return; // guard: task has logged time
  await prisma.task.delete({ where: { id } });
  revalidatePath(`/manager/projects/${projectId}`);
}

export async function addAssignment(formData: FormData) {
  await requireManager();
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { projectId, userId, costRateOverride, billableRateOverride } = parsed.data;
  await prisma.assignment.upsert({
    where: { projectId_userId: { projectId, userId } },
    update: {
      costRateOverride: costRateOverride ?? null,
      billableRateOverride: billableRateOverride ?? null,
    },
    create: {
      projectId,
      userId,
      costRateOverride: costRateOverride ?? null,
      billableRateOverride: billableRateOverride ?? null,
    },
  });
  revalidatePath(`/manager/projects/${projectId}`);
}

export async function removeAssignment(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const projectId = String(formData.get("projectId"));
  if (!id) return;
  await prisma.assignment.delete({ where: { id } });
  revalidatePath(`/manager/projects/${projectId}`);
}

export async function setProjectRedmineId(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const raw = String(formData.get("redmineProjectId") ?? "").trim();
  const redmineProjectId = raw === "" ? null : Number(raw);
  if (redmineProjectId !== null && (!Number.isInteger(redmineProjectId) || redmineProjectId <= 0)) return;
  await prisma.project.update({ where: { id }, data: { redmineProjectId } });
  revalidatePath(`/manager/projects/${id}`);
}
