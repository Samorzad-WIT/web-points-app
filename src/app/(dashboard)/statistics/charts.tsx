"use client";

import { Activity, Award, Users } from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { StatCard } from "@/components/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

export function KpiStatsCards({
  totalPoints,
  totalAssignments,
  totalUsers,
}: {
  totalPoints: number;
  totalAssignments: number;
  totalUsers: number;
}) {
  return (
    <div className="bg-background/50 grid gap-4 md:grid-cols-3">
      <StatCard
        title="Całkowite Punkty"
        value={totalPoints.toLocaleString()}
        description="Suma wszystkich przyznanych punktów"
        icon={Award}
      />
      <StatCard
        title="Przyznań"
        value={totalAssignments.toLocaleString()}
        description="Liczba operacji przyznania punktów"
        icon={Activity}
      />
      <StatCard
        title="Użytkownicy"
        value={totalUsers.toLocaleString()}
        description="Aktywni użytkownicy w systemie"
        icon={Users}
      />
    </div>
  );
}

const pointsOverTimeConfig = {
  points: {
    label: "Punkty",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function PointsOverTimeChart({
  data,
}: {
  data: { date: string; points: number }[];
}) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Dynamika Punktów</CardTitle>
        <CardDescription>
          Analiza przyznawania punktów w ostatnich 30 dniach
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer
          config={pointsOverTimeConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillPoints" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-points)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-points)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString("pl-PL", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="points"
              type="monotone"
              fill="url(#fillPoints)"
              fillOpacity={0.4}
              stroke="var(--color-points)"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const activitiesPieConfig = {
  count: {
    label: "Liczba",
  },
} satisfies ChartConfig;

export function ActivitiesPieChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: `var(--chart-${((index % 5) + 1).toString()})`,
    }));
  }, [data]);

  const dynamicConfig = React.useMemo(() => {
    const config: ChartConfig = { ...activitiesPieConfig };
    for (const [index, item] of data.entries()) {
      config[item.name] = {
        label: item.name,
        color: `var(--chart-${((index % 5) + 1).toString()})`,
      };
    }
    return config;
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Rozkład Aktywności</CardTitle>
        <CardDescription>Udział procentowy typów aktywności</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius={70}
              paddingAngle={2}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function RecentActivityList({
  data,
}: {
  data: {
    user: { name: string | null; email: string | null };
    activity: { name: string };
    assignedBy: { name: string | null };
  }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Ostatnie Aktywności</CardTitle>
        <CardDescription>Najnowsze 5 przyznań punktów</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item, index) => {
            const key = `${item.user.email ?? "unknown"}-${index.toString()}`;
            return (
              <div key={key} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {item.user.name === null
                      ? (item.user.email?.[0]?.toUpperCase() ?? "U")
                      : item.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {item.user.name ?? item.user.email ?? "Nieznany użytkownik"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {item.activity.name}
                  </p>
                </div>
                <div className="text-muted-foreground ml-auto text-xs font-medium">
                  przez {item.assignedBy.name ?? "Admin"}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const topActivitiesConfig = {
  points: {
    label: "Punkty",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function TopActivitiesChart({
  data,
}: {
  data: { name: string; points: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Aktywności</CardTitle>
        <CardDescription>Ranking aktywności wg sumy punktów</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topActivitiesConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="points" fill="var(--color-points)" radius={5}>
              <Cell fill="var(--chart-2)" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const topAssignersConfig = {
  points: {
    label: "Przyznane Punkty",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function TopAssignersChart({
  data,
}: {
  data: { name: string; points: number; assignmentsCount: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Najaktywniejsi Moderatorzy</CardTitle>
        <CardDescription>Kto przyznał najwięcej punktów</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topAssignersConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="points" fill="var(--color-points)" radius={5}>
              <Cell fill="var(--chart-3)" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const topUsersConfig = {
  totalPoints: {
    label: "Punkty",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function TopUsersChart({
  data,
}: {
  data: { name: string | null; totalPoints: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Użytkownicy</CardTitle>
        <CardDescription>Liderzy rankingu punktowego</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topUsersConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string | null) => value ?? "Użytkownik"}
              width={100}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="totalPoints"
              fill="var(--color-totalPoints)"
              radius={5}
            >
              <Cell fill="var(--chart-4)" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const dailyActivityConfig = {
  count: {
    label: "Aktywności",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function DailyActivityChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dzienna Aktywność</CardTitle>
        <CardDescription>
          Liczba transakcji w ostatnich 30 dniach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dailyActivityConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString("pl-PL", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={8}>
              <Cell fill="var(--chart-5)" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
