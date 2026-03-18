import { Crown, Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAllUsers } from "@/actions/super-admin";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/super-admin";

import { SuperAdminUsersTable } from "./users-table";

export default async function SuperAdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const email = session.user.email ?? "";
  const role = session.user.role ?? "";

  if (!isSuperAdmin(email, role)) {
    redirect("/dashboard");
  }

  const { users } = await getAllUsers();

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Wszyscy użytkownicy"
        text="Pełna lista użytkowników, w tym Super Adminów — widoczna tylko dla Super Adminów"
        icon={Crown}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Wszyscy użytkownicy
          </CardTitle>
          <CardDescription>
            Łącznie {users.length} użytkowników w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminUsersTable
            users={users}
            currentUserId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
