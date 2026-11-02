import { getMyPointRequests } from "@/actions/point-requests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RequestsTable } from "./requests-table";

export default async function MyRequestsPage() {
  const { requests, error } = await getMyPointRequests();

  if (error !== undefined) {
    return <div className="text-destructive text-center">Błąd: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moje zgłoszenia</h1>
        <p className="text-muted-foreground">
          Historia twoich zgłoszeń punktów
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historia zgłoszeń</CardTitle>
          <CardDescription>
            Sprawdź status swoich zgłoszeń punktów
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              Nie masz jeszcze żadnych zgłoszeń. Utwórz swoje pierwsze
              zgłoszenie punktów.
            </div>
          ) : (
            <RequestsTable requests={requests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
