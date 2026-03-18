"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getActiveTerm } from "@/actions/terms";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, syncSuperAdminRole } from "@/lib/super-admin";

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

  const role = session.user.role ?? "user";
  const email = session.user.email ?? "";
  const callerIsSuperAdmin = isSuperAdmin(email, role);

  if (!callerIsSuperAdmin && role !== "moderator" && role !== "admin") {
    return { error: "Brak uprawnień" };
  }

  if (callerIsSuperAdmin) {
    await syncSuperAdminRole(session.user.id, email, role);
  }

  const { term: activeTerm } = await getActiveTerm();
  if (activeTerm === null) {
    return {
      error: "No active term. Please create and activate a term first.",
    };
  }

  const { userId, activityId, points, notes } = formData;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (activity === null) {
    return { error: "Aktywność nie istnieje" };
  }

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

  await prisma.pointAssignment.create({
    data: {
      userId,
      activityId,
      assignedById: session.user.id,
      termId: activeTerm.id,
      points,
      notes: notes ?? null,
    },
  });

  revalidatePath("/moderator/assign");
  revalidatePath("/dashboard/ranking");

  return { success: true };
}
