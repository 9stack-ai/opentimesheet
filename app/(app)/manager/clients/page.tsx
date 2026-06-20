import { prisma } from "@/lib/db";
import { ClientsTable } from "./clients-table";
import type { ClientRow } from "./clients-table";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    projectCount: c._count.projects,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Khách hàng</h1>
      <ClientsTable data={rows} />
    </div>
  );
}
