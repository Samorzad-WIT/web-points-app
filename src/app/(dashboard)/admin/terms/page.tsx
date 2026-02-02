import { Plus } from "lucide-react";
import Link from "next/link";

import { getTerms } from "@/actions/terms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TermsTable } from "./terms-table";

export default async function TermsPage() {
  const { terms } = await getTerms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semestry</h1>
          <p className="text-muted-foreground">
            Zarządzaj semestrami dla śledzenia punktów
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/terms/new">
              <Plus className="mr-2 h-4 w-4" />
              Nowy semestr
            </Link>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie semestry</CardTitle>
          <CardDescription>
            Punkty są liczone osobno dla każdego semestru. Tylko jeden semestr
            może być aktywny w danym momencie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TermsTable terms={terms} />
        </CardContent>
      </Card>
    </div>
  );
}
