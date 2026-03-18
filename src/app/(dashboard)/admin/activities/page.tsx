import { ClipboardList } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

import { ActivitiesTable, CreateActivityDialog } from "./activities-table";

export default async function AdminActivitiesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user == null) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
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
        heading="Zarządzanie aktywnościami"
        text="Twórz i konfiguruj aktywności punktowane"
        icon={ClipboardList}
      >
        <CreateActivityDialog />
      </DashboardHeader>

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
              Brak aktywności. Utwórz pierwszą aktywność klikając przycisk
              powyżej.
            </p>
          ) : (
            <ActivitiesTable activities={activities} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
