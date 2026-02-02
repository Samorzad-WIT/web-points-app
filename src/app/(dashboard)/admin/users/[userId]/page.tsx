import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar, Mail, Shield, Star, User as UserIcon } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getUserPointAssignments } from "@/actions/points";
import { getUser } from "@/actions/users";
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

import { UserActions } from "./user-actions";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { userId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.role !== "admin" && session?.user.role !== "moderator") {
    return notFound();
  }

  const [{ user }, { assignments }] = await Promise.all([
    getUser(userId),
    getUserPointAssignments(userId),
  ]);

  if (user === undefined) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          heading={user.name}
          text="Szczegóły użytkownika i historia punktów"
          icon={UserIcon}
        />
        <UserActions
          user={user}
          currentUserId={session.user.id}
          currentUserRole={session.user.role as import("@/types").Role}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Punkty łącznie
            </CardTitle>
            <Star className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.totalPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rola</CardTitle>
            <Shield className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.role === "admin" ? (
                <Badge variant="destructive">Admin</Badge>
              ) : user.role === "moderator" ? (
                <Badge className="bg-blue-500">Moderator</Badge>
              ) : (
                <Badge variant="secondary">Użytkownik</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
            <Mail className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{user.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Data dołączenia
            </CardTitle>
            <Calendar className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {format(user.createdAt, "d MMM yyyy", { locale: pl })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historia punktów</CardTitle>
          <CardDescription>
            Historia wszystkich punktów przyznanych temu użytkownikowi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PointsTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  );
}
