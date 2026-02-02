"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getActiveTerm } from "@/actions/terms";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createPointRequest(data: {
  activityId: string;
  points: number;
  notes?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Musisz być zalogowany" };
  }

  const { term: activeTerm } = await getActiveTerm();
  if (activeTerm === null) {
    return { error: "Brak aktywnego semestru" };
  }

  const activity = await prisma.activity.findUnique({
    where: { id: data.activityId },
  });

  if (activity === null) {
    return { error: "Aktywność nie istnieje" };
  }

  if (!activity.isActive) {
    return { error: "Ta aktywność jest nieaktywna" };
  }

  if (activity.type === "FIXED") {
    if (data.points !== activity.fixedPoints) {
      return {
        error: `Ta aktywność wymaga dokładnie ${String(activity.fixedPoints)} punktów`,
      };
    }
  } else {
    if (
      data.points < (activity.minPoints ?? 0) ||
      data.points > (activity.maxPoints ?? 0)
    ) {
      return {
        error: `Punkty muszą mieścić się w przedziale ${String(activity.minPoints ?? 0)} - ${String(activity.maxPoints ?? 0)}`,
      };
    }
  }

  const request = await prisma.pointRequest.create({
    data: {
      userId: session.user.id,
      activityId: data.activityId,
      termId: activeTerm.id,
      points: data.points,
      notes: data.notes ?? null,
    },
  });

  revalidatePath("/dashboard/requests");

  return { request };
}

export async function getMyPointRequests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Musisz być zalogowany" };
  }

  const requests = await prisma.pointRequest.findMany({
    where: { userId: session.user.id },
    include: {
      activity: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { requests };
}

export async function getPendingPointRequests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Musisz być zalogowany" };
  }

  const role = session.user.role ?? "USER";
  if (role !== "moderator" && role !== "admin") {
    return { error: "Brak uprawnień" };
  }

  const requests = await prisma.pointRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      activity: { select: { id: true, name: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return { requests };
}

export async function approvePointRequest(
  requestId: string,
  modifiedPoints?: number,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Musisz być zalogowany" };
  }

  const role = session.user.role ?? "USER";
  if (role !== "moderator" && role !== "admin") {
    return { error: "Brak uprawnień" };
  }

  const request = await prisma.pointRequest.findUnique({
    where: { id: requestId },
  });

  if (request === null) {
    return { error: "Wniosek nie istnieje" };
  }

  if (request.status !== "PENDING") {
    return { error: "Ten wniosek został już rozpatrzony" };
  }

  const finalPoints = modifiedPoints ?? request.points;

  await prisma.pointAssignment.create({
    data: {
      userId: request.userId,
      activityId: request.activityId,
      assignedById: session.user.id,
      termId: request.termId,
      points: finalPoints,
      notes: request.notes,
    },
  });

  await prisma.pointRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      points: finalPoints,
    },
  });

  revalidatePath("/moderator/requests");
  revalidatePath("/dashboard/ranking");

  return { success: true };
}

export async function rejectPointRequest(
  requestId: string,
  reviewNote?: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Musisz być zalogowany" };
  }

  const role = session.user.role ?? "USER";
  if (role !== "moderator" && role !== "admin") {
    return { error: "Brak uprawnień" };
  }

  const request = await prisma.pointRequest.findUnique({
    where: { id: requestId },
  });

  if (request === null) {
    return { error: "Wniosek nie istnieje" };
  }

  if (request.status !== "PENDING") {
    return { error: "Ten wniosek został już rozpatrzony" };
  }

  await prisma.pointRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewNote: reviewNote ?? null,
    },
  });

  revalidatePath("/moderator/requests");

  return { success: true };
}
