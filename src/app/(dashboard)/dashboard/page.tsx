import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Award, Calendar, TrendingUp, Trophy } from "lucide-react";
import { headers } from "next/headers";
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
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      pointsReceived: {
        include: {
          activity: true,
          assignedBy: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (user === null) {
    redirect("/login");
  }

  const totalAssignments = await prisma.pointAssignment.count({
    where: { userId },
  });

  const thisMonthPoints = await prisma.pointAssignment.aggregate({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { points: true },
  });

  const userRanking = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: "desc" },
    select: { id: true },
  });
  const rank = userRanking.findIndex((u) => u.id === userId) + 1;

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={`Witaj, ${
          user.name?.split(" ")[0] ?? user.email.split("@")[0]
        }! 👋`}
        text="Oto podsumowanie Twoich punktów aktywności"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Łączne punkty"
          value={user.totalPoints}
          description="Wszystkie zdobyte punkty"
          icon={Award}
        />
        <StatCard
          title="Punkty w tym miesiącu"
          value={thisMonthPoints._sum.points ?? 0}
          description={format(new Date(), "LLLL yyyy", { locale: pl })}
          icon={TrendingUp}
        />
        <StatCard
          title="Liczba aktywności"
          value={totalAssignments}
          description="Ukończonych zadań"
          icon={Calendar}
        />
        <StatCard
          title="Pozycja w rankingu"
          value={rank > 0 ? `#${String(rank)}` : "-"}
          description={`Spośród ${String(userRanking.length)} osób`}
          icon={Trophy}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie punkty</CardTitle>
            <CardDescription>
              Twoje ostatnie przyznane punkty aktywności
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.pointsReceived.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Nie masz jeszcze przyznanych punktów
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktywność</TableHead>
                    <TableHead className="text-right">Punkty</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.pointsReceived.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.activity.name}
                        </div>
                        {assignment.notes === null ? null : (
                          <div className="text-muted-foreground text-xs">
                            {assignment.notes}
                          </div>
                        )}
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

        <Card>
          <CardHeader>
            <CardTitle>Top 5 w rankingu</CardTitle>
            <CardDescription>
              Najbardziej aktywni członkowie samorządu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopRankingList currentUserId={userId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function TopRankingList({ currentUserId }: { currentUserId: string }) {
  const topUsers = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
    },
  });

  if (topUsers.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Brak danych w rankingu
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {topUsers.map((user, index) => (
        <div
          key={user.id}
          className={cn(
            "flex items-center justify-between rounded-lg p-3 transition-colors",
            user.id === currentUserId
              ? "bg-primary/10 ring-primary/20 ring-1"
              : "hover:bg-muted/50",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full font-bold",
                index === 0
                  ? "bg-yellow-500/20 text-yellow-600"
                  : index === 1
                    ? "bg-gray-400/20 text-gray-500"
                    : index === 2
                      ? "bg-orange-500/20 text-orange-600"
                      : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className="font-medium">{user.name ?? user.email}</p>
              {user.id === currentUserId && (
                <p className="text-primary text-xs">To Ty!</p>
              )}
            </div>
          </div>
          <Badge variant="outline">{user.totalPoints} pkt</Badge>
        </div>
      ))}
    </div>
  );
}
