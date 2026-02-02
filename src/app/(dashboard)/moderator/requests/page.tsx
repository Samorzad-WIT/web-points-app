import { headers } from "next/headers";

import { getPendingPointRequests } from "@/actions/point-requests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

import { RequestsQueue } from "./requests-queue";

export default async function ModeratorRequestsPage() {
  const { requests, error } = await getPendingPointRequests();

  if (error !== undefined) {
    return <div className="text-destructive text-center">Błąd: {error}</div>;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Oczekujące zgłoszenia
        </h1>
        <p className="text-muted-foreground">
          Zatwierdź lub odrzuć zgłoszenia punktów od użytkowników
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kolejka zgłoszeń</CardTitle>
          <CardDescription>
            {requests.length} zgłoszeń oczekuje na rozpatrzenie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestsQueue requests={requests} currentUserId={session?.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
