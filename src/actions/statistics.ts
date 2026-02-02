"use server";

import { format, startOfDay, subDays } from "date-fns";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getStatistics(termId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin" && session?.user.role !== "moderator") {
    throw new Error("Unauthorized");
  }

  const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);

  const termFilter =
    termId !== undefined && termId !== "" ? { termId } : undefined;

  const assignmentsLast30Days = await prisma.pointAssignment.findMany({
    where: {
      ...termFilter,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
      points: true,
    },
  });

  const pointsByDate = new Map<string, number>();

  for (let index = 0; index <= 30; index++) {
    const date = subDays(startOfDay(new Date()), 30 - index);
    const dateKey = format(date, "yyyy-MM-dd");
    pointsByDate.set(dateKey, 0);
  }

  for (const a of assignmentsLast30Days) {
    const dateKey = format(startOfDay(a.createdAt), "yyyy-MM-dd");
    const current = pointsByDate.get(dateKey) ?? 0;
    pointsByDate.set(dateKey, current + a.points);
  }

  const pointsOverTime = [...pointsByDate.entries()].map(([date, points]) => ({
    date,
    points,
  }));

  const assignmentsPerActivity = await prisma.pointAssignment.groupBy({
    by: ["activityId"],
    where: termFilter,
    _count: {
      id: true,
    },
  });

  const activities = await prisma.activity.findMany({
    where: {
      id: {
        in: assignmentsPerActivity.map((a) => a.activityId),
      },
    },
    select: { id: true, name: true },
  });

  const activitiesPieData = assignmentsPerActivity
    .map((item) => {
      const activity = activities.find((a) => a.id === item.activityId);
      return {
        name: activity?.name ?? "Unknown",
        count: item._count.id,
      };
    })
    .toSorted((a, b) => b.count - a.count);

  const pointsPerActivity = await prisma.pointAssignment.groupBy({
    by: ["activityId"],
    where: termFilter,
    _sum: {
      points: true,
    },
  });

  const topActivitiesData = pointsPerActivity
    .map((item) => {
      const activity = activities.find((a) => a.id === item.activityId);
      return {
        name: activity?.name ?? "Unknown",
        points: item._sum.points ?? 0,
      };
    })
    .toSorted((a, b) => b.points - a.points)
    .slice(0, 5);

  const pointsPerAssigner = await prisma.pointAssignment.groupBy({
    by: ["assignedById"],
    where: termFilter,
    _sum: {
      points: true,
    },
    _count: {
      id: true,
    },
  });

  const assignerIds = pointsPerAssigner.map((p) => p.assignedById);
  const assigners = await prisma.user.findMany({
    where: { id: { in: assignerIds } },
    select: { id: true, name: true, email: true },
  });

  const topAssignersData = pointsPerAssigner
    .map((item) => {
      const assigner = assigners.find((u) => u.id === item.assignedById);
      return {
        name: assigner?.name ?? assigner?.email ?? "Unknown",
        points: item._sum.points ?? 0,
        assignmentsCount: item._count.id,
      };
    })
    .toSorted((a, b) => b.points - a.points)
    .slice(0, 5);

  const pointsPerUser = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: termFilter,
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: 5,
  });

  const topUserIds = pointsPerUser.map((p) => p.userId);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });

  const topUsersData = pointsPerUser.map((item) => {
    const user = topUsers.find((u) => u.id === item.userId);
    return {
      name: user?.name ?? user?.email ?? "Unknown",
      email: user?.email ?? null,
      totalPoints: item._sum.points ?? 0,
    };
  });

  const dailyActivityMap = new Map<string, number>();
  for (let index = 0; index <= 30; index++) {
    const date = subDays(startOfDay(new Date()), 30 - index);
    const dateKey = format(date, "yyyy-MM-dd");
    dailyActivityMap.set(dateKey, 0);
  }

  for (const a of assignmentsLast30Days) {
    const dateKey = format(startOfDay(a.createdAt), "yyyy-MM-dd");
    const current = dailyActivityMap.get(dateKey) ?? 0;
    dailyActivityMap.set(dateKey, current + 1);
  }

  const dailyActivityData = [...dailyActivityMap.entries()].map(
    ([date, count]) => ({
      date,
      count,
    }),
  );

  return {
    pointsOverTime,
    activitiesPieData,
    topActivitiesData,
    topAssignersData,
    topUsersData,

    dailyActivityData,

    totalPoints: await prisma.pointAssignment
      .aggregate({
        where: termFilter,
        _sum: { points: true },
      })
      .then((result) => result._sum.points ?? 0),

    totalAssignments: await prisma.pointAssignment.count({
      where: termFilter,
    }),

    totalUsers: await prisma.user.count(),

    recentAssignments: await prisma.pointAssignment.findMany({
      where: termFilter,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        activity: { select: { name: true } },
        assignedBy: { select: { name: true } },
        term: { select: { name: true } },
      },
    }),
  };
}
