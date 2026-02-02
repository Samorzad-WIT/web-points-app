"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteTerm, setActiveTerm } from "@/actions/terms";
import { useTerm } from "@/components/term-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Term {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  _count: {
    assignments: number;
  };
}

interface TermsTableProps {
  terms: Term[];
}

export function TermsTable({ terms }: TermsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { refreshTerms } = useTerm();

  const handleSetActive = (termId: string) => {
    startTransition(async () => {
      const result = await setActiveTerm(termId);
      if (result.error === undefined) {
        toast.success("Semestr ustawiony jako aktywny");
        await refreshTerms();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = (termId: string) => {
    startTransition(async () => {
      const result = await deleteTerm(termId);
      if (result.error === undefined) {
        toast.success("Semestr usunięty");
        await refreshTerms();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (terms.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Brak semestrów. Utwórz pierwszy semestr, aby rozpocząć śledzenie
        punktów.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>Zakres dat</TableHead>
          <TableHead>Przydziały</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {terms.map((term) => (
          <TableRow key={term.id}>
            <TableCell className="font-medium">{term.name}</TableCell>
            <TableCell>
              {format(new Date(term.startDate), "d MMM yyyy", { locale: pl })} –{" "}
              {format(new Date(term.endDate), "d MMM yyyy", { locale: pl })}
            </TableCell>
            <TableCell>{term._count.assignments}</TableCell>
            <TableCell>
              {term.isActive ? (
                <Badge variant="default">Aktywny</Badge>
              ) : (
                <Badge variant="secondary">Nieaktywny</Badge>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Akcje</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    render={(props) => (
                      <Link {...props} href={`/admin/terms/${term.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </Link>
                    )}
                  />
                  {!term.isActive && (
                    <DropdownMenuItem
                      onClick={() => {
                        handleSetActive(term.id);
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Ustaw jako aktywny
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      handleDelete(term.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
