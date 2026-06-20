"use client";

import { DataTable } from "@/components/data-table/data-table";
import { clientColumns } from "./clients-columns";
import { AddClientDialog } from "./add-client-dialog";

export type ClientRow = {
  id: string;
  name: string;
  projectCount: number;
};

export function ClientsTable({ data }: { data: ClientRow[] }) {
  return (
    <DataTable
      columns={clientColumns}
      data={data}
      searchKey="name"
      searchPlaceholder="Tìm theo tên…"
      toolbar={<AddClientDialog />}
    />
  );
}
