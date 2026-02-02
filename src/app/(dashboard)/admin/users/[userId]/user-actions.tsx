"use client";

import {
  GraduationCap,
  Key,
  MoreVertical,
  Shield,
  Trash,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  changeUserPassword,
  deleteUser,
  updateUserRole,
} from "@/actions/users";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/types";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

interface UserActionsProps {
  user: User;
  currentUserId: string;
  currentUserRole: Role;
}

export function UserActions({
  user,
  currentUserId,
  currentUserRole,
}: UserActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleRoleChange = async (newRole: "user" | "moderator" | "admin") => {
    setIsLoading(true);
    try {
      const result = await updateUserRole(user.id, newRole);
      if (result.error === undefined) {
        toast.success("Rola użytkownika została zaktualizowana");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      const result = await deleteUser(user.id);
      if (result.error === undefined) {
        toast.success("Użytkownik został usunięty");
        router.push("/admin/users");
      } else {
        toast.error(result.error);
        setIsLoading(false);
      }
    } catch {
      toast.error("Wystąpił błąd");
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setIsLoading(true);
    try {
      const result = await changeUserPassword(user.id, newPassword);
      if (result.error === undefined) {
        toast.success("Hasło zostało zmienione");
        setShowPasswordDialog(false);
        setNewPassword("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrent = user.id === currentUserId;
  const isAdmin = currentUserRole === "admin";

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <MoreVertical className="mr-2 size-4" />
              )}
              Akcje
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Zarządzaj użytkownikiem</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Shield className="mr-2 size-4" />
                Zmień rolę
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={async () => handleRoleChange("user")}
                  disabled={user.role === "user"}
                >
                  <UserIcon className="mr-2 size-4" />
                  Użytkownik
                  {user.role === "user" && " (Obecna)"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => handleRoleChange("moderator")}
                  disabled={user.role === "moderator"}
                >
                  <GraduationCap className="mr-2 size-4" />
                  Moderator
                  {user.role === "moderator" && " (Obecna)"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => handleRoleChange("admin")}
                  disabled={user.role === "admin"}
                >
                  <Shield className="mr-2 size-4" />
                  Admin
                  {user.role === "admin" && " (Obecna)"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              onClick={() => {
                setShowPasswordDialog(true);
              }}
            >
              <Key className="mr-2 size-4" />
              Zmień hasło
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setShowDeleteDialog(true);
              }}
              disabled={isCurrent}
            >
              <Trash className="mr-2 size-4" />
              Usuń użytkownika
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Czy na pewno chcesz usunąć tego użytkownika?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Użytkownik{" "}
              <span className="text-foreground font-medium">
                {user.name ?? user.email}
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

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień hasło użytkownika</DialogTitle>
            <DialogDescription>
              Wprowadź nowe hasło dla użytkownika {user.name ?? user.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nowe hasło</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                }}
                placeholder="Minimum 6 znaków"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2 size-4" /> : null}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
