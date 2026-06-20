import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { createFixedCost, deleteFixedCost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function FixedCostsPage() {
  await requireManager();
  const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { effectiveFrom: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi phí cố định</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thêm chi phí cố định</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFixedCost} className="flex flex-wrap items-end gap-3">
            <Input name="name" placeholder="Tên" required className="w-40" />
            <Input name="category" placeholder="Danh mục" required className="w-36" />
            <Input
              name="monthlyAmount"
              type="number"
              min={0}
              placeholder="Hàng tháng (VND)"
              required
              className="w-40"
            />
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Từ ngày</Label>
              <Input name="effectiveFrom" type="date" required className="w-auto" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Đến ngày (tuỳ chọn)</Label>
              <Input name="effectiveTo" type="date" className="w-auto" />
            </div>
            <Button type="submit">Thêm</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Hàng tháng</TableHead>
                <TableHead>Từ ngày</TableHead>
                <TableHead>Đến ngày</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Chưa có chi phí cố định nào.
                  </TableCell>
                </TableRow>
              ) : (
                fixedCosts.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.name}</TableCell>
                    <TableCell>{f.category}</TableCell>
                    <TableCell>{formatVnd(f.monthlyAmount)}</TableCell>
                    <TableCell>{formatISODate(f.effectiveFrom)}</TableCell>
                    <TableCell>{f.effectiveTo ? formatISODate(f.effectiveTo) : "—"}</TableCell>
                    <TableCell>
                      <form action={deleteFixedCost}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                          Xoá
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
