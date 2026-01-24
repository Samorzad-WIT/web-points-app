"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MoreHorizontal, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deletePointAssignment } from "@/actions/points";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

interface Assignment {
  id: string;
  points: number;
  notes: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  activity: {
    id: string;
    name: string;
  };
  assignedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface PointsTableProps {
  assignments: Assignment[];
}

export function PointsTable({ assignments }: PointsTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<Assignment | null>(null);

  const handleDelete = async () => {
    if (assignmentToDelete === null) {
      return;
    }

    setIsLoading(assignmentToDelete.id);
    try {
      const result = await deletePointAssignment(assignmentToDelete.id);
      if (result.error === undefined) {
        toast.success("Przydzielenie punktów zostało usunięte");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsLoading(null);
      setAssignmentToDelete(null);
    }
  };

  const columns: ColumnDef<Assignment>[] = [
    {
      accessorFn: (row) => row.user.name ?? row.user.email, // Search by name or email
      id: "userName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Użytkownik" />
      ),
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {assignment.user.name ?? "Brak nazwy"}
            </span>
            <span className="text-muted-foreground text-xs">
              {assignment.user.email}
            </span>
          </div>
        );
      },
    },
    {
      id: "activity",
      accessorFn: (row) => row.activity.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Aktywność" />
      ),
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{assignment.activity.name}</span>
            {assignment.notes === null ? null : (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {assignment.notes}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "assignedBy",
      accessorFn: (row) => row.assignedBy.name ?? row.assignedBy.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Przyznał" />
      ),
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {assignment.assignedBy.name ?? assignment.assignedBy.email}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "points",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Punkty" />
      ),
      cell: ({ row }) => {
        return <Badge variant="secondary">+{row.getValue("points")}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-sm">
            {format(row.getValue("createdAt"), "d MMM yyyy", { locale: pl })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-8 p-0"
                  disabled={isLoading === assignment.id}
                >
                  {isLoading === assignment.id ? (
                    <Spinner className="size-4" />
                  ) : (
                    <MoreHorizontal className="size-4" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setAssignmentToDelete(assignment);
                }}
              >
                <Trash className="mr-2 size-4" />
                Usuń przydzielenie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={assignments}
        searchKey="userName"
        searchPlaceholder="Szukaj użytkownika..."
      />

      <AlertDialog
        open={Boolean(assignmentToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Czy na pewno chcesz usunąć te punkty?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja cofnie przyznanie punktów. Punkty (
              {assignmentToDelete?.points}) zostaną odjęte z konta użytkownika{" "}
              <span className="text-foreground font-medium">
                {assignmentToDelete?.user.name ??
                  assignmentToDelete?.user.email}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
