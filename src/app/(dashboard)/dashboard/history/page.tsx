import { History } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

import { HistoryTable } from "./history-table";

interface PageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const { termId } = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
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

  const termFilter =
    effectiveTermId === undefined ? undefined : { termId: effectiveTermId };

  const history = await prisma.pointAssignment.findMany({
    where: {
      userId: session.user.id,
      ...termFilter,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      activity: {
        select: {
          name: true,
        },
      },
      assignedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading="Historia punktów"
        text="Pełna historia Twoich aktywności"
        icon={History}
      />

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie wpisy</CardTitle>
          <CardDescription>
            Lista wszystkich punktów przyznanych Twojemu kontu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak historii punktów.
            </p>
          ) : (
            <HistoryTable data={history} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
