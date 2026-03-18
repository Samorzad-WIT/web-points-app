"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, syncSuperAdminRole } from "@/lib/super-admin";
import type { Role } from "@/types";

async function requireSuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    throw new Error("Unauthorized");
  }

  const email = session.user.email ?? "";
  const role = session.user.role ?? "";

  if (!isSuperAdmin(email, role)) {
    throw new Error("Unauthorized");
  }

  // Lazily sync DB role for env-var-based super admins
  await syncSuperAdminRole(session.user.id, email, role);

  return session;
}

/**
 * Returns ALL users including super_admins. Only accessible by super_admins.
 */
export async function getAllUsers() {
  await requireSuperAdmin();

  const usersData = await prisma.user.findMany({
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

/**
 * Updates any user's role, including promoting/demoting super_admins.
 * Only accessible by super_admins.
 */
export async function superAdminUpdateUserRole(userId: string, role: Role) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) {
    return { error: "You cannot change your own role" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/super-admin/users");
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to update user role" };
  }
}

/**
 * Deletes any user. Only accessible by super_admins.
 */
export async function superAdminDeleteUser(userId: string) {
  const session = await requireSuperAdmin();

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account" };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/super-admin/users");
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "Failed to delete user" };
  }
}

/**
 * Changes any user's password. Only accessible by super_admins.
 */
export async function superAdminChangeUserPassword(
  userId: string,
  newPassword: string,
) {
  await requireSuperAdmin();

  if (newPassword.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków" };
  }

  try {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });

    return { success: true };
  } catch {
    return { error: "Failed to change password" };
  }
}
