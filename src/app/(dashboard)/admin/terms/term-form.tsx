"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createTerm, updateTerm } from "@/actions/terms";
import { useTerm } from "@/components/term-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TermFormProps {
  term?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  };
}

export function TermForm({ term }: TermFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { refreshTerms } = useTerm();

  const [name, setName] = useState(term?.name ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    term?.startDate === undefined ? undefined : new Date(term.startDate),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    term?.endDate === undefined ? undefined : new Date(term.endDate),
  );

  const handleSubmit = (event_: React.FormEvent) => {
    event_.preventDefault();

    if (name.trim() === "") {
      toast.error("Nazwa jest wymagana");
      return;
    }

    if (startDate === undefined) {
      toast.error("Data rozpoczęcia jest wymagana");
      return;
    }

    if (endDate === undefined) {
      toast.error("Data zakończenia jest wymagana");
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        startDate,
        endDate,
      };

      const result =
        term === undefined
          ? await createTerm(data)
          : await updateTerm(term.id, data);

      if (result.error === undefined) {
        toast.success(
          term === undefined ? "Semestr utworzony" : "Semestr zaktualizowany",
        );
        await refreshTerms();
        router.push("/admin/terms");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nazwa</Label>
        <Input
          id="name"
          placeholder="np. Zima 2024/25"
          value={name}
          onChange={(event_) => {
            setName(event_.target.value);
          }}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="start-date-trigger">Data rozpoczęcia</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate === undefined
                    ? "Wybierz datę"
                    : format(startDate, "d MMMM yyyy", { locale: pl })}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="end-date-trigger">Data zakończenia</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isPending}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate === undefined
                    ? "Wybierz datę"
                    : format(endDate, "d MMMM yyyy", { locale: pl })}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {term === undefined ? "Utwórz semestr" : "Zaktualizuj semestr"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            router.back();
          }}
          disabled={isPending}
        >
          Anuluj
        </Button>
      </div>
    </form>
  );
}
