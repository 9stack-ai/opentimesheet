"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { clientSchema } from "@/lib/validation";

export async function createClient(formData: FormData) {
  await requireManager();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const client = await prisma.client.create({ data: parsed.data });
  revalidatePath("/manager/clients");
  redirect(`/manager/clients/${client.id}`);
}

export async function updateClient(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return;
  await prisma.client.update({ where: { id }, data: parsed.data });
  revalidatePath(`/manager/clients/${id}`);
}

export async function deleteClient(formData: FormData) {
  await requireManager();
  const id = String(formData.get("id"));
  if (!id) return;
  const projectCount = await prisma.project.count({ where: { clientId: id } });
  if (projectCount > 0) return; // guard: keep clients that still have projects
  await prisma.client.delete({ where: { id } });
  revalidatePath("/manager/clients");
  redirect("/manager/clients");
}
