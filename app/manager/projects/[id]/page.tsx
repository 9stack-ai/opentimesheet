import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import {
  renameProject,
  setProjectStatus,
  createTask,
  deleteTask,
  addAssignment,
  removeAssignment,
} from "../actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-3 py-2 text-sm";

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
    where: { role: "FREELANCER", status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  const availableFreelancers = freelancers.filter((f) => !assignedUserIds.has(f.id));

  return (
    <section className="flex flex-col gap-6">
      <Link href={`/manager/clients/${project.clientId}`} className="text-sm text-blue-700 underline">
        ← {project.client.name}
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {project.name} <span className="text-sm text-gray-500">({project.status})</span>
        </h1>
        <form action={setProjectStatus}>
          <input type="hidden" name="id" value={project.id} />
          <input
            type="hidden"
            name="status"
            value={project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"}
          />
          <button type="submit" className="rounded border border-gray-300 px-3 py-1 text-sm">
            {project.status === "ARCHIVED" ? "Unarchive" : "Archive"}
          </button>
        </form>
      </div>

      <form action={renameProject} className="flex gap-2">
        <input type="hidden" name="id" value={project.id} />
        <input name="name" defaultValue={project.name} className={inputClass} />
        <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">
          Rename
        </button>
      </form>

      <div>
        <h2 className="mb-2 font-medium">Tasks</h2>
        <form action={createTask} className="mb-3 flex gap-2">
          <input type="hidden" name="projectId" value={project.id} />
          <input name="name" placeholder="New task" required className={inputClass} />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
            Add task
          </button>
        </form>
        <ul className="divide-y divide-gray-100">
          {project.tasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <span>{t.name}</span>
              {t._count.timeEntries === 0 ? (
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <button type="submit" className="text-red-700">
                    Delete
                  </button>
                </form>
              ) : (
                <span className="text-gray-400">{t._count.timeEntries} entries</span>
              )}
            </li>
          ))}
          {project.tasks.length === 0 ? <li className="py-2 text-gray-500">No tasks yet.</li> : null}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-medium">Team &amp; rates</h2>
        <ul className="divide-y divide-gray-100">
          {project.assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="flex-1">{a.user.name}</span>
              <span className="text-gray-500">
                cost {formatVnd(a.costRateOverride ?? a.user.defaultCostRate)} / billable{" "}
                {formatVnd(a.billableRateOverride ?? a.user.defaultBillableRate)}
              </span>
              <form action={removeAssignment}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit" className="text-red-700">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {project.assignments.length === 0 ? (
            <li className="py-2 text-gray-500">No team members yet.</li>
          ) : null}
        </ul>

        {availableFreelancers.length > 0 ? (
          <form action={addAssignment} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <select name="userId" required className={inputClass}>
              {availableFreelancers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              name="costRateOverride"
              type="number"
              min={0}
              placeholder="Cost override (opt)"
              className={inputClass}
            />
            <input
              name="billableRateOverride"
              type="number"
              min={0}
              placeholder="Billable override (opt)"
              className={inputClass}
            />
            <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
              Assign
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
