"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTerms() {
  const terms = await prisma.term.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  return { terms };
}

export async function getActiveTerm() {
  const term = await prisma.term.findFirst({
    where: { isActive: true },
  });

  return { term };
}

export async function getTerm(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const term = await prisma.term.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  if (term === null) {
    return { error: "Term not found" };
  }

  return { term };
}

export async function createTerm(formData: {
  name: string;
  startDate: Date;
  endDate: Date;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { name, startDate, endDate } = formData;

  if (endDate <= startDate) {
    return { error: "End date must be after start date" };
  }

  const term = await prisma.term.create({
    data: {
      name,
      startDate,
      endDate,
    },
  });

  revalidatePath("/admin/terms");
  return { success: true, term };
}

export async function updateTerm(
  id: string,
  formData: {
    name: string;
    startDate: Date;
    endDate: Date;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const { name, startDate, endDate } = formData;

  if (endDate <= startDate) {
    return { error: "End date must be after start date" };
  }

  await prisma.term.update({
    where: { id },
    data: {
      name,
      startDate,
      endDate,
    },
  });

  revalidatePath("/admin/terms");
  return { success: true };
}

export async function setActiveTerm(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  await prisma.term.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  await prisma.term.update({
    where: { id },
    data: { isActive: true },
  });

  revalidatePath("/admin/terms");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTerm(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const assignmentsCount = await prisma.pointAssignment.count({
    where: { termId: id },
  });

  if (assignmentsCount > 0) {
    return {
      error: `Cannot delete term with ${String(assignmentsCount)} point assignments. Remove assignments first.`,
    };
  }

  await prisma.term.delete({ where: { id } });

  revalidatePath("/admin/terms");
  return { success: true };
}

export async function getTermLeaderboard(termId: string) {
  const leaderboard = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    where: { termId },
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: 10,
  });

  const userIds = leaderboard.map((item) => item.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, image: true },
  });

  return leaderboard.map((item) => {
    const user = users.find((u) => u.id === item.userId);
    return {
      userId: item.userId,
      name: user?.name ?? user?.email ?? "Unknown",
      email: user?.email,
      image: user?.image,
      totalPoints: item._sum.points ?? 0,
    };
  });
}
