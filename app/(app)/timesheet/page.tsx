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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryStatusBadge } from "@/components/status-badge";
import { createEntry, updateEntry, deleteEntry, submitPeriod } from "./actions";

export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

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
        where: { projectId: { in: projectIds } },
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi giờ làm</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEntry} className="flex flex-wrap items-end gap-2">
              <select name="taskId" required className={selectClass} aria-label="Công việc">
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.project.client.name} / {t.project.name} / {t.name}
                  </option>
                ))}
              </select>
              <Input name="date" type="date" defaultValue={todayStr} required className="w-auto" />
              <Input name="hours" type="number" step="0.25" min="0.25" max="24" placeholder="Số giờ" required className="w-24" />
              <Input name="note" placeholder="Ghi chú (tuỳ chọn)" className="w-48" />
              <Button type="submit">Ghi công</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{formatISODate(e.date)}</span> · {e.task.project.name} /{" "}
                  {e.task.name} · {e.hours.toString()} giờ
                </span>
                <EntryStatusBadge status={e.status} />
              </div>
              {e.note ? <p className="mt-1 text-muted-foreground">{e.note}</p> : null}
              {e.status === "REJECTED" && e.rejectReason ? (
                <p className="mt-1 text-sm text-destructive">Lý do từ chối: {e.rejectReason}</p>
              ) : null}

              {e.status === "DRAFT" || e.status === "REJECTED" ? (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <form action={updateEntry} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={e.id} />
                    <select name="taskId" defaultValue={e.taskId} className={selectClass} aria-label="Công việc">
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.project.name} / {t.name}
                        </option>
                      ))}
                    </select>
                    <Input name="date" type="date" defaultValue={formatISODate(e.date)} className="w-auto" />
                    <Input name="hours" type="number" step="0.25" min="0.25" max="24" defaultValue={e.hours.toString()} className="w-20" />
                    <Input name="note" defaultValue={e.note ?? ""} className="w-40" />
                    <Button type="submit" variant="outline" size="sm">
                      Lưu
                    </Button>
                  </form>
                  <form action={deleteEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Xoá
                    </Button>
                  </form>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 ? (
          <p className="text-muted-foreground">Chưa có dòng công nào trong kỳ này.</p>
        ) : null}
      </div>

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
