import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { createExpense, deleteExpense } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi phí</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thêm chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExpense} className="flex flex-wrap items-end gap-2">
            <Input name="category" placeholder="Danh mục" required className="w-36" />
            <Input
              name="amount"
              type="number"
              min={0}
              placeholder="Số tiền (VND)"
              required
              className="w-36"
            />
            <Input name="date" type="date" defaultValue={today} required className="w-auto" />
            <select name="projectId" defaultValue="" className={selectClass}>
              <option value="">Cấp công ty</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.client.name} / {p.name}
                </option>
              ))}
            </select>
            <Input name="note" placeholder="Ghi chú (tuỳ chọn)" className="w-40" />
            <Button type="submit">Thêm</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Dự án</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Chưa có chi phí nào.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatISODate(e.date)}</TableCell>
                    <TableCell>{e.category}</TableCell>
                    <TableCell>
                      {e.project ? `${e.project.client.name} / ${e.project.name}` : "Công ty"}
                    </TableCell>
                    <TableCell>{formatVnd(e.amount)}</TableCell>
                    <TableCell>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                          Xoá
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {expenses.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">
                    Tổng (hiển thị)
                  </TableCell>
                  <TableCell className="font-medium">{formatVnd(total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
