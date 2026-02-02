"use client";

import { AlertCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { createPointRequest } from "@/actions/point-requests";
import { useTerm } from "@/components/term-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/generated/prisma/client";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        "Wysyłanie..."
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Wyślij zgłoszenie
        </>
      )}
    </Button>
  );
}

export function RequestForm({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [activityId, setActivityId] = useState<string | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [points, setPoints] = useState<number | string>("");

  const filteredActivities =
    activityQuery === ""
      ? activities
      : activities.filter((activity) =>
          activity.name.toLowerCase().includes(activityQuery.toLowerCase()),
        );
  const [notes, setNotes] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (
      _previousState: unknown,
      data: { activityId: string; points: number; notes: string },
    ) => {
      return await createPointRequest(data);
    },
    null,
  );
  const { isHistoricView } = useTerm();

  const selectedActivity = activities.find((a) => a.id === activityId);

  useEffect(() => {
    if (state?.error !== undefined) {
      toast.error(state.error);
    }
    const s = state as { request?: unknown; error?: string } | null;
    if (s?.request !== undefined) {
      toast.success("Zgłoszenie zostało wysłane!");
      setActivityId(null);
      setPoints("");
      setNotes("");
      router.push("/dashboard/requests");
    }
  }, [state, router]);

  useEffect(() => {
    if (
      selectedActivity?.type === "FIXED" &&
      selectedActivity.fixedPoints !== null
    ) {
      setPoints(selectedActivity.fixedPoints);
    } else {
      setPoints("");
    }
  }, [selectedActivity]);

  const handleSubmit = (_formData: FormData) => {
    if (activityId === null) {
      toast.error("Wybierz aktywność");
      return;
    }

    let pointsNumber: number;
    if (selectedActivity?.type === "FIXED") {
      pointsNumber = selectedActivity.fixedPoints ?? 0;
    } else {
      const p = Number.parseInt(points.toString());
      if (Number.isNaN(p)) {
        toast.error("Podaj poprawną liczbę punktów");
        return;
      }
      if (
        selectedActivity !== undefined &&
        (p < (selectedActivity.minPoints ?? 0) ||
          p > (selectedActivity.maxPoints ?? Infinity))
      ) {
        toast.error(
          `Liczba punktów musi mieścić się w przedziale ${String(selectedActivity.minPoints ?? 0)}-${String(selectedActivity.maxPoints ?? "∞")}`,
        );
        return;
      }
      pointsNumber = p;
    }

    startTransition(() => {
      formAction({
        activityId,
        points: pointsNumber,
        notes,
      });
    });
  };

  if (isHistoricView) {
    return (
      <Alert
        variant="default"
        className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200"
      >
        <AlertCircle className="h-4 w-4 text-amber-900 dark:text-amber-200" />
        <AlertTitle>Tryb historyczny</AlertTitle>
        <AlertDescription>
          Nie można zgłaszać punktów dla zakończonych semestrów. Przełącz się na
          aktywny semestr, aby dodać zgłoszenie.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="activity">Aktywność</Label>
        <Combobox
          value={activityId}
          onValueChange={(value) => {
            if (value !== null) {
              setActivityId(value);
            }
          }}
          onInputValueChange={(value) => {
            setActivityQuery(value);
          }}
        >
          <ComboboxTrigger className="border-input placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
            {activityId === null ? (
              <span className="text-muted-foreground">Wybierz aktywność</span>
            ) : (
              (() => {
                const activity = activities.find((a) => a.id === activityId);
                return (
                  <span className="truncate">
                    {activity === undefined
                      ? "Wybierz aktywność"
                      : activity.name}
                  </span>
                );
              })()
            )}
          </ComboboxTrigger>
          <ComboboxContent className="min-w-[var(--anchor-width)]">
            <ComboboxInput
              placeholder="Szukaj aktywności..."
              showTrigger={false}
            />
            <ComboboxList>
              {filteredActivities.length === 0 && (
                <ComboboxEmpty>Nie znaleziono aktywności</ComboboxEmpty>
              )}
              {filteredActivities.map((activity) => (
                <ComboboxItem key={activity.id} value={activity.id}>
                  <span className="flex items-center gap-2">
                    {activity.name}
                    <Badge variant="secondary" className="text-xs">
                      {activity.type === "FIXED"
                        ? `${String(activity.fixedPoints)} pkt`
                        : `${String(activity.minPoints)}-${String(activity.maxPoints)} pkt`}
                    </Badge>
                  </span>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {selectedActivity === undefined ? null : (
          <p className="text-muted-foreground text-sm">
            {selectedActivity.description}
            <br />
            <span className="text-foreground font-medium">
              {selectedActivity.type === "FIXED"
                ? `Stała liczba punktów: ${String(selectedActivity.fixedPoints)}`
                : `Liczba punktów: ${String(selectedActivity.minPoints)} - ${String(selectedActivity.maxPoints)}`}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Liczba punktów</Label>
        <div className="relative">
          <Input
            id="points"
            type="number"
            placeholder="Wpisz liczbę punktów"
            value={points}
            onChange={(event) => {
              setPoints(event.target.value);
            }}
            min={
              selectedActivity?.type === "RANGE"
                ? (selectedActivity.minPoints ?? 0)
                : undefined
            }
            max={
              selectedActivity?.type === "RANGE"
                ? (selectedActivity.maxPoints ?? undefined)
                : undefined
            }
            disabled={
              isPending ||
              selectedActivity === undefined ||
              (selectedActivity.type === "FIXED" &&
                selectedActivity.fixedPoints !== null)
            }
          />
          {selectedActivity?.type === "FIXED" && (
            <div className="text-muted-foreground absolute top-2.5 right-3 text-xs">
              (stała wartość)
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Opis (opcjonalnie)</Label>
        <Textarea
          id="notes"
          placeholder="Opisz dlaczego zasługujesz na te punkty..."
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
          }}
          disabled={isPending}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton />
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
