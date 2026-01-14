"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  GraduationCap,
  MoreHorizontal,
  Shield,
  Trash,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteUser, updateUserRole } from "@/actions/users";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

import type { Role } from "../../../../generated/prisma/enums";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  totalPoints: number;
  createdAt: Date;
}

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  readonly?: boolean;
}

export function UsersTable({
  users,
  currentUserId,
  readonly = false,
}: UsersTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setIsLoading(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.error === undefined) {
        toast.success("Rola użytkownika została zaktualizowana");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete === null) {
      return;
    }

    setIsLoading(userToDelete.id);
    try {
      const result = await deleteUser(userToDelete.id);
      if (result.error === undefined) {
        toast.success("Użytkownik został usunięty");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsLoading(null);
      setUserToDelete(null);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Użytkownik" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name ?? "Brak nazwy"}</span>
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rola" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role");
        switch (role) {
          case "ADMIN": {
            return <Badge variant="destructive">Admin</Badge>;
          }
          case "MODERATOR": {
            return (
              <Badge className="bg-blue-500 hover:bg-blue-600">Moderator</Badge>
            );
          }
          default: {
            return <Badge variant="secondary">Użytkownik</Badge>;
          }
        }
      },
    },
    {
      accessorKey: "totalPoints",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Punkty" />
      ),
      cell: ({ row }) => {
        const points = Number.parseInt(row.getValue("totalPoints"));
        return <Badge variant="outline">{points}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dołączył" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-sm">
            {format(row.getValue("createdAt"), "d MMM yyyy", { locale: pl })}
          </div>
        );
      },
    },
  ];

  if (!readonly) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isCurrent = user.id === currentUserId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-8 p-0"
                  disabled={isLoading === user.id}
                >
                  {isLoading === user.id ? (
                    <Spinner className="size-4" />
                  ) : (
                    <MoreHorizontal className="size-4" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akcje</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Shield className="mr-2 size-4" />
                  Zmień rolę
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={async () => handleRoleChange(user.id, "USER")}
                    disabled={user.role === "USER"}
                  >
                    <UserIcon className="mr-2 size-4" />
                    Użytkownik
                    {user.role === "USER" && " (Obecna)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => handleRoleChange(user.id, "MODERATOR")}
                    disabled={user.role === "MODERATOR"}
                  >
                    <GraduationCap className="mr-2 size-4" />
                    Moderator
                    {user.role === "MODERATOR" && " (Obecna)"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => handleRoleChange(user.id, "ADMIN")}
                    disabled={user.role === "ADMIN"}
                  >
                    <Shield className="mr-2 size-4" />
                    Admin
                    {user.role === "ADMIN" && " (Obecna)"}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setUserToDelete(user);
                }}
                disabled={isCurrent}
              >
                <Trash className="mr-2 size-4" />
                Usuń użytkownika
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Szukaj użytkownika..."
      />

      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Czy na pewno chcesz usunąć tego użytkownika?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Użytkownik{" "}
              <span className="text-foreground font-medium">
                {userToDelete?.name ?? userToDelete?.email}
              </span>{" "}
              zostanie trwale usunięty z bazy danych wraz z historią punktów.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
