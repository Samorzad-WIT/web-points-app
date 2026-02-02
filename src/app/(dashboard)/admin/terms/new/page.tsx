import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TermForm } from "../term-form";

export default function NewTermPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nowy semestr</h1>
        <p className="text-muted-foreground">Utwórz nowy semestr akademicki</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szczegóły semestru</CardTitle>
          <CardDescription>
            Wprowadź nazwę i zakres dat dla nowego semestru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TermForm />
        </CardContent>
      </Card>
    </div>
  );
}
