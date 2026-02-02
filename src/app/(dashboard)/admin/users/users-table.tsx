"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
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

import { deleteUser, updateUserRole } from "@/actions/users";
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

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  currentUserRole: Role;
  readonly?: boolean;
}

export function UsersTable({
  users,
  currentUserId,
  currentUserRole,
  readonly = false,
}: UsersTableProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "moderator" | "admin",
  ) => {
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
      header: "Użytkownik",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Link
            href={`/admin/users/${user.id}`}
            className="flex w-fit items-center gap-3 hover:opacity-80"
          >
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
              <span className="text-muted-foreground text-xs">
                {user.email}
              </span>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Rola",
      cell: ({ row }) => {
        const role = row.getValue("role");
        switch (role) {
          case "admin": {
            return <Badge variant="destructive">Admin</Badge>;
          }
          case "moderator": {
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
      header: "Punkty",
      cell: ({ row }) => {
        const points = Number.parseInt(row.getValue("totalPoints"));
        return <Badge variant="outline">{points}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Dołączył",
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
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrent = user.id === currentUserId;
        const isAdmin = currentUserRole === "admin";

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
                <DropdownMenuItem>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex w-full items-center"
                  >
                    <Eye className="mr-2 size-4" />
                    Szczegóły
                  </Link>
                </DropdownMenuItem>

                {isAdmin ? (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Shield className="mr-2 size-4" />
                        Zmień rolę
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={async () =>
                            handleRoleChange(user.id, "user")
                          }
                          disabled={user.role === "user"}
                        >
                          <UserIcon className="mr-2 size-4" />
                          Użytkownik
                          {user.role === "user" && " (Obecna)"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () =>
                            handleRoleChange(user.id, "moderator")
                          }
                          disabled={user.role === "moderator"}
                        >
                          <GraduationCap className="mr-2 size-4" />
                          Moderator
                          {user.role === "moderator" && " (Obecna)"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () =>
                            handleRoleChange(user.id, "admin")
                          }
                          disabled={user.role === "admin"}
                        >
                          <Shield className="mr-2 size-4" />
                          Admin
                          {user.role === "admin" && " (Obecna)"}
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setUserToDelete(user);
                      }}
                      disabled={isCurrent}
                    >
                      <Trash className="mr-2 size-4" />
                      Usuń użytkownika
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuGroup>
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
            <AlertDialogAction onClick={handleDeleteUser}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
