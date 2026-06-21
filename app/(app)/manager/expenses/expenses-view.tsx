import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate, resolvePeriod, type PeriodSearchParams } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { PeriodNav } from "@/components/reports/period-nav";
import { ExpensesTable } from "./expenses-table";
import type { ExpenseRow } from "./expenses-table";

// Shared list/CRUD view for both regular expenses and irregular (chi bất thường),
// distinguished by Expense.kind. Same UI, different filter + heading. Scoped by period
// (như Nguồn thu/Thực chi) so the total matches what feeds the finance report.
export async function ExpensesView({
  kind,
  title,
  basePath,
  searchParams,
}: {
  kind: "REGULAR" | "IRREGULAR";
  title: string;
  basePath: string;
  searchParams: PeriodSearchParams;
}) {
  await requireManager();
  const now = nowSaigon();
  const today = now.toISOString().slice(0, 10);
  const period = resolvePeriod(searchParams, now);

  const [projects, expenses, cats] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" }, include: { client: true } }),
    prisma.expense.findMany({
      where: { kind, date: { gte: period.start, lt: period.end } },
      orderBy: { date: "desc" },
      include: { project: { include: { client: true } } },
    }),
    // Danh mục đã dùng (cho gợi ý nhập) — gộp cả hai loại để thống nhất cách gõ.
    prisma.expense.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categories = cats.map((c) => c.category);

  const rows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    date: formatISODate(e.date),
    category: e.category,
    projectLabel: e.project ? `${e.project.client.name} / ${e.project.name}` : "Công ty",
    amount: e.amount,
    projectId: e.projectId,
    kind: e.kind,
    note: e.note,
  }));

  const projectOptions = projects.map((p) => ({
    id: p.id,
    clientName: p.client.name,
    name: p.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <PeriodNav basePath={basePath} period={period} now={now} />

      <ExpensesTable data={rows} projects={projectOptions} categories={categories} today={today} kind={kind} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng kỳ {period.label}</span>
          <span>{formatVnd(total)}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có khoản nào trong kỳ {period.label}.</p>
      )}
    </div>
  );
}
