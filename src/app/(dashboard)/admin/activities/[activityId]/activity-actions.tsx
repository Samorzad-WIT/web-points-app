"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Edit, MoreVertical, Power, PowerOff, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteActivity,
  toggleActivity,
  updateActivity,
} from "@/actions/activities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { ActivityType } from "@/generated/prisma/enums";

interface Activity {
  id: string;
  name: string;
  description: string | null;
  type: ActivityType;
  fixedPoints: number | null;
  minPoints: number | null;
  maxPoints: number | null;
  isActive: boolean;
}

const activitySchema = z.object({
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
  description: z.string(),
  type: z.enum(["FIXED", "RANGE"]),
  fixedPoints: z.number().min(1),
  minPoints: z.number().min(1),
  maxPoints: z.number().min(1),
});

export function ActivityActions({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleActivity(activity.id);
      if (result.error === undefined) {
        toast.success(
          activity.isActive
            ? "Aktywność została wyłączona"
            : "Aktywność została włączona",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <EditActivityDialog
        activity={activity}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. To trwale usunie aktywność &quot;
              {activity.name}&quot; i usunie dane z naszych serwerów.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                const result = await deleteActivity(activity.id);
                if (result.error === undefined) {
                  toast.success("Aktywność została usunięta");
                  setDeleteDialogOpen(false);
                  router.push("/admin/activities");
                } else {
                  toast.error(result.error);
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm">
              <MoreVertical className="mr-2 size-4" />
              Akcje
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditDialogOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Edytuj
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
            {activity.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" /> Wyłącz
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" /> Włącz
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
            variant="destructive"
          >
            <Trash className="mr-2 h-4 w-4" /> Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function EditActivityDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [activityType, setActivityType] = useState<ActivityType>(activity.type);

  const form = useForm({
    defaultValues: {
      name: activity.name,
      description: activity.description ?? "",
      type: activity.type,
      fixedPoints: activity.fixedPoints ?? 5,
      minPoints: activity.minPoints ?? 1,
      maxPoints: activity.maxPoints ?? 10,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: activitySchema,
    },
    onSubmit: async ({ value }) => {
      const result = await updateActivity(activity.id, {
        name: value.name,
        description: value.description || undefined,
        type: value.type,
        fixedPoints: value.type === "FIXED" ? value.fixedPoints : undefined,
        minPoints: value.type === "RANGE" ? value.minPoints : undefined,
        maxPoints: value.type === "RANGE" ? value.maxPoints : undefined,
        isActive: activity.isActive,
      });

      if (result.error === undefined) {
        toast.success("Aktywność została zaktualizowana");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj aktywność</DialogTitle>
          <DialogDescription>
            Zmień parametry aktywności &quot;{activity.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel>Nazwa aktywności</FieldLabel>
                <Input
                  placeholder="np. Udział w zebraniu"
                  value={field.state.value}
                  onChange={(inputEvent) => {
                    field.handleChange(inputEvent.target.value);
                  }}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel>Opis (opcjonalnie)</FieldLabel>
                <Textarea
                  placeholder="Opis aktywności..."
                  value={field.state.value}
                  onChange={(textareaEvent) => {
                    field.handleChange(textareaEvent.target.value);
                  }}
                  rows={2}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <Field>
                <FieldLabel>Typ punktów</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value) {
                      const newType = value as ActivityType;
                      field.handleChange(newType);
                      setActivityType(newType);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value: ActivityType) =>
                        value === "FIXED"
                          ? "Stała liczba punktów"
                          : "Zakres punktów"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    <SelectItem value="FIXED">Stała liczba punktów</SelectItem>
                    <SelectItem value="RANGE">Zakres punktów</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          {activityType === "FIXED" ? (
            <form.Field name="fixedPoints">
              {(field) => (
                <Field>
                  <FieldLabel>Liczba punktów</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(
                        Number.parseInt(event.target.value) || 0,
                      );
                    }}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="minPoints">
                {(field) => (
                  <Field>
                    <FieldLabel>Minimum</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(
                          Number.parseInt(event.target.value) || 0,
                        );
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="maxPoints">
                {(field) => (
                  <Field>
                    <FieldLabel>Maksimum</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(
                          Number.parseInt(event.target.value) || 0,
                        );
                      }}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Anuluj
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Zapisywanie...
                    </>
                  ) : (
                    "Zapisz zmianę"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
