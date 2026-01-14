"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  createActivity,
  deleteActivity,
  toggleActivity,
  updateActivity,
} from "@/actions/activities";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import type { ActivityType } from "../../../../generated/prisma/enums";

interface Activity {
  id: string;
  name: string;
  description: string | null;
  type: ActivityType;
  fixedPoints: number | null;
  minPoints: number | null;
  maxPoints: number | null;
  isActive: boolean;
  _count: { assignments: number };
}

interface ActivitiesTableProps {
  activities: Activity[];
  readonly?: boolean;
}

export function ActivitiesTable({
  activities,
  readonly = false,
}: ActivitiesTableProps) {
  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nazwa" />
      ),
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div>
            <p className="font-medium">{activity.name}</p>
            {activity.description === null ? null : (
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {activity.description}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Typ" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue("type") === "FIXED" ? "Stałe" : "Zakres"}
        </Badge>
      ),
    },
    {
      id: "points",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Punkty" />
      ),
      accessorFn: (row) =>
        row.type === "FIXED" ? row.fixedPoints : row.minPoints,
      cell: ({ row }) => {
        if (row.original.type === "FIXED") {
          return <span>{String(row.original.fixedPoints ?? 0)}</span>;
        }
        return (
          <span>
            {String(row.original.minPoints ?? 0)} -{" "}
            {String(row.original.maxPoints ?? 0)}
          </span>
        );
      },
    },
    {
      accessorKey: "_count.assignments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Przypisania" />
      ),
      cell: ({ row }) => row.original._count.assignments,
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Aktywna" : "Nieaktywna"}
        </Badge>
      ),
    },
  ];

  if (!readonly) {
    columns.push({
      id: "actions",
      cell: ({ row }) => <ActivityActions activity={row.original} />,
    });
  }

  return (
    <DataTable
      columns={columns}
      data={activities}
      searchKey="name"
      searchPlaceholder="Szukaj aktywności..."
    />
  );
}

const activitySchema = z.object({
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
  description: z.string(),
  type: z.enum(["FIXED", "RANGE"]),
  fixedPoints: z.number().min(1),
  minPoints: z.number().min(1),
  maxPoints: z.number().min(1),
});

export function CreateActivityDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("FIXED");

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: "FIXED" as ActivityType,
      fixedPoints: 5,
      minPoints: 1,
      maxPoints: 10,
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: activitySchema,
    },
    onSubmit: async ({ value }) => {
      const result = await createActivity({
        name: value.name,
        description: value.description || undefined,
        type: value.type,
        fixedPoints: value.type === "FIXED" ? value.fixedPoints : undefined,
        minPoints: value.type === "RANGE" ? value.minPoints : undefined,
        maxPoints: value.type === "RANGE" ? value.maxPoints : undefined,
      });

      if (result.error === undefined) {
        toast.success("Aktywność została utworzona");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Button>
            <Plus className="mr-2 size-4" />
            Nowa aktywność
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Utwórz nową aktywność</DialogTitle>
          <DialogDescription>
            Dodaj nową aktywność punktowaną do systemu
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
                      field.handleChange(value as ActivityType);
                      setActivityType(value as ActivityType);
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
                setOpen(false);
              }}
            >
              Anuluj
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([_canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Tworzenie...
                    </>
                  ) : (
                    "Utwórz"
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

function ActivityActions({ activity }: { activity: Activity }) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <>
      <EditActivityDialog
        activity={activity}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            render={
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Otwórz menu</span>
                <MoreHorizontal className="h-4 w-4" />
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
            <DropdownMenuItem
              onClick={async (event) => {
                event.preventDefault();
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
              }}
            >
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
            <AlertDialog>
              <AlertDialogTrigger
                nativeButton={false}
                render={
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Usuń
                  </DropdownMenuItem>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Czy na pewno chcesz usunąć?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tej operacji nie można cofnąć. To trwale usunie aktywność
                    &quot;
                    {activity.name}&quot; i usunie dane z naszych serwerów.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async (event: React.MouseEvent) => {
                      event.preventDefault();
                      const result = await deleteActivity(activity.id);
                      if (result.error === undefined) {
                        toast.success("Aktywność została usunięta");
                        router.refresh();
                      } else {
                        toast.error(result.error);
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
