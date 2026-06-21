"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { UserStatusBadge } from "@/components/status-badge";
import { roleLabel } from "@/lib/labels";
import { formatVnd } from "@/lib/money";
import { UserRowActions } from "./user-row-actions";
import type { UserRow } from "./types";

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Tên" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <ColumnHeader column={column} title="Tên đăng nhập" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: "contactEmail",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.contactEmail ?? "—"}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => roleLabel(row.original.role),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
  },
  {
    id: "rates",
    header: "Đơn giá (vốn / bán)",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatVnd(row.original.defaultCostRate)} / {formatVnd(row.original.defaultBillableRate)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
