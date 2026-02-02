import { ClipboardList } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ActivitiesTable } from "@/app/(dashboard)/admin/activities/activities-table";
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

export default async function ModeratorActivitiesPage() {
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

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Lista aktywności"
        text="Podgląd dostępnych aktywności punktowanych"
        icon={ClipboardList}
      />

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie aktywności</CardTitle>
          <CardDescription>
            Łącznie {activities.length} aktywności w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak aktywności w systemie.
            </p>
          ) : (
            <ActivitiesTable activities={activities} readonly />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
