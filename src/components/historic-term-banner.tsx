"use client";

import { ArrowRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useTerm } from "./term-provider";

export function HistoricTermBanner() {
  const router = useRouter();
  const { selectedTerm, activeTerm, isHistoricView, setSelectedTermId } =
    useTerm();

  if (!isHistoricView || selectedTerm === null || activeTerm === null) {
    return null;
  }

  const handleGoToCurrent = () => {
    setSelectedTermId(activeTerm.id);
    const parameters = new URLSearchParams(window.location.search);
    parameters.set("termId", activeTerm.id);
    router.push(`?${parameters.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/50">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">
          Przeglądasz dane historyczne z semestru{" "}
          <strong>{selectedTerm.name}</strong>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGoToCurrent}
        className="border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-100 dark:hover:bg-amber-900"
      >
        Wróć do aktualnego
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
