import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { atLeastManager, type Role } from "@/lib/roles";

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Require one of the given roles; redirect home if logged-in-but-forbidden. */
export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/** Require ADMIN or MANAGER. */
export async function requireManager() {
  const user = await requireUser();
  if (!atLeastManager(user.role)) redirect("/");
  return user;
}
