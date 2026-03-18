import { Users } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { UsersTable } from "@/app/(dashboard)/admin/users/users-table";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ModeratorUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const role = session.user.role ?? "user";
  if (role !== "moderator" && role !== "admin" && role !== "super_admin") {
    redirect("/dashboard");
  }

  const usersData = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const pointsAggregates = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    _sum: { points: true },
  });
  const userPointsMap = new Map<string, number>();
  for (const agg of pointsAggregates) {
    userPointsMap.set(agg.userId, agg._sum.points ?? 0);
  }

  const users = usersData.map((user) => ({
    ...user,
    role: user.role as import("@/types").Role,
    totalPoints: userPointsMap.get(user.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Lista użytkowników"
        text="Przeglądaj użytkowników systemu"
        icon={Users}
      />

      <Card>
        <CardHeader>
          <CardTitle>Wszyscy użytkownicy</CardTitle>
          <CardDescription>
            Łącznie {users.length} użytkowników w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            currentUserId={session.user.id}
            currentUserRole={role as import("@/types").Role}
            readonly
          />
        </CardContent>
      </Card>
    </div>
  );
}
