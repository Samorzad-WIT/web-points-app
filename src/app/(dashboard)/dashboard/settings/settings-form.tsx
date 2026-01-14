"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { Lock, Save, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { changePassword, updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface SettingsFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
}

const profileSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Bieżące hasło jest wymagane"),
    newPassword: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
    confirmPassword: z.string().min(6, "Potwierdź hasło"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();

  const profileForm = useForm({
    defaultValues: {
      name: user.name ?? "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: profileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await updateProfile({
          name: value.name,
        });

        if (result.error === undefined) {
          toast.success("Profil zaktualizowany");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Wystąpił błąd");
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });

        if (result.error === undefined) {
          toast.success("Hasło zostało zmienione");
          passwordForm.reset();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Wystąpił błąd");
      }
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Dane profilowe
          </CardTitle>
          <CardDescription>Zaktualizuj swoje dane osobowe</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void profileForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="static-email">Email</Label>
              <Input
                id="static-email"
                value={user.email}
                disabled
                className="bg-muted"
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // Read-only
              />
            </div>

            <profileForm.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="name">Imię i nazwisko</FieldLabel>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </profileForm.Field>

            <profileForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([_canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Zapisz zmiany
                    </>
                  )}
                </Button>
              )}
            </profileForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Zmiana hasła
          </CardTitle>
          <CardDescription>
            Zadbaj o bezpieczeństwo swojego konta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="currentPassword">
                    Obecne hasło
                  </FieldLabel>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="newPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="newPassword">Nowe hasło</FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Potwierdź nowe hasło
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={field.state.value}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </passwordForm.Field>

            <passwordForm.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Zmienianie...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Zmień hasło
                    </>
                  )}
                </Button>
              )}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
