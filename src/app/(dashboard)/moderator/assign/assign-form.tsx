"use client";

import { useForm } from "@tanstack/react-form";
import { Award, ClipboardList, Info, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const form = useForm({
    defaultValues: {
      userId: "",
      activityId: "",
      points: 0,
      notes: "",
    },
    validators: {
      onChange: assignPointsSchema,
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

  useEffect(() => {
    if (
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler
      selectedActivity?.type === "FIXED" &&
      selectedActivity.fixedPoints !== null
    ) {
      form.setFieldValue("points", selectedActivity.fixedPoints);
    }
  }, [selectedActivity, form]);

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
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="space-y-6"
          >
            <form.Field name="userId">
              {(field) => (
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Users className="size-4" />
                    Użytkownik
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.handleChange(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2">
                            {user.name ?? user.email}
                            <Badge variant="outline" className="text-xs">
                              {user.totalPoints} pkt
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (value !== null) {
                        field.handleChange(value);
                        const activity = activities.find((a) => a.id === value);
                        setSelectedActivity(activity ?? null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          <span className="flex items-center gap-2">
                            {activity.name}
                            <Badge variant="secondary" className="text-xs">
                              {activity.type === "FIXED"
                                ? `${String(activity.fixedPoints)} pkt`
                                : `${String(activity.minPoints)}-${String(activity.maxPoints)} pkt`}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            {selectedActivity === null ? null : (
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900/50">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Szczegóły aktywności</p>
                    <p className="text-muted-foreground text-sm">
                      Typ:{" "}
                      <span className="text-foreground font-medium">
                        {selectedActivity.type === "FIXED" ? "Stała" : "Zakres"}
                      </span>
                    </p>
                    {selectedActivity.type === "FIXED" ? (
                      <p className="text-muted-foreground text-sm">
                        Wartość:{" "}
                        <span className="text-foreground font-medium">
                          {selectedActivity.fixedPoints ?? 0} pkt
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Zakres:{" "}
                        <span className="text-foreground font-medium">
                          {selectedActivity.minPoints ?? 0} -{" "}
                          {selectedActivity.maxPoints ?? 0} pkt
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                      min={selectedActivity?.minPoints ?? 0}
                      max={selectedActivity?.maxPoints ?? 0}
                      disabled={selectedActivity === null}
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
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || selectedActivity === null}
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
        </CardContent>
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
