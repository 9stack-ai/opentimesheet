import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatISODate, resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { formatVnd } from "@/lib/money";
import { lifetimeBalanceForUser } from "@/lib/disbursement-db";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { PeriodNav } from "@/components/reports/period-nav";
import { submitPeriod } from "./actions";
import { EntriesTable } from "./entries-table";
import type { EntryRow } from "./entries-table";
import { RedmineSyncButton } from "./redmine-sync-button";
import { UserPicker } from "./user-picker";
import { WorkSessionCard } from "./work-session-card";

export const dynamic = "force-dynamic";

function pct(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0%";
}

function PayRow({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium"}>{formatVnd(value)}</span>
    </div>
  );
}

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

  // Live work session — personal only (not shown when an admin logs on behalf of someone else).
  const activeSession = viewingOther
    ? null
    : await prisma.workSession.findUnique({
        where: { userId: sessionUser.id },
        select: { startedAt: true },
      });

  // Round to 2 decimals so floating-point sums (e.g. 2.62 + 1.5) don't show a long tail.
  const totalHours = Math.round(entries.reduce((sum, e) => sum + Number(e.hours), 0) * 100) / 100;
  // Net actually received by the person = gross − withheld PIT. Round gross and tax separately
  // (same decomposition as the manager payout report) so both screens show the identical net.
  const approved = entries.filter((e) => e.status === "APPROVED");
  const approvedGrossRaw = approved.reduce((s, e) => s + Number(e.hours) * (e.costRateSnapshot ?? 0), 0);
  const approvedTaxRaw = approved.reduce(
    (s, e) => s + (Number(e.hours) * (e.costRateSnapshot ?? 0) * (e.taxRateSnapshot ?? 0)) / 10000,
    0,
  );
  const approvedEmployerRaw = approved.reduce(
    (s, e) => s + (Number(e.hours) * (e.costRateSnapshot ?? 0) * (e.employerCostRateSnapshot ?? 0)) / 10000,
    0,
  );
  // Round gross & tax separately (same decomposition as the manager payout report) so both screens
  // show the identical net.
  const approvedGross = Math.round(approvedGrossRaw);
  const approvedTax = Math.round(approvedTaxRaw);
  const approvedEmployer = Math.round(approvedEmployerRaw);
  const approvedPayout = approvedGross - approvedTax; // thực nhận (net) trong kỳ
  // Công nợ luỹ kế (toàn thời gian): tổng net đã duyệt vs tổng đã thực chi — công nợ thật của người này.
  const life = await lifetimeBalanceForUser(targetUserId);
  const showPay = approvedGross > 0 || life.netOwed > 0 || life.paid > 0;
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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="inline-flex items-baseline gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 font-semibold text-primary">
            <span className="text-base tabular-nums">{totalHours}</span>
            <span className="text-xs">giờ</span>
          </span>
          {approvedPayout > 0 ? (
            <span className="inline-flex items-baseline gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 font-semibold text-emerald-700">
              <span className="text-xs">Thực nhận</span>
              <span className="text-base tabular-nums">{formatVnd(approvedPayout)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {viewingOther ? (
        <p className="-mt-3 text-sm text-muted-foreground">
          Đang chấm công hộ: <span className="font-medium text-foreground">{targetName}</span>
        </p>
      ) : (
        <WorkSessionCard
          activeSince={activeSession?.startedAt.toISOString() ?? null}
          tasks={taskOptions}
        />
      )}

      {showPay ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 text-sm sm:max-w-md">
            {approvedGross > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="font-medium">Thu nhập đã duyệt — kỳ {period.label}</div>
                <PayRow label="Lương gộp (trước thuế)" value={approvedGross} />
                {approvedTax > 0 ? (
                  <PayRow
                    label={`− Thuế TNCN công ty giữ lại (${pct(approvedTax, approvedGross)})`}
                    value={approvedTax}
                  />
                ) : null}
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>Thực nhận (net)</span>
                  <span className="text-emerald-600">{formatVnd(approvedPayout)}</span>
                </div>
                {approvedEmployer > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Ngoài lương, công ty đóng BH cho bạn: {formatVnd(approvedEmployer)} (
                    {pct(approvedEmployer, approvedGross)}) — không trừ vào thực nhận.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={`flex flex-col gap-2 ${approvedGross > 0 ? "border-t pt-3" : ""}`}>
              <div className="font-medium">Công nợ luỹ kế (toàn thời gian)</div>
              <PayRow label="Tổng thực nhận đã duyệt" value={life.netOwed} muted />
              <PayRow label="Đã nhận" value={life.paid} muted />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Còn chưa nhận</span>
                <span className={`font-medium ${life.remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {formatVnd(life.remaining)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Thuế giữ lại được nộp cho cơ quan thuế. &quot;Còn chưa nhận&quot; = tổng thực nhận − tổng đã nhận
                (toàn thời gian).
              </p>
            </div>
          </CardContent>
        </Card>
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
          <SubmitButton pendingText="Đang gửi…">Gửi duyệt kỳ {period.label}</SubmitButton>
          <span className="text-xs text-muted-foreground">Sẽ khoá tất cả dòng nháp trong kỳ.</span>
        </form>
      ) : null}
    </div>
  );
}
