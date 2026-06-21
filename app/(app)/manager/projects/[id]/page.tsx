import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { renameProject, setProjectStatus, deleteTask, removeAssignment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { AddTaskDialog } from "./add-task-dialog";
import { AddAssignmentDialog } from "./add-assignment-dialog";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: { orderBy: { name: "asc" }, include: { _count: { select: { timeEntries: true } } } },
      assignments: { include: { user: true } },
    },
  });
  if (!project) notFound();

  const assignedUserIds = new Set(project.assignments.map((a) => a.userId));
  const freelancers = await prisma.user.findMany({
    where: { role: { in: ["FREELANCER", "EMPLOYEE"] }, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  const availableFreelancers = freelancers.filter((f) => !assignedUserIds.has(f.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/manager/clients/${project.clientId}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← {project.client.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
          <form action={setProjectStatus} className="ml-auto">
            <input type="hidden" name="id" value={project.id} />
            <input
              type="hidden"
              name="status"
              value={project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"}
            />
            <Button type="submit" variant="outline" size="sm">
              {project.status === "ARCHIVED" ? "Bỏ lưu trữ" : "Lưu trữ"}
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Đổi tên dự án</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={renameProject} className="flex items-end gap-2">
            <input type="hidden" name="id" value={project.id} />
            <Input name="name" defaultValue={project.name} className="w-64" />
            <Button type="submit" variant="outline">
              Lưu
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Hạng mục</CardTitle>
          <AddTaskDialog projectId={project.id} />
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có hạng mục nào.</p>
          ) : (
            <ul className="divide-y">
              {project.tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{t.name}</span>
                  {t._count.timeEntries === 0 ? (
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        Xoá
                      </Button>
                    </form>
                  ) : (
                    <span className="text-muted-foreground">{t._count.timeEntries} mục công</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Nhóm &amp; đơn giá</CardTitle>
          <AddAssignmentDialog
            projectId={project.id}
            availableFreelancers={availableFreelancers.map((f) => ({ id: f.id, name: f.name }))}
          />
        </CardHeader>
        <CardContent>
          {project.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thành viên nào.</p>
          ) : (
            <ul className="divide-y">
              {project.assignments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                  <span className="flex-1 font-medium">{a.user.name}</span>
                  <span className="text-muted-foreground">
                    Vốn: {formatVnd(a.costRateOverride ?? a.user.defaultCostRate)} · Bán:{" "}
                    {formatVnd(a.billableRateOverride ?? a.user.defaultBillableRate)}
                  </span>
                  <form action={removeAssignment}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                      Xoá
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
