import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateClient, deleteClient } from "../actions";
import { createProject } from "../../projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";

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
      <div>
        <Link href="/manager/clients" className="text-sm text-muted-foreground hover:text-primary">
          ← Khách hàng
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{client.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateClient} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={client.id} />
            <Input name="name" defaultValue={client.name} placeholder="Tên" className="w-48" />
            <Input
              name="contact"
              defaultValue={client.contact ?? ""}
              placeholder="Liên hệ"
              className="w-40"
            />
            <Input
              name="notes"
              defaultValue={client.notes ?? ""}
              placeholder="Ghi chú"
              className="w-48"
            />
            <Button type="submit" variant="outline">
              Lưu
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dự án</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={createProject} className="flex items-end gap-2">
            <input type="hidden" name="clientId" value={client.id} />
            <Input name="name" placeholder="Tên dự án mới" required className="w-56" />
            <Button type="submit">Thêm dự án</Button>
          </form>

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
