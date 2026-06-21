import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManager } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { roleLabel } from "@/lib/labels";
import { nowSaigon } from "@/lib/clock";
import { resolvePeriod, periodParam, formatISODate, type PeriodSearchParams } from "@/lib/period";
import { paidToUserInPeriod } from "@/lib/disbursement-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-semibold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function PayoutUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const { userId } = await params;
  const now = nowSaigon();
  const period = resolvePeriod(await searchParams, now);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });
  if (!user) notFound();

  const entries = await prisma.timeEntry.findMany({
    where: { userId, status: "APPROVED", date: { gte: period.start, lt: period.end } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      hours: true,
      note: true,
      costRateSnapshot: true,
      taxRateSnapshot: true,
      task: { select: { name: true } },
    },
  });

  // Round at the total (consistent with the payout report): net = round(Σgross) − round(Σtax).
  const rows = entries.map((e) => {
    const cost = e.costRateSnapshot ?? 0;
    const taxBps = e.taxRateSnapshot ?? 0;
    const grossRaw = e.hours * cost;
    const taxRaw = (grossRaw * taxBps) / 10000;
    return {
      id: e.id,
      date: formatISODate(e.date),
      note: e.note ?? e.task.name,
      hours: e.hours,
      grossRaw,
      taxRaw,
      gross: Math.round(grossRaw),
      tax: Math.round(taxRaw),
      net: Math.round(grossRaw) - Math.round(taxRaw),
    };
  });

  const hours = rows.reduce((s, r) => s + r.hours, 0);
  const gross = Math.round(rows.reduce((s, r) => s + r.grossRaw, 0));
  const tax = Math.round(rows.reduce((s, r) => s + r.taxRaw, 0));
  const net = gross - tax;
  const paid = await paidToUserInPeriod(userId, period);
  const remaining = net - paid;
  const ep = periodParam(period);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{roleLabel(user.role)} · chi tiết theo kỳ</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/payout?${ep.key}=${ep.value}`}>← Chi trả CTV</Link>
        </Button>
      </div>

      <PeriodNav basePath={`/manager/reports/payout/${userId}`} period={period} now={now} />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Số giờ" value={String(hours)} />
        <Stat label="Gộp (trước thuế)" value={formatVnd(gross)} />
        <Stat label="Thuế giữ lại" value={formatVnd(tax)} />
        <Stat label="Thực nhận" value={formatVnd(net)} />
        <Stat label="Đã trả" value={formatVnd(paid)} />
        <Stat
          label="Còn lại"
          value={formatVnd(remaining)}
          tone={remaining > 0 ? "text-amber-600" : remaining < 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Ngày</th>
              <th className="px-3 py-2 text-left font-medium">Công việc</th>
              <th className="px-3 py-2 text-right font-medium">Giờ</th>
              <th className="px-3 py-2 text-right font-medium">Gộp</th>
              <th className="px-3 py-2 text-right font-medium">Thuế</th>
              <th className="px-3 py-2 text-right font-medium">Thực nhận</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Không có công đã duyệt trong kỳ {period.label}.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="whitespace-nowrap px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.note}</td>
                  <td className="px-3 py-2 text-right">{r.hours}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(r.gross)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(r.tax)}</td>
                  <td className="px-3 py-2 text-right">{formatVnd(r.net)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
