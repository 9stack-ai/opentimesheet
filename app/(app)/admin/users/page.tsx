import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/period";
import { UsersTable } from "./users-table";
import type { UserRow } from "./types";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      contactEmail: true,
      role: true,
      status: true,
      mustChangePassword: true,
      defaultCostRate: true,
      defaultBillableRate: true,
      taxWithholdingRateBps: true,
      employerCostRateBps: true,
      fixedMonthlySalary: true,
      compensations: {
        orderBy: { effectiveFrom: "desc" },
        select: {
          id: true,
          kind: true,
          effectiveFrom: true,
          effectiveTo: true,
          costRate: true,
          billableRate: true,
          fixedMonthlySalary: true,
          taxWithholdingRateBps: true,
          employerCostRateBps: true,
        },
      },
    },
  });

  const data: UserRow[] = users.map((u) => ({
    ...u,
    compensations: u.compensations.map((c) => ({
      ...c,
      effectiveFrom: formatISODate(c.effectiveFrom),
      effectiveTo: c.effectiveTo ? formatISODate(c.effectiveTo) : null,
    })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản trị người dùng</h1>
        <p className="text-muted-foreground">Mời, phân quyền và quản lý tài khoản.</p>
      </div>
      <UsersTable data={data} />
    </div>
  );
}
