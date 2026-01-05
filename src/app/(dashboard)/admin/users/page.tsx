import { Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUsers } from "@/actions/users";
import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth";

import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { users } = await getUsers();

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Użytkownicy"
        text="Zarządzaj użytkownikami systemu i ich uprawnieniami"
        icon={Users}
      />
      <UsersTable users={users} currentUserId={session.user.id} />
    </div>
  );
}
