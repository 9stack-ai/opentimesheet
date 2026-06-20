import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { createExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-2 py-1 text-sm";

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

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Expenses</h1>

      <form action={createExpense} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4">
        <input name="category" placeholder="Category" required className={inputClass} />
        <input name="amount" type="number" min={0} placeholder="Amount (VND)" required className={inputClass} />
        <input name="date" type="date" defaultValue={today} required className={inputClass} />
        <select name="projectId" defaultValue="" className={inputClass}>
          <option value="">Company-level</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client.name} / {p.name}
            </option>
          ))}
        </select>
        <input name="note" placeholder="Note (optional)" className={inputClass} />
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          Add expense
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Project</th>
            <th className="py-2 pr-3">Amount</th>
            <th className="py-2 pr-3" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id} className="border-b border-gray-100">
              <td className="py-2 pr-3">{formatISODate(e.date)}</td>
              <td className="py-2 pr-3">{e.category}</td>
              <td className="py-2 pr-3">
                {e.project ? `${e.project.client.name} / ${e.project.name}` : "Company"}
              </td>
              <td className="py-2 pr-3">{formatVnd(e.amount)}</td>
              <td className="py-2 pr-3">
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-red-700">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {expenses.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-2 text-gray-500">
                No expenses.
              </td>
            </tr>
          ) : null}
        </tbody>
        {expenses.length > 0 ? (
          <tfoot>
            <tr className="border-t border-gray-300 font-medium">
              <td className="py-2 pr-3" colSpan={3}>
                Total (shown)
              </td>
              <td className="py-2 pr-3">{formatVnd(total)}</td>
              <td />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </section>
  );
}
