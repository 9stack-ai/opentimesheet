import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/period";
import { getRedmineClientForUser } from "./connection";
import { type RedmineClient } from "./client";
import { RedmineError } from "./types";
import { pushComment } from "./format";

async function resolveActivityId(client: RedmineClient): Promise<number | null> {
  const envId = process.env.REDMINE_DEFAULT_ACTIVITY_ID;
  if (envId && Number.isInteger(Number(envId))) return Number(envId);
  const activities = await client.listTimeEntryActivities();
  return activities.find((a) => a.is_default)?.id ?? activities[0]?.id ?? null;
}

async function pushOne(entryId: string): Promise<void> {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { task: { select: { redmineIssueId: true } } },
  });
  if (!entry) return;
  if (entry.redmineTimeEntryId) return; // already pushed — idempotent
  if (entry.task.redmineIssueId == null) {
    await prisma.timeEntry.update({ where: { id: entryId }, data: { redminePushStatus: "skipped" } });
    return;
  }

  const client = await getRedmineClientForUser(entry.userId);
  if (!client) {
    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { redminePushStatus: "failed", redminePushError: "Người dùng chưa kết nối Redmine." },
    });
    return;
  }

  await prisma.timeEntry.update({ where: { id: entryId }, data: { redminePushStatus: "pushing" } });
  try {
    const activityId = await resolveActivityId(client);
    if (activityId == null) {
      throw new RedmineError("validation", "Chưa cấu hình activity (đặt REDMINE_DEFAULT_ACTIVITY_ID).");
    }
    const res = await client.createTimeEntry({
      issueId: entry.task.redmineIssueId,
      hours: Number(entry.hours),
      spentOn: formatISODate(entry.date),
      activityId,
      comments: pushComment(entry.note, entry.id),
    });
    await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        redmineTimeEntryId: res.id,
        redminePushedAt: new Date(),
        redminePushStatus: "pushed",
        redminePushError: null,
      },
    });
  } catch (e) {
    await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        redminePushStatus: "failed",
        redminePushError: e instanceof RedmineError ? e.message : "Đẩy giờ thất bại.",
      },
    });
  }
}

/** Best-effort push of approved entries. NEVER throws — approval must not be affected. */
export async function pushApprovedEntries(entryIds: string[]): Promise<void> {
  for (const id of entryIds) {
    try {
      await pushOne(id);
    } catch {
      /* push is best-effort; swallow so approval is never impacted */
    }
  }
}

export async function retryPush(entryId: string): Promise<void> {
  await pushOne(entryId);
}
