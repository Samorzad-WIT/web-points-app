"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function assignPoints(formData: {
  userId: string;
  activityId: string;
  points: number;
  notes?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Nie jesteś zalogowany" };
  }

  const role = session.user.role ?? "USER";
  if (role !== "MODERATOR" && role !== "ADMIN") {
    return { error: "Brak uprawnień" };
  }

  const { userId, activityId, points, notes } = formData;

  // Validate activity
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (activity === null) {
    return { error: "Aktywność nie istnieje" };
  }

  // Validate points based on activity type
  if (activity.type === "FIXED") {
    if (points !== activity.fixedPoints) {
      return {
        error: `Ta aktywność wymaga dokładnie ${String(activity.fixedPoints)} punktów`,
      };
    }
  } else {
    if (
      points < (activity.minPoints ?? 0) ||
      points > (activity.maxPoints ?? 0)
    ) {
      return {
        error: `Punkty muszą mieścić się w przedziale ${String(activity.minPoints ?? 0)} - ${String(activity.maxPoints ?? 0)}`,
      };
    }
  }

  // Create point assignment
  await prisma.pointAssignment.create({
    data: {
      userId,
      activityId,
      assignedById: session.user.id,
      points,
      notes: notes ?? null,
    },
  });

  // Update user total points
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints: {
        increment: points,
      },
    },
  });

  revalidatePath("/moderator/assign");
  revalidatePath("/dashboard/ranking");

  return { success: true };
}
