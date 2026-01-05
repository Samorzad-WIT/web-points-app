"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Badge } from "@/components/ui/badge";

interface PointAssignment {
  id: string;
  points: number;
  notes: string | null;
  createdAt: Date;
  activity: {
    name: string;
  };
  assignedBy: {
    name: string | null;
    email: string;
  };
}

export const columns: ColumnDef<PointAssignment>[] = [
  {
    accessorKey: "activity.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aktywność" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.activity.name}</span>
    ),
  },
  {
    accessorKey: "points",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Punkty" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">+{row.original.points}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {format(row.original.createdAt, "d MMM yyyy, HH:mm", { locale: pl })}
      </span>
    ),
  },
  {
    accessorKey: "assignedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Przyznał" />
    ),
    cell: ({ row }) => {
      const assigner = row.original.assignedBy;
      return (
        <span className="text-muted-foreground text-sm">
          {assigner.name ?? assigner.email}
        </span>
      );
    },
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notatki" />
    ),
    cell: ({ row }) => {
      const notes = row.original.notes;
      if (notes === null) {
        return null;
      }
      return (
        <span
          className="text-muted-foreground line-clamp-1 text-sm"
          title={notes}
        >
          {notes}
        </span>
      );
    },
  },
];

interface HistoryTableProps {
  data: PointAssignment[];
}

export function HistoryTable({ data }: HistoryTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="activity.name"
      searchPlaceholder="Szukaj aktywności..."
    />
  );
}
