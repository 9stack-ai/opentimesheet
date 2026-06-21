"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronRight, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProjectStatusBadge } from "@/components/status-badge";
import { AddClientDialog } from "./add-client-dialog";

export type ProjectNode = { id: string; name: string; status: string };
export type ClientNode = { id: string; name: string; projects: ProjectNode[] };

/** Khách hàng → Dự án dạng cây, có thể mở/thu từng khách hàng + lọc nhanh theo tên. */
export function ClientsTree({ data }: { data: ClientNode[] }) {
  const [q, setQ] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const query = q.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!query) return data;
    return data
      .map((c) => {
        const nameMatch = c.name.toLowerCase().includes(query);
        const projects = nameMatch ? c.projects : c.projects.filter((p) => p.name.toLowerCase().includes(query));
        return nameMatch || projects.length > 0 ? { ...c, projects } : null;
      })
      .filter((c): c is ClientNode => c !== null);
  }, [data, query]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tìm khách hàng / dự án…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <div className="ml-auto">
          <AddClientDialog />
        </div>
      </div>

      <div className="divide-y rounded-md border">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Không có khách hàng nào.</p>
        ) : (
          filtered.map((c) => {
            const hasProjects = c.projects.length > 0;
            // Mặc định mở; khi đang tìm thì luôn mở để thấy kết quả khớp.
            const open = query ? true : !collapsed.has(c.id);
            return (
              <div key={c.id}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    disabled={!hasProjects}
                    aria-label={open ? "Thu gọn" : "Mở rộng"}
                    className="text-muted-foreground disabled:opacity-30"
                  >
                    {!hasProjects ? (
                      <span className="inline-block size-4" />
                    ) : open ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  <Building2 className="size-4 text-muted-foreground" />
                  <Link
                    href={`/manager/clients/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">({c.projects.length} dự án)</span>
                </div>

                {open && hasProjects ? (
                  <ul className="border-t bg-muted/20">
                    {c.projects.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 py-1.5 pr-3 pl-12">
                        <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
                        <Link href={`/manager/projects/${p.id}`} className="truncate hover:underline">
                          {p.name}
                        </Link>
                        <span className="ml-auto shrink-0">
                          <ProjectStatusBadge status={p.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
