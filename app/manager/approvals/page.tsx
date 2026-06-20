import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { effectiveRates } from "@/lib/rates";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { approveEntries, rejectEntries } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireManager();

  const submitted = await prisma.timeEntry.findMany({
    where: { status: "SUBMITTED" },
    include: {
      user: { select: { id: true, name: true, defaultCostRate: true, defaultBillableRate: true } },
      task: { include: { project: { include: { client: true } } } },
    },
    orderBy: [{ userId: "asc" }, { date: "asc" }],
  });

  // Effective rates per (project,user) for preview amounts.
  const aMap = new Map<string, { costRateOverride: number | null; billableRateOverride: number | null }>();
  if (submitted.length > 0) {
    const pairs = Array.from(new Set(submitted.map((e) => `${e.task.projectId}:${e.userId}`))).map((k) => {
      const [projectId, userId] = k.split(":");
      return { projectId, userId };
    });
    const assignments = await prisma.assignment.findMany({
      where: { OR: pairs.map((p) => ({ projectId: p.projectId, userId: p.userId })) },
      select: { projectId: true, userId: true, costRateOverride: true, billableRateOverride: true },
    });
    for (const a of assignments) aMap.set(`${a.projectId}:${a.userId}`, a);
  }

  const groups = new Map<string, typeof submitted>();
  for (const e of submitted) {
    const arr = groups.get(e.user.id) ?? [];
    arr.push(e);
    groups.set(e.user.id, arr);
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Approvals</h1>

      {submitted.length === 0 ? (
        <p className="text-gray-500">No submitted timesheets awaiting approval.</p>
      ) : (
        <form className="flex flex-col gap-6">
          {Array.from(groups.values()).map((entries) => {
            const u = entries[0].user;
            return (
              <div key={u.id} className="rounded border border-gray-200 p-4">
                <h2 className="mb-2 font-medium">{u.name}</h2>
                <ul className="flex flex-col gap-1 text-sm">
                  {entries.map((e) => {
                    const rates = effectiveRates(aMap.get(`${e.task.projectId}:${e.userId}`) ?? null, {
                      defaultCostRate: u.defaultCostRate,
                      defaultBillableRate: u.defaultBillableRate,
                    });
                    const hours = Number(e.hours);
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-2">
                        <input type="checkbox" name="entryId" value={e.id} defaultChecked />
                        <span className="font-medium">{formatISODate(e.date)}</span>
                        <span>
                          {e.task.project.client.name} / {e.task.project.name} / {e.task.name}
                        </span>
                        <span>{e.hours.toString()} h</span>
                        <span className="text-gray-500">
                          cost {formatVnd(Math.round(hours * rates.costRate))} · bill{" "}
                          {formatVnd(Math.round(hours * rates.billableRate))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <input
              name="reason"
              placeholder="Rejection reason (optional)"
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              formAction={approveEntries}
              className="rounded bg-black px-3 py-2 text-sm text-white"
            >
              Approve selected
            </button>
            <button
              type="submit"
              formAction={rejectEntries}
              className="rounded border border-red-300 px-3 py-2 text-sm text-red-700"
            >
              Reject selected
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
