import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { effectiveRates } from "@/lib/rates";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { approveEntries, rejectEntries, retryRedminePush } from "./actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Approved entries whose Redmine push failed — surfaced to the manager for retry.
  const failedPushes = await prisma.timeEntry.findMany({
    where: { status: "APPROVED", redminePushStatus: "failed" },
    include: { user: { select: { name: true } }, task: { include: { project: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Duyệt công</h1>

      {submitted.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            Không có mục công nào đang chờ duyệt.
          </CardContent>
        </Card>
      ) : (
        <form className="flex flex-col gap-6">
          {Array.from(groups.values()).map((entries) => {
            const u = entries[0].user;
            return (
              <Card key={u.id}>
                <CardHeader>
                  <CardTitle className="text-base">{u.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2 text-sm">
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
                          <span>{e.hours.toString()} giờ</span>
                          <span className="text-muted-foreground">
                            Vốn: {formatVnd(Math.round(hours * rates.costRate))} · Bán:{" "}
                            {formatVnd(Math.round(hours * rates.billableRate))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              name="reason"
              placeholder="Lý do từ chối (tuỳ chọn)"
              className="w-64"
            />
            <SubmitButton formAction={approveEntries} pendingText="Đang duyệt…">
              Duyệt mục đã chọn
            </SubmitButton>
            <SubmitButton formAction={rejectEntries} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" pendingText="Đang xử lý…">
              Từ chối mục đã chọn
            </SubmitButton>
          </div>
        </form>
      )}

      {failedPushes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đẩy Redmine lỗi ({failedPushes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {failedPushes.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-2 border-b pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-medium">{e.user.name}</span>
                  <span>
                    {e.task.project.name} / {e.task.name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatISODate(e.date)} · {e.hours.toString()} giờ
                  </span>
                  {e.redminePushError ? (
                    <span className="text-destructive">{e.redminePushError}</span>
                  ) : null}
                  <form action={retryRedminePush} className="ml-auto">
                    <input type="hidden" name="entryId" value={e.id} />
                    <SubmitButton size="sm" variant="outline" pendingText="Đang đẩy…">
                      Đẩy lại
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
