import { prisma } from "@/lib/db";
import { getRedmineClientForUser } from "./connection";
import { RedmineError, type RedmineIssue } from "./types";
import { taskNameForIssue } from "./format";

export type SyncCounts = { created: number; updated: number; closed: number; projects: number };

// In-memory per-(user,project) lock with staleness self-heal (single-host `next start` = one
// process). A crashed/timed-out sync clears itself after LOCK_MS so the user is never stuck.
const LOCK_MS = 2 * 60 * 1000;
const inFlight = new Map<string, number>();

async function syncProjectForUser(
  projectId: string,
  redmineProjectId: number,
  userId: string,
): Promise<{ created: number; updated: number; closed: number }> {
  const client = await getRedmineClientForUser(userId);
  if (!client) throw new RedmineError("auth", "Bạn chưa kết nối Redmine.");

  // Incremental: from the latest synced issue-update in this project.
  const latest = await prisma.task.findFirst({
    where: { projectId, source: "REDMINE", redmineUpdatedOn: { not: null } },
    orderBy: { redmineUpdatedOn: "desc" },
    select: { redmineUpdatedOn: true },
  });

  let issues: RedmineIssue[];
  try {
    issues = await client.listAssignedIssues({
      projectId: redmineProjectId,
      since: latest?.redmineUpdatedOn ?? undefined,
    });
  } catch (e) {
    if (e instanceof RedmineError && (e.kind === "forbidden" || e.kind === "notfound")) {
      throw new RedmineError(e.kind, "Không có quyền truy cập Redmine project này.");
    }
    throw e;
  }

  let created = 0;
  let updated = 0;
  let closed = 0;
  for (const issue of issues) {
    const isClosed = issue.status.is_closed ?? false;
    if (isClosed) closed++;
    const data = {
      name: taskNameForIssue(issue),
      source: "REDMINE",
      redmineUpdatedOn: new Date(issue.updated_on),
      redmineClosed: isClosed,
      syncedAt: new Date(),
    };
    const existing = await prisma.task.findUnique({
      where: { projectId_redmineIssueId: { projectId, redmineIssueId: issue.id } },
    });
    if (existing) {
      await prisma.task.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.task.create({
        data: { ...data, projectId, redmineIssueId: issue.id, status: "open" },
      });
      created++;
    }
  }
  return { created, updated, closed };
}

/** Sync every Redmine-mapped project the user is assigned to. Idempotent + self-healing. */
export async function syncAllForUser(userId: string): Promise<SyncCounts> {
  const assignments = await prisma.assignment.findMany({
    where: { userId, project: { redmineProjectId: { not: null } } },
    select: { project: { select: { id: true, redmineProjectId: true } } },
  });

  const counts: SyncCounts = { created: 0, updated: 0, closed: 0, projects: 0 };
  for (const { project } of assignments) {
    if (project.redmineProjectId == null) continue;
    const key = `${userId}:${project.id}`;
    const started = inFlight.get(key);
    if (started && Date.now() - started < LOCK_MS) continue; // already syncing (self-heals)
    inFlight.set(key, Date.now());
    try {
      const r = await syncProjectForUser(project.id, project.redmineProjectId, userId);
      counts.created += r.created;
      counts.updated += r.updated;
      counts.closed += r.closed;
      counts.projects++;
    } finally {
      inFlight.delete(key);
    }
  }
  return counts;
}
