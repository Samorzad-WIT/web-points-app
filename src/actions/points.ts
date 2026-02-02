"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPointAssignments(termId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const assignments = await prisma.pointAssignment.findMany({
    where: termId !== undefined && termId !== "" ? { termId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      activity: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      term: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { assignments };
}

export async function getUserPointAssignments(userId: string, termId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const whereClause: { userId: string; termId?: string } = { userId };
  if (termId !== undefined && termId !== "") {
    whereClause.termId = termId;
  }

  const assignments = await prisma.pointAssignment.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      activity: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      term: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { assignments };
}

export async function getActivityPointAssignments(activityId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const assignments = await prisma.pointAssignment.findMany({
    where: { activityId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      activity: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return { assignments };
}

export async function deletePointAssignment(assignmentId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const assignment = await prisma.pointAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (assignment === null) {
      return { error: "Assignment not found" };
    }

    await prisma.pointAssignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/admin/points");
    return { success: true };
  } catch {
    return { error: "Failed to delete assignment" };
  }
}
