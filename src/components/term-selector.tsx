"use client";

import { Calendar, ChevronDown, ClockFadingIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { useTerm } from "./term-provider";

export function TermSelector() {
  const { terms, selectedTerm, activeTerm, setSelectedTermId, isLoading } =
    useTerm();
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParameters = useSearchParams();

  // Sync URL termId to context on mount
  useEffect(() => {
    const urlTermId = urlSearchParameters.get("termId");
    if (urlTermId !== null && terms.some((t) => t.id === urlTermId)) {
      setSelectedTermId(urlTermId);
    }
  }, [urlSearchParameters, terms, setSelectedTermId]);

  const handleTermChange = useCallback(
    (termId: string) => {
      setSelectedTermId(termId);

      // Update URL with new termId
      const parameters = new URLSearchParams(urlSearchParameters.toString());
      parameters.set("termId", termId);
      router.replace(`${pathname}?${parameters.toString()}`);
    },
    [setSelectedTermId, router, pathname, urlSearchParameters],
  );

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (terms.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Calendar className="mr-2 h-4 w-4" />
        Brak semestrów
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {selectedTerm?.name ?? "Wybierz semestr"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {terms.map((term) => (
          <DropdownMenuItem
            key={term.id}
            onClick={() => {
              handleTermChange(term.id);
            }}
            className={
              selectedTerm?.id === term.id ? "bg-accent font-medium" : ""
            }
          >
            <span className="flex-1">{term.name}</span>
            {term.id === activeTerm?.id && <ClockFadingIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
