"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Crown,
  Eye,
  GraduationCap,
  MoreHorizontal,
  Shield,
  Trash,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { superAdminDeleteUser, superAdminUpdateUserRole } from "@/actions/super-admin";
import { DataTable } from "@/components/data-table";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import type { Role, User } from "@/types";

interface SuperAdminUsersTableProps {
  users: User[];
  currentUserId: string;
}

export function SuperAdminUsersTable({
  users,
  currentUserId,
}: SuperAdminUsersTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setIsLoading(userId);
    try {
      const result = await superAdminUpdateUserRole(userId, newRole);
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
    if (userToDelete === null) return;

    setIsLoading(userToDelete.id);
    try {
      const result = await superAdminDeleteUser(userToDelete.id);
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

  const roleBadge = (role: Role) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            <Crown className="mr-1 size-3" />
            Super Admin
          </Badge>
        );
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "moderator":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Moderator</Badge>
        );
      default:
        return <Badge variant="secondary">Użytkownik</Badge>;
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Użytkownik",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex w-fit items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback>
                {(() => {
                  if (user.name != null) {
                    const parts = user.name.split(" ");
                    if (parts.length >= 2) {
                      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
                    }
                    return user.name.slice(0, 2).toUpperCase();
                  }
                  return user.email.slice(0, 2).toUpperCase();
                })()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name ?? "Brak nazwy"}</span>
              <span className="text-muted-foreground text-xs">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Rola",
      cell: ({ row }) => roleBadge(row.getValue("role") as Role),
    },
    {
      accessorKey: "totalPoints",
      header: "Punkty",
      cell: ({ row }) => (
        <Badge variant="outline">
          {Number.parseInt(row.getValue("totalPoints"))}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dołączył",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {format(row.getValue("createdAt"), "d MMM yyyy", { locale: pl })}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
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
            <DropdownMenuContent align="end" className="w-full">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role !== "super_admin" ? (
                  <DropdownMenuItem>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex w-full items-center"
                    >
                      <Eye className="mr-2 size-4" />
                      Szczegóły
                    </Link>
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isCurrent}>
                    <Shield className="mr-2 size-4" />
                    Zmień rolę
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={async () => handleRoleChange(user.id, "super_admin")}
                      disabled={user.role === "super_admin"}
                    >
                      <Crown className="mr-2 size-4" />
                      Super Admin
                      {user.role === "super_admin" ? " (Obecna)" : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => handleRoleChange(user.id, "admin")}
                      disabled={user.role === "admin"}
                    >
                      <Shield className="mr-2 size-4" />
                      Admin
                      {user.role === "admin" ? " (Obecna)" : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => handleRoleChange(user.id, "moderator")}
                      disabled={user.role === "moderator"}
                    >
                      <GraduationCap className="mr-2 size-4" />
                      Moderator
                      {user.role === "moderator" ? " (Obecna)" : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => handleRoleChange(user.id, "user")}
                      disabled={user.role === "user"}
                    >
                      <UserIcon className="mr-2 size-4" />
                      Użytkownik
                      {user.role === "user" ? " (Obecna)" : null}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => { setUserToDelete(user); }}
                  disabled={isCurrent}
                >
                  <Trash className="mr-2 size-4" />
                  Usuń użytkownika
                </DropdownMenuItem>
              </DropdownMenuGroup>
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
        data={users}
        searchKey="name"
        searchPlaceholder="Szukaj użytkownika..."
      />

      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => { if (!open) setUserToDelete(null); }}
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
            <AlertDialogAction onClick={handleDeleteUser}>Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
