"use client";

import { DataTable } from "@/components/data-table/data-table";
import { userColumns } from "./users-columns";
import { InviteDialog } from "./invite-dialog";
import { CreateUserDialog } from "./create-user-dialog";
import type { UserRow } from "./types";

export function UsersTable({ data }: { data: UserRow[] }) {
  return (
    <DataTable
      columns={userColumns}
      data={data}
      searchKey="name"
      searchPlaceholder="Tìm theo tên…"
      toolbar={
        <div className="flex items-center gap-2">
          <CreateUserDialog />
          <InviteDialog />
        </div>
      }
    />
  );
}
