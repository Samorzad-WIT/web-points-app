import { Award, Crown, Users } from "lucide-react";
import { headers } from "next/headers";
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
import { isSuperAdmin, syncSuperAdminRole } from "@/lib/super-admin";
import Link from "next/link";

export default async function SuperAdminPage() {
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

  // Sync role to DB lazily
  await syncSuperAdminRole(session.user.id, email, role);

  const totalUsers = await prisma.user.count();
  const superAdmins = await prisma.user.count({ where: { role: "super_admin" } });
  const admins = await prisma.user.count({ where: { role: "admin" } });
  const totalAssignments = await prisma.pointAssignment.count();
  const totalPoints = await prisma.pointAssignment.aggregate({
    _sum: { points: true },
  });

  const quickActions = [
    {
      title: "Wszyscy użytkownicy",
      description: "Przeglądaj i zarządzaj wszystkimi użytkownikami, w tym innymi super adminami",
      href: "/super-admin/users",
      icon: Users,
    },
    {
      title: "Przydziel punkty",
      description: "Przyznaj punkty dowolnemu użytkownikowi w systemie",
      href: "/super-admin/assign",
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Panel Super Admina"
        text="Pełna kontrola nad systemem — widoczna tylko dla Super Adminów"
        icon={Crown}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Wszyscy użytkownicy"
          value={totalUsers}
          description={`${String(superAdmins)} super adminów, ${String(admins)} adminów`}
          icon={Users}
        />
        <StatCard
          title="Przydzielenia"
          value={totalAssignments}
          description="Łączna liczba w systemie"
          icon={Award}
        />
        <StatCard
          title="Łącznie punktów"
          value={totalPoints._sum.points ?? 0}
          description="W całym systemie"
          icon={Award}
        />
        <StatCard
          title="Super Adminów"
          value={superAdmins}
          description="Aktywni super admini"
          icon={Crown}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
