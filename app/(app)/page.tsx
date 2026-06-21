import Link from "next/link";
import { Building2, CheckSquare, Clock, TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { atLeastManager } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { formatVnd } from "@/lib/money";
import { nowSaigon } from "@/lib/clock";
import { resolvePeriod, periodParam, type Period, type PeriodSearchParams } from "@/lib/period";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceChartCard } from "@/components/charts/finance-chart-card";
import { HoursBarChart } from "@/components/charts/hours-bar-chart";
import { PeriodNav } from "@/components/reports/period-nav";
import { managerKpis, managerMonthlyFinance, freelancerMonthlyHours } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone?: string;
  href?: string;
}) {
  const card = (
    <Card className={href ? "h-full transition-colors hover:border-primary/50 hover:bg-accent/40" : undefined}>
      <CardHeader className="pb-1">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

async function ManagerCharts({ period }: { period: Period }) {
  const [kpis, finance] = await Promise.all([managerKpis(period), managerMonthlyFinance(12)]);
  const ep = periodParam(period);
  const pq = `${ep.key}=${ep.value}`; // preserve the selected period when drilling in
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label={`Nguồn thu (${period.label})`} value={formatVnd(kpis.income)} href="/manager/income" />
        <Kpi
          label={`Số dư thực tế (${period.label})`}
          value={formatVnd(kpis.actualNet)}
          href={`/manager/reports/finance?${pq}`}
        />
        <Kpi
          label={`Số dư dự kiến (${period.label})`}
          value={formatVnd(kpis.projectedNet)}
          href={`/manager/reports/finance?${pq}`}
        />
        <Kpi
          label={`Đang chờ chi (${period.label})`}
          value={formatVnd(kpis.unpaidPayroll)}
          tone={kpis.unpaidPayroll > 0 ? "text-amber-600" : "text-emerald-600"}
          href={`/manager/disbursements?${pq}`}
        />
        <Kpi label="Dự án đang chạy" value={String(kpis.activeProjects)} href="/manager/clients" />
      </div>
      <FinanceChartCard data={finance} />
    </>
  );
}

async function FreelancerCharts({ userId }: { userId: string }) {
  const hours = await freelancerMonthlyHours(userId);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Giờ công đã duyệt (6 tháng)</CardTitle>
        <CardDescription>Tổng giờ công đã được duyệt theo từng tháng.</CardDescription>
      </CardHeader>
      <CardContent>
        <HoursBarChart data={hours} />
      </CardContent>
    </Card>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  const user = await requireUser();
  const isManager = atLeastManager(user.role);
  const isAdmin = user.role === "ADMIN";
  const now = nowSaigon();
  const period = resolvePeriod(await searchParams, now);

  const cards = [
    { href: "/timesheet", title: "Chấm công", desc: "Ghi giờ làm và gửi duyệt", icon: Clock, show: true },
    { href: "/manager/approvals", title: "Duyệt công", desc: "Duyệt giờ công cộng tác viên", icon: CheckSquare, show: isManager },
    { href: "/manager/clients", title: "Khách hàng & dự án", desc: "Quản lý khách hàng, dự án, đơn giá", icon: Building2, show: isManager },
    { href: "/manager/reports/payout", title: "Chi trả CTV", desc: "Tổng tiền phải trả theo kỳ", icon: Wallet, show: isManager },
    { href: "/manager/reports/profitability", title: "Lợi nhuận", desc: "Doanh thu, chi phí và lãi/lỗ", icon: TrendingUp, show: isManager },
    { href: "/admin/users", title: "Người dùng", desc: "Mời và phân quyền người dùng", icon: Users, show: isAdmin },
  ].filter((c) => c.show);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Xin chào, {user.name} 👋</h1>
        <p className="text-muted-foreground">Bạn đang đăng nhập với vai trò {roleLabel(user.role)}.</p>
      </div>

      {isManager ? (
        <>
          <PeriodNav basePath="/" period={period} now={now} />
          <ManagerCharts period={period} />
        </>
      ) : (
        <FreelancerCharts userId={user.id} />
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Lối tắt</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href} className="block">
                <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
                  <CardHeader>
                    <div className="mb-1 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-base">{c.title}</CardTitle>
                    </div>
                    <CardDescription>{c.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
