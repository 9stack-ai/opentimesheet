import { prisma } from "@/lib/db";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      defaultCostRate: true,
      defaultBillableRate: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Quản trị người dùng</h1>
        <p className="text-muted-foreground">Mời, phân quyền và quản lý tài khoản.</p>
      </div>
      <UsersTable data={users} />
    </div>
  );
}
