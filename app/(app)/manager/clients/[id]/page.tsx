import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteClient } from "../actions";
import { deleteProject } from "../../projects/actions";
import { SubmitButton } from "@/components/ui/submit-button";
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
      projects: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { tasks: true } } },
      },
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
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/manager/projects/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <ProjectStatusBadge status={p.status} />
                    {p._count.tasks === 0 ? (
                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="clientId" value={client.id} />
                        <SubmitButton variant="ghost" size="sm" className="text-destructive">
                          Xoá
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
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
              <SubmitButton variant="destructive" size="sm">
                Xoá khách hàng
              </SubmitButton>
              <span className="text-sm text-muted-foreground">Chỉ xoá được khi chưa có dự án.</span>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
