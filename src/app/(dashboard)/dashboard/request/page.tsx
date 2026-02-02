import { getActiveActivities } from "@/actions/activities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RequestForm } from "./request-form";

export default async function RequestPointsPage() {
  const { activities } = await getActiveActivities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Zgłoś punkty</h1>
        <p className="text-muted-foreground">
          Zgłoś punkty do zatwierdzenia przez moderatora
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nowe zgłoszenie</CardTitle>
          <CardDescription>
            Wybierz aktywność i wprowadź liczbę punktów. Twoje zgłoszenie
            zostanie przesłane do moderatora do zatwierdzenia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
