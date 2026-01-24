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
