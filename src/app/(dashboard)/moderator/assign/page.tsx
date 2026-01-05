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

  const role = session.user.role ?? "USER";
  if (role !== "MODERATOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch users (excluding the current moderator)
  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
    },
  });

  // Fetch active activities
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
