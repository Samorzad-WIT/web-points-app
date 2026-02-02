import { Award } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AssignPointsForm } from "./assign-form";

export default async function AssignPointsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const role = session.user.role ?? "user";
  if (role !== "moderator" && role !== "admin") {
    redirect("/dashboard");
  }

  const usersData = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
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
    totalPoints: userPointsMap.get(user.id) ?? 0,
  }));

  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      fixedPoints: true,
      minPoints: true,
      maxPoints: true,
    },
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Przydziel punkty"
        text="Przyznaj punkty aktywności członkom samorządu"
        icon={Award}
      />

      <AssignPointsForm users={users} activities={activities} />
    </div>
  );
}
