import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { signOut } from "@/auth";
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
import { createEntry, updateEntry, deleteEntry, submitPeriod } from "./actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-2 py-1 text-sm";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  // "Today" in Asia/Saigon (UTC+7, no DST).
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My timesheet</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-blue-700 underline">
            Home
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="rounded border border-gray-300 px-2 py-1">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">Period: {period.label}</span>
        <Link href={`/timesheet?month=${currentMonthLabel}`} className="text-blue-700 underline">
          This month
        </Link>
        <Link href={`/timesheet?week=${currentWeekLabel}`} className="text-blue-700 underline">
          This week
        </Link>
        <span className="ml-auto font-medium">Total: {totalHours} h</span>
        {approvedPayout > 0 ? (
          <span className="font-medium">Approved payout: {formatVnd(approvedPayout)}</span>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-500">You are not assigned to any project yet.</p>
      ) : (
        <form action={createEntry} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4">
          <select name="taskId" required className={inputClass} aria-label="Task">
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.project.client.name} / {t.project.name} / {t.name}
              </option>
            ))}
          </select>
          <input name="date" type="date" defaultValue={todayStr} required className={inputClass} />
          <input
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            placeholder="Hours"
            required
            className={`${inputClass} w-24`}
          />
          <input name="note" placeholder="Note (optional)" className={inputClass} />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
            Log time
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e.id} className="rounded border border-gray-200 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-medium">{formatISODate(e.date)}</span> · {e.task.project.name} /{" "}
                {e.task.name} · {e.hours.toString()} h
              </span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{e.status}</span>
            </div>
            {e.note ? <p className="mt-1 text-gray-600">{e.note}</p> : null}
            {e.status === "REJECTED" && e.rejectReason ? (
              <p className="mt-1 text-sm text-red-600">Rejected: {e.rejectReason}</p>
            ) : null}

            {e.status === "DRAFT" || e.status === "REJECTED" ? (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <form action={updateEntry} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <select name="taskId" defaultValue={e.taskId} className={inputClass} aria-label="Task">
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.project.name} / {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="date"
                    type="date"
                    defaultValue={formatISODate(e.date)}
                    className={inputClass}
                  />
                  <input
                    name="hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    defaultValue={e.hours.toString()}
                    className={`${inputClass} w-20`}
                  />
                  <input name="note" defaultValue={e.note ?? ""} className={inputClass} />
                  <button type="submit" className="rounded border border-gray-300 px-2 py-1">
                    Save
                  </button>
                </form>
                <form action={deleteEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="rounded border border-red-300 px-2 py-1 text-red-700">
                    Delete
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {entries.length === 0 ? <p className="text-gray-500">No entries in this period.</p> : null}
      </div>

      {hasDraft ? (
        <form action={submitPeriod} className="flex items-center gap-2">
          <input type="hidden" name="start" value={period.start.toISOString()} />
          <input type="hidden" name="end" value={period.end.toISOString()} />
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
            Submit {period.label} for approval
          </button>
          <span className="text-xs text-gray-500">Locks all draft entries in this period.</span>
        </form>
      ) : null}
    </main>
  );
}
