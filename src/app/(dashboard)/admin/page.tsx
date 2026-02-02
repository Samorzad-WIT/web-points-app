import { Award, ClipboardList, Shield, TrendingUp, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const role = session.user.role ?? "user";
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const totalUsers = await prisma.user.count();
  const moderators = await prisma.user.count({
    where: { role: "moderator" },
  });
  const admins = await prisma.user.count({
    where: { role: "admin" },
  });
  const totalActivities = await prisma.activity.count();
  const activeActivities = await prisma.activity.count({
    where: { isActive: true },
  });
  const totalAssignments = await prisma.pointAssignment.count();
  const totalPoints = await prisma.pointAssignment.aggregate({
    _sum: { points: true },
  });

  const quickActions = [
    {
      title: "Zarządzaj użytkownikami",
      description: "Dodaj, edytuj lub usuń użytkowników",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Zarządzaj aktywnościami",
      description: "Twórz i konfiguruj aktywności punktowane",
      href: "/admin/activities",
      icon: ClipboardList,
    },
    {
      title: "Zarządzaj punktami",
      description: "Przeglądaj i edytuj przyznane punkty",
      href: "/admin/points",
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Panel Administracyjny"
        text="Pełne zarządzanie systemem punktów"
        icon={Shield}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Użytkownicy"
          value={totalUsers}
          description={`${String(moderators)} moderatorów, ${String(admins)} adminów`}
          icon={Users}
        />
        <StatCard
          title="Aktywności"
          value={totalActivities}
          description={`${String(activeActivities)} aktywnych`}
          icon={ClipboardList}
        />
        <StatCard
          title="Przydzielenia"
          value={totalAssignments}
          description="Łączna liczba"
          icon={Award}
        />
        <StatCard
          title="Łącznie punktów"
          value={totalPoints._sum.points ?? 0}
          description="W całym systemie"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card
            key={action.href}
            className="hover:bg-muted/50 flex flex-col justify-between transition-colors"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <action.icon className="text-primary size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href={action.href}
                className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
              >
                Przejdź
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
