"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import type { Role } from "../generated/prisma/enums";

export async function getUsers() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN" && session?.user.role !== "MODERATOR") {
    throw new Error("Unauthorized");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      totalPoints: true,
      createdAt: true,
    },
  });

  return { users };
}

export async function getUser(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN" && session?.user.role !== "MODERATOR") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      totalPoints: true,
      createdAt: true,
    },
  });

  if (user === null) {
    return { error: "User not found" };
  }

  return { user };
}

export async function updateUserRole(userId: string, role: Role) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own role" };
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

  if (session?.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (newPassword.length < 6) {
    return { error: "Hasło musi mieć co najmniej 6 znaków" };
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

  if (session?.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account" };
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
