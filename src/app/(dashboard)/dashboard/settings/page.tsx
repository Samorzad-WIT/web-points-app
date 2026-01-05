import { Settings } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Ustawienia"
        text="Zarządzaj swoim profilem i bezpieczeństwem"
        icon={Settings}
      />
      <SettingsForm user={session.user} />
    </div>
  );
}
