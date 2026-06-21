import { requireManager } from "@/lib/rbac";
import { financeOverview } from "@/lib/finance-overview";
import { formatVnd } from "@/lib/money";
import { resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import { PeriodNav } from "@/components/reports/period-nav";

export const dynamic = "force-dynamic";

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
  const breakdown = [
    { key: "payout", label: "Chi trả nhân sự (gộp)", value: f.payout },
    { key: "employerInsurance", label: "BH công ty đóng", value: f.employerInsurance },
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
            <CardDescription>Tổng thu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{formatVnd(f.incomeTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Tổng chi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-600">{formatVnd(f.expenseTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Số dư (Thu − Chi)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold ${f.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatVnd(f.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu thu</CardTitle>
            <CardDescription>Phân loại các khoản thu trong kỳ.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Doanh thu billable</span>
              <span className="font-medium">{formatVnd(f.revenue)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Nguồn thu khác</span>
              <span className="font-medium">{formatVnd(f.otherIncome)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Tổng thu</span>
              <span>{formatVnd(f.incomeTotal)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu chi</CardTitle>
            <CardDescription>Phân loại các khoản chi trong kỳ.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {breakdown.map((b) => (
              <div key={b.key} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">{formatVnd(b.value)}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t pt-3 font-semibold">
              <span>Tổng chi</span>
              <span>{formatVnd(f.expenseTotal)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ trọng chi</CardTitle>
            <CardDescription>Biểu đồ cơ cấu các khoản chi.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDonutChart data={breakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
