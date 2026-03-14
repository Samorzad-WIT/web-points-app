import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { getMyPointRequests } from "@/actions/point-requests";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING": {
      return <Badge variant="secondary">Oczekujące</Badge>;
    }
    case "APPROVED": {
      return <Badge variant="default">Zatwierdzone</Badge>;
    }
    case "REJECTED": {
      return <Badge variant="destructive">Odrzucone</Badge>;
    }
    default: {
      return <Badge variant="outline">{status}</Badge>;
    }
  }
}

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktywność</TableHead>
                  <TableHead>Notatka</TableHead>
                  <TableHead>Punkty</TableHead>
                  <TableHead>Semestr</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.activity.name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.notes ?? "-"}
                    </TableCell>
                    <TableCell>{request.points}</TableCell>
                    <TableCell>{request.term.name}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "d MMM yyyy", {
                        locale: pl,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
