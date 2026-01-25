import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Award, History, TrendingUp, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ModeratorPage() {
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

  const totalUsers = await prisma.user.count();
  const activeActivities = await prisma.activity.count({
    where: { isActive: true },
  });
  const totalPointsAssigned = await prisma.pointAssignment.aggregate({
    _sum: { points: true },
  });
  const thisMonthAssignments = await prisma.pointAssignment.count({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
      assignedById: session.user.id,
    },
  });

  const recentAssignments = await prisma.pointAssignment.findMany({
    where: {
      assignedById: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: { name: true, email: true },
      },
      activity: {
        select: { name: true },
      },
      assignedBy: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Panel Moderatora"
        text="Zarządzaj punktami aktywności"
      >
        <Link
          href="/moderator/assign"
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium"
        >
          <Award className="mr-2 size-4" />
          Przydziel punkty
        </Link>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Użytkownicy"
          value={totalUsers}
          description="Zarejestrowanych członków"
          icon={Users}
        />
        <StatCard
          title="Aktywne aktywności"
          value={activeActivities}
          description="Dostępnych do przydzielenia"
          icon={Award}
        />
        <StatCard
          title="Łącznie punktów"
          value={totalPointsAssigned._sum.points ?? 0}
          description="Przyznanych w systemie"
          icon={TrendingUp}
        />
        <StatCard
          title="Ten miesiąc"
          value={thisMonthAssignments}
          description="Przydzielonych aktywności"
          icon={History}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Twoje ostatnie przydzielenia</CardTitle>
          <CardDescription>Punkty przyznane przez Ciebie</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAssignments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Nie przydzieliłeś jeszcze żadnych punktów
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Użytkownik</TableHead>
                  <TableHead>Aktywność</TableHead>
                  <TableHead className="text-right">Punkty</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.user.name ?? assignment.user.email}
                    </TableCell>
                    <TableCell>
                      <div>
                        {assignment.activity.name}
                        {assignment.notes === null ? null : (
                          <p className="text-muted-foreground text-xs">
                            {assignment.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">+{assignment.points}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm">
                      {format(assignment.createdAt, "d MMM yyyy", {
                        locale: pl,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
