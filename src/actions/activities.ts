"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActivityType = "FIXED" | "RANGE";

export async function createActivity(formData: {
  name: string;
  description?: string;
  type: ActivityType;
  fixedPoints?: number;
  minPoints?: number;
  maxPoints?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    return { error: "Brak uprawnień" };
  }

  const { name, description, type, fixedPoints, minPoints, maxPoints } =
    formData;

  if (type === "FIXED" && fixedPoints === undefined) {
    return { error: "Podaj stałą liczbę punktów" };
  }

  if (
    type === "RANGE" &&
    (minPoints === undefined || maxPoints === undefined)
  ) {
    return { error: "Podaj zakres punktów" };
  }

  if (
    type === "RANGE" &&
    minPoints !== undefined &&
    maxPoints !== undefined &&
    minPoints >= maxPoints
  ) {
    return {
      error: "Minimalna liczba punktów musi być mniejsza od maksymalnej",
    };
  }

  await prisma.activity.create({
    data: {
      name,
      description: description ?? null,
      type,
      fixedPoints: type === "FIXED" ? fixedPoints : null,
      minPoints: type === "RANGE" ? minPoints : null,
      maxPoints: type === "RANGE" ? maxPoints : null,
    },
  });

  revalidatePath("/admin/activities");
  return { success: true };
}

export async function updateActivity(
  id: string,
  formData: {
    name: string;
    description?: string;
    type: ActivityType;
    fixedPoints?: number;
    minPoints?: number;
    maxPoints?: number;
    isActive: boolean;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    return { error: "Brak uprawnień" };
  }

  const {
    name,
    description,
    type,
    fixedPoints,
    minPoints,
    maxPoints,
    isActive,
  } = formData;

  await prisma.activity.update({
    where: { id },
    data: {
      name,
      description: description ?? null,
      type,
      fixedPoints: type === "FIXED" ? fixedPoints : null,
      minPoints: type === "RANGE" ? minPoints : null,
      maxPoints: type === "RANGE" ? maxPoints : null,
      isActive,
    },
  });

  revalidatePath("/admin/activities");
  return { success: true };
}

export async function toggleActivity(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    return { error: "Brak uprawnień" };
  }

  const activity = await prisma.activity.findUnique({ where: { id } });
  if (activity === null) {
    return { error: "Aktywność nie istnieje" };
  }

  await prisma.activity.update({
    where: { id },
    data: { isActive: !activity.isActive },
  });

  revalidatePath("/admin/activities");
  return { success: true };
}

export async function deleteActivity(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    return { error: "Brak uprawnień" };
  }

  // Check if activity has assignments
  const assignmentsCount = await prisma.pointAssignment.count({
    where: { activityId: id },
  });

  if (assignmentsCount > 0) {
    return {
      error: `Nie można usunąć aktywności z przypisanymi punktami (${String(assignmentsCount)} przypisań). Dezaktywuj ją zamiast tego.`,
    };
  }

  await prisma.activity.delete({ where: { id } });

  revalidatePath("/admin/activities");
  return { success: true };
}
