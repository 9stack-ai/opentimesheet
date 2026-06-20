"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import type { ClientRow } from "./clients-table";

export const clientColumns: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Tên" />,
    cell: ({ row }) => (
      <Link
        href={`/manager/clients/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "projectCount",
    header: ({ column }) => <ColumnHeader column={column} title="Số dự án" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.projectCount} dự án</span>
    ),
  },
];
