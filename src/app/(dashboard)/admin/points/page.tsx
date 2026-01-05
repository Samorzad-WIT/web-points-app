import { Award } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPointAssignments } from "@/actions/points";
import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth";

import { PointsTable } from "./points-table";

export default async function AdminPointsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { assignments } = await getPointAssignments();

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Punkty"
        text="Przeglądaj i zarządzaj wszystkimi przyznanymi punktami"
        icon={Award}
      />
      <PointsTable assignments={assignments} />
    </div>
  );
}
