import { Medal, Trophy } from "lucide-react";

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

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      totalPoints: true,
      _count: {
        select: { pointsReceived: true },
      },
    },
  });

  const topThree = users.slice(0, 3);

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Ranking Aktywności"
        text="Zobacz kto jest najbardziej aktywny w samorządzie"
        icon={Trophy}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 0, 2].map((index) => {
          const user = topThree[index];
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (user == null) {
            return <div key={index} />;
          }

          const position = index === 1 ? 1 : index === 0 ? 2 : 3;
          const height =
            position === 1 ? "h-40" : position === 2 ? "h-32" : "h-24";
          const bgColor =
            position === 1
              ? "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30"
              : position === 2
                ? "from-gray-400/20 to-gray-500/10 border-gray-400/30"
                : "from-orange-500/20 to-orange-600/10 border-orange-500/30";
          const iconColor =
            position === 1
              ? "text-yellow-500"
              : position === 2
                ? "text-gray-400"
                : "text-orange-500";

          return (
            <Card
              key={user.id}
              className={cn(
                "relative overflow-hidden bg-gradient-to-b",
                bgColor,
              )}
            >
              <CardContent className="mt-auto flex flex-col items-center justify-center pt-6">
                <div className="absolute top-0 right-4 mt-2">
                  {position === 1 ? (
                    <Trophy className={cn("size-8", iconColor)} />
                  ) : (
                    <Medal className={cn("size-6", iconColor)} />
                  )}
                </div>
                <Avatar
                  className={cn(
                    position === 1 ? "size-20" : "size-16",
                    "border-2",
                  )}
                >
                  <AvatarFallback className="text-xl font-bold">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() ?? user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <p
                    className={cn(
                      "font-bold",
                      position === 1 ? "text-xl" : "text-lg",
                    )}
                  >
                    {user.name ?? user.email}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {user._count.pointsReceived} aktywności
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("mt-3", position === 1 && "px-4 py-1 text-lg")}
                >
                  {user.totalPoints} pkt
                </Badge>
                <div
                  className={cn("bg-muted/30 mt-4 w-full rounded-t-lg", height)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pełny ranking</CardTitle>
          <CardDescription>
            Wszyscy uczestnicy z punktami aktywności
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak danych w rankingu
            </p>
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
                {users.map((user, index) => (
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
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() ?? user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.name ?? user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user._count.pointsReceived}
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
