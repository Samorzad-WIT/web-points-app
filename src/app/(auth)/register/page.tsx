"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { AlertCircle, CheckCircle2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Spinner } from "@/components/ui/spinner";
import { signUp } from "@/lib/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(2, "Imię i nazwisko musi mieć co najmniej 2 znaki"),
    email: z
      .email("Nieprawidłowy adres email")
      .regex(
        /.*(@student\.pwr\.edu\.pl|@pwr\.edu\.pl)$/,
        "Wymagany email @student.pwr.edu.pl lub @pwr.edu.pl",
      ),
    password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: registerSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const result = await signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
        });

        if (result.error === null) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          setError(result.error.message ?? "Błąd podczas rejestracji");
        }
      } catch (error_) {
        console.error("Registration error:", error_);
        setError("Wystąpił błąd podczas rejestracji");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />

      <Card className="relative z-10 w-full max-w-md border-slate-700/50 bg-slate-900/80 text-slate-100 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="from-primary to-primary/60 mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br shadow-lg">
            <GraduationCap className="text-primary-foreground size-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Rejestracja</CardTitle>
            <CardDescription className="text-slate-400">
              Dołącz do Systemu Punktów Aktywności
            </CardDescription>
          </div>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <Alert className="border-green-900/50 bg-green-950/50">
              <CheckCircle2 className="size-4 text-green-400" />
              <AlertDescription className="text-green-300">
                Konto zostało utworzone! Przekierowuję do aplikacji...
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            <CardContent className="space-y-4">
              {error === null ? null : (
                <Alert
                  variant="destructive"
                  className="border-red-900/50 bg-red-950/50"
                >
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form.Field name="name">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="name" className="text-slate-300">
                      Imię i nazwisko
                    </FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jan Kowalski"
                      className="focus:border-primary focus:ring-primary border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="email" className="text-slate-300">
                      Email uczelnianym
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="123456@student.pwr.edu.pl"
                      className="focus:border-primary focus:ring-primary border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="password" className="text-slate-300">
                      Hasło
                    </FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="focus:border-primary focus:ring-primary border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <Field>
                    <FieldLabel
                      htmlFor="confirmPassword"
                      className="text-slate-300"
                    >
                      Powtórz hasło
                    </FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="focus:border-primary focus:ring-primary border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500"
                      value={field.state.value}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                      }}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([_canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full bg-gradient-to-r font-semibold shadow-lg transition-all hover:shadow-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2" />
                        Rejestracja...
                      </>
                    ) : (
                      "Zarejestruj się"
                    )}
                  </Button>
                )}
              </form.Subscribe>

              <p className="text-center text-sm text-slate-400">
                Masz już konto?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                >
                  Zaloguj się
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
