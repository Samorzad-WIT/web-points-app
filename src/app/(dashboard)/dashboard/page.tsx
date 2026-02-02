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

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const userId = session.user.id;

  let effectiveTermId = termId;
  if (effectiveTermId === undefined) {
    const activeTerm = await prisma.term.findFirst({
      where: { isActive: true },
    });

    if (activeTerm === null) {
      const latestTerm = await prisma.term.findFirst({
        orderBy: { startDate: "desc" },
      });
      effectiveTermId = latestTerm?.id;
    } else {
      effectiveTermId = activeTerm.id;
    }
  }

  const termFilter =
    effectiveTermId === undefined ? undefined : { termId: effectiveTermId };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (user === null) {
    redirect("/login");
  }

  const recentPoints = await prisma.pointAssignment.findMany({
    where: {
      userId,
      ...termFilter,
    },
    include: {
      activity: true,
      assignedBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalPointsAgg = await prisma.pointAssignment.aggregate({
    where: { userId, ...termFilter },
    _sum: { points: true },
  });
  const totalPoints = totalPointsAgg._sum.points ?? 0;

  const totalAssignments = await prisma.pointAssignment.count({
    where: { userId, ...termFilter },
  });

  const thisMonthPoints = await prisma.pointAssignment.aggregate({
    where: {
      userId,
      ...termFilter,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { points: true },
  });

  const pointsAggregates = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: termFilter,
    _sum: { points: true },
  });
  const sortedRanking = pointsAggregates
    .filter((agg) => (agg._sum.points ?? 0) > 0)
    .toSorted((a, b) => (b._sum.points ?? 0) - (a._sum.points ?? 0));
  const rank = sortedRanking.findIndex((u) => u.userId === userId) + 1;

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={`Witaj, ${user.name.split(" ")[0]}! 👋`}
        text="Oto podsumowanie Twoich punktów aktywności"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Łączne punkty"
          value={totalPoints}
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
          description={`Spośród ${String(sortedRanking.length)} osób`}
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
            {recentPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
                  <TrendingUp className="text-muted-foreground size-6 opacity-50" />
                </div>
                <h3 className="font-semibold">Brak punktów</h3>
                <p className="text-muted-foreground text-sm">
                  Nie masz jeszcze żadnych przyznanych punktów w tym semestrze.
                </p>
              </div>
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
                  {recentPoints.map((assignment) => (
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
            <TopRankingList currentUserId={userId} termId={effectiveTermId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function TopRankingList({
  currentUserId,
  termId,
}: {
  currentUserId: string;
  termId?: string;
}) {
  const termFilter = termId === undefined ? undefined : { termId };

  const pointsAggregates = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: termFilter,
    _sum: { points: true },
  });
  const userPointsMap = new Map<string, number>();
  for (const agg of pointsAggregates) {
    userPointsMap.set(agg.userId, agg._sum.points ?? 0);
  }

  const sortedUserIds = [...userPointsMap.entries()]
    .filter(([, points]) => points > 0)
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const users = await prisma.user.findMany({
    where: { id: { in: sortedUserIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const topUsers = sortedUserIds
    .map((id) => {
      const user = users.find((u) => u.id === id);
      return user === undefined
        ? null
        : { ...user, totalPoints: userPointsMap.get(id) ?? 0 };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);

  if (topUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
          <Trophy className="text-muted-foreground size-6 opacity-50" />
        </div>
        <h3 className="font-semibold">Brak danych w rankingu</h3>
        <p className="text-muted-foreground text-sm">
          Nikt jeszcze nie zdobył punktów w tym semestrze.
          <br />
          Bądź pierwszy! 🚀
        </p>
      </div>
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
              <p className="font-medium">{user.name}</p>
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
