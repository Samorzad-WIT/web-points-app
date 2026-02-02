"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { AlertCircle, Award, ClipboardList, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useTerm } from "@/components/term-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { assignPoints } from "./actions";

const assignPointsSchema = z.object({
  userId: z.string().min(1, "Wybierz użytkownika"),
  activityId: z.string().min(1, "Wybierz aktywność"),
  points: z.number().min(1, "Liczba punktów musi być większa od 0"),
  notes: z.string(),
});

interface User {
  id: string;
  name: string | null;
  email: string;
  totalPoints: number;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  type: "FIXED" | "RANGE";
  fixedPoints: number | null;
  minPoints: number | null;
  maxPoints: number | null;
}

interface AssignPointsFormProps {
  users: User[];
  activities: Activity[];
}

export function AssignPointsForm({ users, activities }: AssignPointsFormProps) {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [userQuery, setUserQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");

  const filteredUsers =
    userQuery === ""
      ? users
      : users.filter((user) =>
          (user.name ?? user.email)
            .toLowerCase()
            .includes(userQuery.toLowerCase()),
        );

  const filteredActivities =
    activityQuery === ""
      ? activities
      : activities.filter((activity) =>
          activity.name.toLowerCase().includes(activityQuery.toLowerCase()),
        );

  const form = useForm({
    defaultValues: {
      userId: "",
      activityId: "",
      points: 0,
      notes: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: assignPointsSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await assignPoints({
          userId: value.userId,
          activityId: value.activityId,
          points: value.points,
          notes: value.notes === "" ? undefined : value.notes,
        });

        if (result.error === undefined) {
          toast.success("Punkty zostały przyznane!");
          router.refresh();
          form.reset();
          setSelectedActivity(null);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Wystąpił błąd podczas przyznawania punktów");
      }
    },
  });

  const { isHistoricView } = useTerm();

  useEffect(() => {
    if (
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
      selectedActivity?.type === "FIXED" &&
      selectedActivity.fixedPoints !== null
    ) {
      form.setFieldValue("points", selectedActivity.fixedPoints);
    }
  }, [selectedActivity, form]);

  if (isHistoricView) {
    return (
      <Alert
        variant="default"
        className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200"
      >
        <AlertCircle className="h-4 w-4 text-amber-900 dark:text-amber-200" />
        <AlertTitle>Tryb historyczny</AlertTitle>
        <AlertDescription>
          Nie można przydzielać punktów dla zakończonych semestrów. Przełącz się
          na aktywny semestr, aby dokonać przydziału.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5" />
            Przydziel punkty
          </CardTitle>
          <CardDescription>
            Wybierz użytkownika i aktywność, za którą chcesz przyznać punkty
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <CardContent className="space-y-4">
            <form.Field name="userId">
              {(field) => (
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Users className="size-4" />
                    Użytkownik
                  </FieldLabel>
                  <Combobox
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.handleChange(value);
                      }
                    }}
                    onInputValueChange={(value) => {
                      setUserQuery(value);
                    }}
                  >
                    <ComboboxTrigger className="border-input placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                      {field.state.value ? (
                        (() => {
                          const user = users.find(
                            (u) => u.id === field.state.value,
                          );
                          return (
                            <span className="flex items-center gap-2 truncate">
                              {user === undefined
                                ? "..."
                                : (user.name ?? user.email)}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">
                          Wybierz użytkownika
                        </span>
                      )}
                    </ComboboxTrigger>
                    <ComboboxContent className="min-w-[var(--anchor-width)]">
                      <ComboboxInput
                        placeholder="Szukaj użytkownika..."
                        showTrigger={false}
                      />
                      <ComboboxList>
                        {filteredUsers.length === 0 && (
                          <ComboboxEmpty>
                            Nie znaleziono użytkownika
                          </ComboboxEmpty>
                        )}
                        {filteredUsers.map((user) => (
                          <ComboboxItem key={user.id} value={user.id}>
                            <span className="flex items-center gap-2">
                              {user.name ?? user.email}
                              <Badge variant="outline" className="text-xs">
                                {user.totalPoints} pkt
                              </Badge>
                            </span>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="activityId">
              {(field) => (
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <ClipboardList className="size-4" />
                    Aktywność
                  </FieldLabel>
                  <Combobox
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.handleChange(value);
                        const activity = activities.find((a) => a.id === value);
                        setSelectedActivity(activity ?? null);
                      }
                    }}
                    onInputValueChange={(value) => {
                      setActivityQuery(value);
                    }}
                  >
                    <ComboboxTrigger className="border-input placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
                      {field.state.value ? (
                        (() => {
                          const activity = activities.find(
                            (a) => a.id === field.state.value,
                          );
                          return (
                            <span className="truncate">
                              {activity === undefined ? "..." : activity.name}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">
                          Wybierz aktywność
                        </span>
                      )}
                    </ComboboxTrigger>
                    <ComboboxContent className="min-w-[var(--anchor-width)]">
                      <ComboboxInput
                        placeholder="Szukaj aktywności..."
                        showTrigger={false}
                      />
                      <ComboboxList>
                        {filteredActivities.length === 0 && (
                          <ComboboxEmpty>
                            Nie znaleziono aktywności
                          </ComboboxEmpty>
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
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="points">
              {(field) => (
                <div className="space-y-2">
                  <FieldLabel htmlFor={field.name} className="font-semibold">
                    Liczba punktów
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.valueAsNumber);
                      }}
                      min={
                        selectedActivity?.type === "RANGE"
                          ? (selectedActivity.minPoints ?? 0)
                          : undefined
                      }
                      max={
                        selectedActivity?.type === "RANGE"
                          ? (selectedActivity.maxPoints ?? 0)
                          : undefined
                      }
                      disabled={
                        selectedActivity === null ||
                        selectedActivity.type === "FIXED"
                      }
                      className={
                        selectedActivity?.type === "FIXED"
                          ? "cursor-not-allowed bg-slate-100 text-slate-500"
                          : ""
                      }
                    />
                    {selectedActivity?.type === "FIXED" && (
                      <div className="text-muted-foreground absolute top-2.5 right-3 text-xs">
                        (stała wartość)
                      </div>
                    )}
                  </div>
                  {selectedActivity?.type === "RANGE" && (
                    <p className="text-muted-foreground text-xs">
                      Wartość musi mieścić się w przedziale{" "}
                      {String(selectedActivity.minPoints ?? 0)} -{" "}
                      {String(selectedActivity.maxPoints ?? 0)}
                    </p>
                  )}
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <Field>
                  <FieldLabel>Notatka (opcjonalnie)</FieldLabel>
                  <Textarea
                    placeholder="Dodaj notatkę, np. za co dokładnie przyznano punkty..."
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    rows={3}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                router.back();
              }}
            >
              Anuluj
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([_canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedActivity === null}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Okej, przyznaję...
                    </>
                  ) : (
                    "Przyznaj punkty"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
          <CardDescription>Przegląd wybranej aktywności</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedActivity === null ? (
            <p className="text-muted-foreground py-8 text-center">
              Wybierz aktywność, aby zobaczyć szczegóły
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Aktywność</p>
                <p className="font-medium">{selectedActivity.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Typ</p>
                <Badge variant="outline">
                  {selectedActivity.type === "FIXED"
                    ? "Stała liczba punktów"
                    : "Zakres punktów"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Punkty</p>
                <p className="text-2xl font-bold">
                  {selectedActivity.type === "FIXED"
                    ? selectedActivity.fixedPoints
                    : `${String(selectedActivity.minPoints)} - ${String(selectedActivity.maxPoints)}`}
                </p>
              </div>
              {selectedActivity.description === null ? null : (
                <div>
                  <p className="text-muted-foreground text-sm">Opis</p>
                  <p className="text-sm">{selectedActivity.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
