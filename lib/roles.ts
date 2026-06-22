// Role union — kept free of Prisma imports so edge middleware can use it.
// Values match the Prisma `Role` enum exactly.
export const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE", "FREELANCER", "INTERN"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** ADMIN or MANAGER. */
export function atLeastManager(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
