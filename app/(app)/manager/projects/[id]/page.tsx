import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { requireManager } from "@/lib/rbac";
import { getRedmineClientForUser } from "@/lib/redmine/connection";
import { RedmineError } from "@/lib/redmine/types";
import {
  renameProject,
  setProjectStatus,
  deleteTask,
  removeAssignment,
  setProjectRedmineId,
  deleteProject,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { AddTaskDialog } from "./add-task-dialog";
import { AddAssignmentDialog } from "./add-assignment-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import { EditAssignmentDialog } from "./edit-assignment-dialog";

export const dynamic = "force-dynamic";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const manager = await requireManager();
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
  // Any active user (all roles) can be a project member — so admins can log time on behalf of
  // managers/admins and managers can join projects, not just freelancers/employees.
  const assignableUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  const availableFreelancers = assignableUsers.filter((u) => !assignedUserIds.has(u.id));

  // Redmine link picker: list the connected manager's Redmine projects to choose from, with a
  // manual-ID fallback when Redmine isn't configured/connected or the API call fails.
  const redmineConfigured = !!process.env.REDMINE_URL;
  let redmineProjects: { id: number; name: string }[] | null = null;
  let redmineListError: string | null = null;
  if (redmineConfigured) {
    const client = await getRedmineClientForUser(manager.id);
    if (client) {
      try {
        const projs = await client.listProjects();
        redmineProjects = projs.map((p) => ({ id: p.id, name: p.name }));
      } catch (e) {
        redmineListError =
          e instanceof RedmineError ? e.message : "Không tải được danh sách dự án Redmine.";
      }
    }
  }

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
        <CardHeader>
          <CardTitle className="text-base">Liên kết Redmine</CardTitle>
        </CardHeader>
        <CardContent>
          {redmineProjects ? (
            <form action={setProjectRedmineId} className="flex items-end gap-2">
              <input type="hidden" name="id" value={project.id} />
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground" htmlFor="redmine-project-id">
                  Chọn dự án Redmine để liên kết.
                </label>
                <select
                  id="redmine-project-id"
                  name="redmineProjectId"
                  defaultValue={project.redmineProjectId ?? ""}
                  className={`${selectClass} w-72`}
                >
                  <option value="">— Không liên kết —</option>
                  {/* Keep the current link selectable even if it's no longer returned by the API. */}
                  {project.redmineProjectId != null &&
                  !redmineProjects.some((p) => p.id === project.redmineProjectId) ? (
                    <option value={project.redmineProjectId}>
                      #{project.redmineProjectId} (hiện tại)
                    </option>
                  ) : null}
                  {redmineProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="outline">
                Lưu
              </Button>
            </form>
          ) : (
            <form action={setProjectRedmineId} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={project.id} />
              <div className="flex items-end gap-2">
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground" htmlFor="redmine-project-id">
                    Redmine project ID (số). Để trống để gỡ liên kết.
                  </label>
                  <Input
                    id="redmine-project-id"
                    name="redmineProjectId"
                    type="number"
                    min={1}
                    defaultValue={project.redmineProjectId ?? ""}
                    className="w-48"
                    placeholder="vd: 42"
                  />
                </div>
                <Button type="submit" variant="outline">
                  Lưu
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {!redmineConfigured
                  ? "Admin chưa cấu hình REDMINE_URL — nhập ID thủ công."
                  : redmineListError
                    ? `Không tải được danh sách Redmine: ${redmineListError} — nhập ID thủ công.`
                    : "Kết nối Redmine ở trang Cài đặt để chọn từ danh sách thay vì nhập ID."}
              </p>
            </form>
          )}
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
                  <div className="flex items-center gap-1">
                    <EditTaskDialog taskId={t.id} projectId={project.id} name={t.name} />
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
                  </div>
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
                  <div className="flex items-center gap-1">
                    <EditAssignmentDialog
                      projectId={project.id}
                      userId={a.userId}
                      userName={a.user.name}
                      costRateOverride={a.costRateOverride}
                      billableRateOverride={a.billableRateOverride}
                    />
                    <form action={removeAssignment}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        Xoá
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          {project.tasks.reduce((s, t) => s + t._count.timeEntries, 0) === 0 ? (
            <form action={deleteProject} className="flex items-center gap-3">
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="clientId" value={project.clientId} />
              <Button type="submit" variant="destructive" size="sm">
                Xoá dự án
              </Button>
              <span className="text-sm text-muted-foreground">
                Xoá cả hạng mục &amp; phân công; chi phí gắn dự án chuyển về cấp công ty.
              </span>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không thể xoá — dự án đã có công chấm. Lưu trữ nếu muốn ẩn.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
