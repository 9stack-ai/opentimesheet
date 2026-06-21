// Pure authorization helpers for timesheet actions — no DB import, so unit-testable in isolation.
// These decide WHO a timesheet action operates on and WHETHER it is allowed.
import type { Role } from "@/lib/roles";

/**
 * Resolve which user a timesheet action operates on.
 *
 * Only ADMIN may act on behalf of another user. For everyone else the actor is forced to
 * themselves, so a forged `targetUserId` from a non-admin form submission is ignored.
 */
export function resolveTargetUserId(
  actor: { id: string; role: Role },
  requestedUserId: string | null | undefined,
): string {
  if (actor.role === "ADMIN" && requestedUserId) return requestedUserId;
  return actor.id;
}

/**
 * Whether `actor` may create/update/delete a given entry.
 *
 * ADMIN may modify any entry in any status (incl. APPROVED). The owner may only modify their
 * own entry while it is still editable (DRAFT or REJECTED). Anyone else is denied.
 */
export function canModifyEntry(actorRole: Role, isOwner: boolean, status: string): boolean {
  if (actorRole === "ADMIN") return true;
  return isOwner && (status === "DRAFT" || status === "REJECTED");
}
