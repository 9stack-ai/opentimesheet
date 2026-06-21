import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatISODate, resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { formatVnd } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PeriodNav } from "@/components/reports/period-nav";
import { submitPeriod } from "./actions";
import { EntriesTable } from "./entries-table";
import type { EntryRow } from "./entries-table";
import { RedmineSyncButton } from "./redmine-sync-button";
import { UserPicker } from "./user-picker";

export const dynamic = "force-dynamic";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams & { userId?: string }>;
}) {
  const sessionUser = await requireUser();
  const isAdmin = sessionUser.role === "ADMIN";
  const sp = await searchParams;

  // ADMIN may view/edit another user's timesheet via ?userId=. The target is validated against the
  // user list so a bad id falls back to self; non-admins are always pinned to themselves.
  const userOptions = isAdmin
    ? await prisma.user.findMany({
        where: { status: { not: "DISABLED" } },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];
  const requestedUserId = isAdmin ? sp.userId : undefined;
  const targetUserId =
    requestedUserId && userOptions.some((u) => u.id === requestedUserId)
      ? requestedUserId
      : sessionUser.id;
  const viewingOther = targetUserId !== sessionUser.id;
  const targetName = viewingOther
    ? userOptions.find((u) => u.id === targetUserId)?.name ?? ""
    : "";

  const saigonNow = nowSaigon();
  const todayStr = saigonNow.toISOString().slice(0, 10);
  const period = resolvePeriod(sp, saigonNow);

  const assignments = await prisma.assignment.findMany({
    where: { userId: targetUserId },
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
    where: { userId: targetUserId, date: { gte: period.start, lt: period.end } },
    include: { task: { include: { project: true } } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  // Net actually received by the person = gross − withheld PIT. Round gross and tax separately
  // (same decomposition as the manager payout report) so both screens show the identical net.
  const approved = entries.filter((e) => e.status === "APPROVED");
  const approvedGrossRaw = approved.reduce((s, e) => s + Number(e.hours) * (e.costRateSnapshot ?? 0), 0);
  const approvedTaxRaw = approved.reduce(
    (s, e) => s + (Number(e.hours) * (e.costRateSnapshot ?? 0) * (e.taxRateSnapshot ?? 0)) / 10000,
    0,
  );
  const approvedPayout = Math.round(approvedGrossRaw) - Math.round(approvedTaxRaw);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Chấm công</h1>
        <PeriodNav
          basePath="/timesheet"
          period={period}
          now={saigonNow}
          extraQuery={viewingOther ? `userId=${targetUserId}` : undefined}
        />
        {isAdmin ? <UserPicker users={userOptions} value={targetUserId} /> : null}
        {!viewingOther ? <RedmineSyncButton /> : null}
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            Tổng: <span className="font-semibold">{totalHours} giờ</span>
          </span>
          {approvedPayout > 0 ? (
            <span>
              Đã duyệt (thực nhận): <span className="font-semibold">{formatVnd(approvedPayout)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {viewingOther ? (
        <p className="-mt-3 text-sm text-muted-foreground">
          Đang chấm công hộ: <span className="font-medium text-foreground">{targetName}</span>
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            {viewingOther
              ? "Người dùng này chưa được phân vào dự án nào."
              : "Bạn chưa được phân vào dự án nào."}
          </CardContent>
        </Card>
      ) : (
        <EntriesTable
          data={rows}
          tasks={taskOptions}
          today={todayStr}
          targetUserId={isAdmin ? targetUserId : undefined}
          canEditAll={isAdmin}
        />
      )}

      {hasDraft ? (
        <form action={submitPeriod} className="flex items-center gap-3">
          <input type="hidden" name="start" value={period.start.toISOString()} />
          <input type="hidden" name="end" value={period.end.toISOString()} />
          {isAdmin ? <input type="hidden" name="targetUserId" value={targetUserId} /> : null}
          <Button type="submit">Gửi duyệt kỳ {period.label}</Button>
          <span className="text-xs text-muted-foreground">Sẽ khoá tất cả dòng nháp trong kỳ.</span>
        </form>
      ) : null}
    </div>
  );
}
