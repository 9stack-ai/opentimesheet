import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import {
  formatISODate,
  monthPeriod,
  weekPeriod,
  monthPeriodFromString,
  weekPeriodFromString,
  type Period,
} from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { formatVnd } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitPeriod } from "./actions";
import { EntriesTable } from "./entries-table";
import type { EntryRow } from "./entries-table";
import { RedmineSyncButton } from "./redmine-sync-button";

export const dynamic = "force-dynamic";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const saigonNow = nowSaigon();
  const curYear = saigonNow.getUTCFullYear();
  const curMonth = saigonNow.getUTCMonth() + 1;
  const todayStr = saigonNow.toISOString().slice(0, 10);

  let period: Period;
  if (sp.week) period = weekPeriodFromString(sp.week) ?? weekPeriod(saigonNow);
  else if (sp.month) period = monthPeriodFromString(sp.month) ?? monthPeriod(curYear, curMonth);
  else period = monthPeriod(curYear, curMonth);

  const currentMonthLabel = monthPeriod(curYear, curMonth).label;
  const currentWeekLabel = weekPeriod(saigonNow).label;

  const assignments = await prisma.assignment.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });
  const projectIds = assignments.map((a) => a.projectId);
  const tasks = projectIds.length
    ? await prisma.task.findMany({
        where: { projectId: { in: projectIds }, redmineClosed: false },
        include: { project: { include: { client: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  const entries = await prisma.timeEntry.findMany({
    where: { userId: user.id, date: { gte: period.start, lt: period.end } },
    include: { task: { include: { project: true } } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const approvedPayout = Math.round(
    entries
      .filter((e) => e.status === "APPROVED")
      .reduce((sum, e) => sum + Number(e.hours) * (e.costRateSnapshot ?? 0), 0),
  );
  const hasDraft = entries.some((e) => e.status === "DRAFT" || e.status === "REJECTED");

  // Serialise tasks to plain objects for client components.
  const taskOptions = tasks.map((t) => ({
    id: t.id,
    label: `${t.project.client.name} / ${t.project.name} / ${t.name}`,
  }));

  const rows: EntryRow[] = entries.map((e) => ({
    id: e.id,
    date: formatISODate(e.date),
    taskId: e.taskId,
    taskLabel: `${e.task.project.name} / ${e.task.name}`,
    hours: e.hours.toString(),
    status: e.status,
    note: e.note,
    rejectReason: e.rejectReason,
    redminePushStatus: e.redminePushStatus,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Chấm công</h1>
        <span className="text-sm text-muted-foreground">Kỳ: {period.label}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/timesheet?month=${currentMonthLabel}`}>Tháng này</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/timesheet?week=${currentWeekLabel}`}>Tuần này</Link>
        </Button>
        <RedmineSyncButton />
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            Tổng: <span className="font-semibold">{totalHours} giờ</span>
          </span>
          {approvedPayout > 0 ? (
            <span>
              Đã duyệt: <span className="font-semibold">{formatVnd(approvedPayout)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            Bạn chưa được phân vào dự án nào.
          </CardContent>
        </Card>
      ) : (
        <EntriesTable data={rows} tasks={taskOptions} today={todayStr} />
      )}

      {hasDraft ? (
        <form action={submitPeriod} className="flex items-center gap-3">
          <input type="hidden" name="start" value={period.start.toISOString()} />
          <input type="hidden" name="end" value={period.end.toISOString()} />
          <Button type="submit">Gửi duyệt kỳ {period.label}</Button>
          <span className="text-xs text-muted-foreground">Sẽ khoá tất cả dòng nháp trong kỳ.</span>
        </form>
      ) : null}
    </div>
  );
}
