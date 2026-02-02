import {
  Activity as ActivityIcon,
  CheckCircle2,
  List,
  Target,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getActivity } from "@/actions/activities";
import { getActivityPointAssignments } from "@/actions/points";
import { PointsTable } from "@/app/(dashboard)/admin/points/points-table";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

import { ActivityActions } from "./activity-actions";

interface PageProps {
  params: Promise<{ activityId: string }>;
}

export default async function ActivityDetailsPage({ params }: PageProps) {
  const { activityId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin") {
    return notFound();
  }

  const [{ activity }, { assignments }] = await Promise.all([
    getActivity(activityId),
    getActivityPointAssignments(activityId),
  ]);

  if (activity === undefined) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading={activity.name}
          text="Szczegóły aktywności i historia przypisań"
          icon={ActivityIcon}
        />
        <ActivityActions activity={activity} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Typ</CardTitle>
            <ActivityIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.type === "FIXED" ? "Stała" : "Zakres"}
            </div>
            <p className="text-muted-foreground text-xs">
              Sposób naliczania punktów
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wartość</CardTitle>
            <Target className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.type === "FIXED"
                ? activity.fixedPoints
                : `${String(activity.minPoints ?? 0)} - ${String(activity.maxPoints ?? 0)}`}
            </div>
            <p className="text-muted-foreground text-xs">
              Liczba punktów do zdobycia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {activity.isActive ? (
              <CheckCircle2 className="text-muted-foreground size-4" />
            ) : (
              <XCircle className="text-muted-foreground size-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activity.isActive ? (
                <Badge>Aktywna</Badge>
              ) : (
                <Badge variant="secondary">Nieaktywna</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Łącznie przypisań
            </CardTitle>
            <List className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-muted-foreground text-xs">
              Tyle razy przyznano punkty
            </p>
          </CardContent>
        </Card>
      </div>

      {activity.description !== null && activity.description !== "" ? (
        <Card>
          <CardHeader>
            <CardTitle>Opis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{activity.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Historia przypisań</CardTitle>
          <CardDescription>
            Lista użytkowników, którym przyznano punkty za tę aktywność
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PointsTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  );
}
