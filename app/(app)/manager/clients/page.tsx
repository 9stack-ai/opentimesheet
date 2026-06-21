import { prisma } from "@/lib/db";
import { ClientsTree } from "./clients-tree";
import type { ClientNode } from "./clients-tree";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      projects: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, status: true },
      },
    },
  });

  const data: ClientNode[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    projects: c.projects.map((p) => ({ id: p.id, name: p.name, status: p.status })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Khách hàng</h1>
      <ClientsTree data={data} />
    </div>
  );
}
