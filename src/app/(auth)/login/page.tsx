"use client";

import { useForm } from "@tanstack/react-form";
import { AlertCircle, GraduationCap } from "lucide-react";
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
import { signIn } from "@/lib/auth-client";

const loginSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const result = await signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error === null) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setError(result.error.message ?? "Nieprawidłowe dane logowania");
        }
      } catch {
        setError("Wystąpił błąd podczas logowania");
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
            <CardTitle className="text-2xl font-bold">
              Samorząd W4N PWr
            </CardTitle>
            <CardDescription className="text-slate-400">
              System Punktów Aktywności
            </CardDescription>
          </div>
        </CardHeader>

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

            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="email" className="text-slate-300">
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="twoj.email@student.pwr.edu.pl"
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
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 w-full bg-gradient-to-r font-semibold shadow-lg transition-all hover:shadow-xl"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Logowanie...
                    </>
                  ) : (
                    "Zaloguj się"
                  )}
                </Button>
              )}
            </form.Subscribe>

            <p className="text-center text-sm text-slate-400">
              Nie masz konta?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
              >
                Zarejestruj się
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
