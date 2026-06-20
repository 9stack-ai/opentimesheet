import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
import { formatVnd } from "@/lib/money";
import {
  monthPeriod,
  weekPeriod,
  monthPeriodFromString,
  weekPeriodFromString,
  type Period,
} from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { Button } from "@/components/ui/button";
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

export default async function PayoutReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;

  let period: Period;
  if (sp.week) period = weekPeriodFromString(sp.week) ?? weekPeriod(now);
  else if (sp.month) period = monthPeriodFromString(sp.month) ?? monthPeriod(cy, cm);
  else period = monthPeriod(cy, cm);

  const rows = payoutByUser(await approvedEntriesForPeriod(period));
  const grandTotal = rows.reduce((s, r) => s + r.payout, 0);
  const exportQuery = period.kind === "week" ? `week=${period.label}` : `month=${period.label}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi trả CTV</h1>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Kỳ: {period.label}</span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/payout?month=${monthPeriod(cy, cm).label}`}>Tháng này</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/manager/reports/payout?week=${weekPeriod(now).label}`}>Tuần này</Link>
        </Button>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href={`/manager/reports/payout/export?${exportQuery}`}>Xuất CSV</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết chi trả</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cộng tác viên</TableHead>
                <TableHead>Số giờ</TableHead>
                <TableHead>Chi trả (VND)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Không có giờ công đã duyệt trong kỳ này.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{r.totalHours}</TableCell>
                    <TableCell>{formatVnd(r.payout)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium">Tổng cộng</TableCell>
                  <TableCell />
                  <TableCell className="font-medium">{formatVnd(grandTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
