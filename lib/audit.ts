import { prisma } from "@/lib/db";

type Actor = { id: string; name?: string | null; email?: string | null; role: string };

/** Record an audit-trail entry (who did what). Best-effort: never throws, so a logging
 *  failure can't break the underlying action. Call after the mutation succeeds. */
export async function recordAudit(
  actor: Actor,
  action: string,
  summary: string,
  target?: { type: string; id: string },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorName: actor.name ?? actor.email ?? "—",
        actorRole: actor.role,
        action,
        summary,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record:", action, err);
  }
}
