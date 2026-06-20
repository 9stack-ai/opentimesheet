import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteClient } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { EditClientDialog } from "./edit-client-dialog";
import { AddProjectDialog } from "./add-project-dialog";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: "asc" } },
      _count: { select: { projects: true } },
    },
  });
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/manager/clients" className="text-sm text-muted-foreground hover:text-primary">
            ← Khách hàng
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{client.name}</h1>
          {client.contact ? (
            <p className="text-sm text-muted-foreground">{client.contact}</p>
          ) : null}
        </div>
        <EditClientDialog client={client} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Dự án</CardTitle>
          <AddProjectDialog clientId={client.id} />
        </CardHeader>
        <CardContent>
          {client.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dự án nào.</p>
          ) : (
            <ul className="divide-y">
              {client.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/manager/projects/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <ProjectStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {client._count.projects === 0 ? (
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <form action={deleteClient} className="flex items-center gap-3">
              <input type="hidden" name="id" value={client.id} />
              <Button type="submit" variant="destructive" size="sm">
                Xoá khách hàng
              </Button>
              <span className="text-sm text-muted-foreground">Chỉ xoá được khi chưa có dự án.</span>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
