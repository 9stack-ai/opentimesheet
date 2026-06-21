import { requireManager } from "@/lib/rbac";
import { financeOverview } from "@/lib/finance-overview";
import { formatVnd } from "@/lib/money";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium"}>{formatVnd(value)}</span>
    </div>
  );
}

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const period = resolvePeriod(sp, now);

  const f = await financeOverview(period);

  // Donut: actual cash-out structure (money truly leaving) — not the accrued estimate.
  const actualCost = [
    { key: "disbursed", label: "Thực chi cho người", value: f.disbursed },
    { key: "regular", label: "Chi phí thường", value: f.regularExpense },
    { key: "irregular", label: "Chi bất thường", value: f.irregularExpense },
    { key: "fixed", label: "Chi phí cố định", value: f.fixedCost },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tổng quan thu chi</h1>

      <PeriodNav basePath="/manager/reports/finance" period={period} now={now} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Nguồn thu (thực tế)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{formatVnd(f.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Số dư thực tế (tiền mặt)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${f.actualNet >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVnd(f.actualNet)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Số dư dự kiến (sau tạm tính)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${f.projectedNet >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVnd(f.projectedNet)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thực tế (tiền mặt)</CardTitle>
            <CardDescription>Nguồn thu − Thực chi − Chi phí (theo ngày trong kỳ).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Nguồn thu" value={f.income} />
            <Row label="− Thực chi cho người" value={f.disbursed} />
            <Row label="− Chi phí thường" value={f.regularExpense} />
            <Row label="− Chi bất thường" value={f.irregularExpense} />
            <Row label="− Chi phí cố định" value={f.fixedCost} />
            <div className="mt-1 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Số dư thực tế</span>
              <span className={f.actualNet < 0 ? "text-rose-600" : "text-emerald-600"}>
                {formatVnd(f.actualNet)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tạm tính (từ chấm công)</CardTitle>
            <CardDescription>Lương phải trả theo giờ đã duyệt — chưa hẳn đã chi.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Lương phải trả (gộp)" value={f.accruedPayout} />
            <Row label="BH công ty (tạm tính)" value={f.employerInsurance} />
            <Row label="Đã thực chi" value={f.disbursed} muted />
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Còn phải trả người</span>
              <span className={`font-medium ${f.unpaidPayroll > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatVnd(f.unpaidPayroll)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Số dư dự kiến</span>
              <span className={f.projectedNet < 0 ? "text-rose-600" : "text-emerald-600"}>
                {formatVnd(f.projectedNet)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ trọng chi thực tế</CardTitle>
            <CardDescription>Cơ cấu tiền thực sự chi ra trong kỳ.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDonutChart data={actualCost} />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        &quot;Thực tế&quot; tính trên tiền thật vào/ra (Nguồn thu &amp; Thực chi). &quot;Tạm tính&quot;
        là lương ghi nhận từ chấm công đã duyệt — phần &quot;Còn phải trả&quot; là khoản chưa chi.
        Khoản thu/chi chưa đặt ngày sẽ không vào kỳ nào cho tới khi có ngày.
      </p>
    </div>
  );
}
