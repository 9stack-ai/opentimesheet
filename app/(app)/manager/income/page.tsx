import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { IncomeTable } from "./income-table";
import type { IncomeRow } from "./income-table";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  await requireManager();

  const [incomes, projects] = await Promise.all([
    prisma.income.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { project: { include: { client: true } } },
    }),
    prisma.project.findMany({ orderBy: { name: "asc" }, include: { client: true } }),
  ]);

  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const rows: IncomeRow[] = incomes.map((i) => ({
    id: i.id,
    date: i.date ? formatISODate(i.date) : null,
    source: i.source,
    amount: i.amount,
    note: i.note,
    projectId: i.projectId,
    projectLabel: i.project ? `${i.project.client.name} / ${i.project.name}` : null,
  }));
  const projectOptions = projects.map((p) => ({ id: p.id, clientName: p.client.name, name: p.name }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nguồn thu</h1>
      <p className="text-sm text-muted-foreground">
        Các khoản tiền vào (góp vốn, tạm ứng, doanh thu…). Có thể gắn vào dự án. Khoản chưa đặt ngày
        vẫn nằm trong tổng bên dưới nhưng chỉ vào &quot;Tổng thu&quot; của một kỳ sau khi bạn nhập ngày.
      </p>

      <IncomeTable data={rows} projects={projectOptions} />

      {rows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng nguồn thu (tất cả)</span>
          <span>{formatVnd(total)}</span>
        </div>
      ) : null}
    </div>
  );
}
