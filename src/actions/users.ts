"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, syncSuperAdminRole } from "@/lib/super-admin";
import type { Role } from "@/types";

export async function getUsers() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin" && session?.user.role !== "moderator") {
    throw new Error("Unauthorized");
  }

  // Super admins are hidden from admins and moderators
  const usersData = await prisma.user.findMany({
    where: { role: { not: "super_admin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const pointsAggregates = await prisma.pointAssignment.groupBy({
    by: ["userId"],
    _sum: { points: true },
  });
  const userPointsMap = new Map<string, number>();
  for (const agg of pointsAggregates) {
    userPointsMap.set(agg.userId, agg._sum.points ?? 0);
  }

  const users = usersData.map((user) => ({
    ...user,
    role: user.role as Role,
    totalPoints: userPointsMap.get(user.id) ?? 0,
  }));

  return { users };
}

export async function getUser(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin" && session?.user.role !== "moderator") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (user === null) {
    return { error: "User not found" };
  }

  // Super admin users are invisible to lower roles
  if (user.role === "super_admin") {
    return { error: "User not found" };
  }

  const pointsAgg = await prisma.pointAssignment.aggregate({
    where: { userId },
    _sum: { points: true },
  });

  return {
    user: {
      ...user,
      role: user.role as Role,
      totalPoints: pointsAgg._sum.points ?? 0,
    },
  };
}

export async function updateUserRole(userId: string, role: Role) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own role" };
  }

  // Admins cannot set the super_admin role
  if (role === "super_admin") {
    return { error: "Unauthorized" };
  }

  // Admins cannot change the role of a super_admin
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (targetUser?.role === "super_admin") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to update user role" };
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (newPassword.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków" };
  }

  // Admins cannot change password of a super_admin
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (targetUser?.role === "super_admin") {
    return { error: "Unauthorized" };
  }

  try {
    await auth.api.setUserPassword({
      body: {
        userId,
        newPassword,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch {
    return { error: "Failed to change password" };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account" };
  }

  // Admins cannot delete a super_admin
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (targetUser?.role === "super_admin") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to delete user" };
  }
}

export async function updateUserName(userId: string, newName: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const callerRole = session?.user.role ?? "";
  const callerEmail = session?.user.email ?? "";

  const callerIsSuperAdmin = isSuperAdmin(callerEmail, callerRole);

  if (!callerIsSuperAdmin && callerRole !== "admin" && callerRole !== "moderator") {
    return { error: "Unauthorized" };
  }

  // Sync super_admin role to DB if needed
  if (callerIsSuperAdmin && session) {
    await syncSuperAdminRole(session.user.id, callerEmail, callerRole);
  }

  // Non-super-admins cannot edit super_admin users
  if (!callerIsSuperAdmin) {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (targetUser?.role === "super_admin") {
      return { error: "Unauthorized" };
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: newName },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/super-admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to update user name" };
  }
}
