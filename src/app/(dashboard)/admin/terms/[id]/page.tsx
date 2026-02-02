import { notFound } from "next/navigation";

import { getTerm } from "@/actions/terms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TermForm } from "../term-form";

interface EditTermPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTermPage({ params }: EditTermPageProps) {
  const { id } = await params;
  const result = await getTerm(id);

  if (result.error !== undefined) {
    notFound();
  }

  const term = result.term;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edytuj semestr</h1>
        <p className="text-muted-foreground">Zaktualizuj szczegóły semestru</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szczegóły semestru</CardTitle>
          <CardDescription>
            Zmień nazwę i zakres dat dla tego semestru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TermForm
            term={{
              id: term.id,
              name: term.name,
              startDate: new Date(term.startDate),
              endDate: new Date(term.endDate),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
