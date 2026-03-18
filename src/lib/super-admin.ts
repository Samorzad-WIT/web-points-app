/**
 * Super Admin (God) role utilities.
 *
 * Super admins are defined via the SUPER_ADMIN_EMAILS environment variable
 * (comma-separated list of email addresses). Their role is stored as
 * "super_admin" in the database and is invisible to all lower roles.
 */

import { prisma } from "./prisma";

export function getSuperAdminEmails(): string[] {
  const envVar = process.env.SUPER_ADMIN_EMAILS ?? "";
  return envVar
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Returns true if the given email/role combination represents a super admin.
 * Checks both the DB role and the SUPER_ADMIN_EMAILS env var so super admins
 * are recognised even before their DB role has been synced.
 */
export function isSuperAdmin(email: string, role: string): boolean {
  if (role === "super_admin") return true;
  return getSuperAdminEmails().includes(email);
}

/**
 * Syncs the DB role to "super_admin" for users whose email is in
 * SUPER_ADMIN_EMAILS but whose stored role is something else.
 * Call this inside super-admin server actions so the role is lazily
 * persisted on first use.
 */
export async function syncSuperAdminRole(
  userId: string,
  email: string,
  currentRole: string,
): Promise<void> {
  if (currentRole !== "super_admin" && getSuperAdminEmails().includes(email)) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "super_admin" },
    });
  }
}
