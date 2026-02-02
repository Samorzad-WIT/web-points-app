import { Award } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPointAssignments } from "@/actions/points";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { PointsTable } from "./points-table";

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function AdminPointsPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    redirect("/dashboard");
  }

  let effectiveTermId = termId;
  if (effectiveTermId === undefined) {
    const activeTerm = await prisma.term.findFirst({
      where: { isActive: true },
    });

    if (activeTerm === null) {
      const latestTerm = await prisma.term.findFirst({
        orderBy: { startDate: "desc" },
      });
      effectiveTermId = latestTerm?.id;
    } else {
      effectiveTermId = activeTerm.id;
    }
  }

  const { assignments } = await getPointAssignments(effectiveTermId);

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Punkty"
        text="Przeglądaj i zarządzaj wszystkimi przyznanymi punktami"
        icon={Award}
      />
      <Card>
        <CardHeader>
          <CardTitle>Historia Punktów</CardTitle>
          <CardDescription>
            Łącznie {assignments.length} wpisów w historii
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PointsTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  );
}
