"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPointAssignments() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const assignments = await prisma.pointAssignment.findMany({
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

  if (session?.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const assignment = await prisma.pointAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (assignment === null) {
      return { error: "Assignment not found" };
    }

    // Decrement user's total points
    await prisma.user.update({
      where: { id: assignment.userId },
      data: {
        totalPoints: {
          decrement: assignment.points,
        },
      },
    });

    await prisma.pointAssignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/admin/points");
    return { success: true };
  } catch {
    return { error: "Failed to delete assignment" };
  }
}
