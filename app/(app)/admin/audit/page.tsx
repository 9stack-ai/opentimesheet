import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { AuditTable } from "./audit-table";
import type { AuditRow } from "./audit-table";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole(["ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows: AuditRow[] = logs.map((l) => ({
    id: l.id,
    time: l.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }),
    actor: l.actorName,
    role: l.actorRole,
    action: l.action,
    summary: l.summary,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nhật ký hoạt động</h1>
        <p className="text-muted-foreground">
          Ai làm gì, khi nào — 500 hoạt động gần nhất (chấm công, duyệt, quản trị người dùng).
        </p>
      </div>
      <AuditTable data={rows} />
    </div>
  );
}
