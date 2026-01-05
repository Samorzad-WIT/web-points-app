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

export default async function HistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session === null) {
    redirect("/login");
  }

  const history = await prisma.pointAssignment.findMany({
    where: {
      userId: session.user.id,
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
