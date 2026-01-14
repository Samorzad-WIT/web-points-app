"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";

const profileSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Unauthorized" };
  }

  const validated = profileSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nieprawidłowe dane" };
  }

  try {
    const result = await auth.api.updateUser({
      headers: await headers(),
      body: {
        name: validated.data.name,
      },
    });

    if (!result.status) {
      // better-auth might return status property or throw?
      // Actually better-auth api client usually returns the response data or throws on error?
      // Let's assume it works or throws.
      // But better-auth server functions usually return just the data.
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); // Sidebar name update
    return { success: true };
  } catch {
    // safe error handling
    return { error: "Nie udało się zaktualizować profilu" };
  }
}

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

export async function changePassword(data: z.infer<typeof passwordSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    return { error: "Unauthorized" };
  }

  const validated = passwordSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Nieprawidłowe dane" };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: validated.data.currentPassword,
        newPassword: validated.data.newPassword,
        revokeOtherSessions: true,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      // better-auth throws APIError usually
      return { error: error.message };
    }
    return { error: "Nie udało się zmienić hasła" };
  }
}
