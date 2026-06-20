import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { ExpensesTable } from "./expenses-table";
import type { ExpenseRow } from "./expenses-table";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireManager();
  const today = nowSaigon().toISOString().slice(0, 10);

  const [projects, expenses] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: "asc" }, include: { client: true } }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { project: { include: { client: true } } },
    }),
  ]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const rows: ExpenseRow[] = expenses.map((e) => ({
    id: e.id,
    date: formatISODate(e.date),
    category: e.category,
    projectLabel: e.project ? `${e.project.client.name} / ${e.project.name}` : "Công ty",
    amount: e.amount,
  }));

  const projectOptions = projects.map((p) => ({
    id: p.id,
    clientName: p.client.name,
    name: p.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi phí</h1>

      <ExpensesTable data={rows} projects={projectOptions} today={today} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng (hiển thị)</span>
          <span>{formatVnd(total)}</span>
        </div>
      ) : null}
    </div>
  );
}
