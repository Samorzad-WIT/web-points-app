import { Trophy } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

import { PodiumPlace } from "./components/podium-place";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function RankingPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;

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

  const usersWithPoints = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { pointsReceived: true },
      },
    },
  });

  const userPointsMap = new Map<string, number>();
  const pointsAggregates = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: termFilter,
    _sum: { points: true },
  });
  for (const agg of pointsAggregates) {
    userPointsMap.set(agg.userId, agg._sum.points ?? 0);
  }

  const activityCounts = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: termFilter,
    _count: { id: true },
  });
  const activityCountMap = new Map<string, number>();
  for (const agg of activityCounts) {
    activityCountMap.set(agg.userId, agg._count.id);
  }

  const formattedUsers = usersWithPoints
    .map((user) => ({
      ...user,
      totalPoints: userPointsMap.get(user.id) ?? 0,
      activityCount: activityCountMap.get(user.id) ?? 0,
    }))
    .filter((user) => user.totalPoints > 0)
    .toSorted((a, b) => b.totalPoints - a.totalPoints);

  const topThree = formattedUsers.slice(0, 3);

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Ranking Aktywności"
        text="Zobacz kto jest najbardziej aktywny w samorządzie"
        icon={Trophy}
      />

      {topThree.length > 0 && (
        <div className="grid grid-cols-2 gap-4 py-8 md:flex md:h-96 md:flex-row md:items-end md:justify-center">
          {[1, 0, 2].map((index) => {
            const user = topThree[index];
            const position = index === 1 ? 2 : index === 0 ? 1 : 3;

            return (
              <div
                key={index}
                className={cn(
                  "flex justify-center md:flex-1",
                  index === 0
                    ? "order-1 col-span-2 md:order-none"
                    : "order-2 col-span-1 md:order-none",
                )}
              >
                <PodiumPlace user={user} position={position} />
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pełny ranking</CardTitle>
          <CardDescription>
            Wszyscy uczestnicy z punktami aktywności
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formattedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Poz.</TableHead>
                  <TableHead>Uczestnik</TableHead>
                  <TableHead className="text-center">Aktywności</TableHead>
                  <TableHead className="text-right">Punkty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.activityCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{user.totalPoints} pkt</Badge>
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
