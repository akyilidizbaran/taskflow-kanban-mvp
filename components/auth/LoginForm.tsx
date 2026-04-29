"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormProps = {
  initialMessage?: string;
  nextPath?: string;
};

export function LoginForm({ initialMessage, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const validated = loginSchema.safeParse(values);

    if (!validated.success) {
      setFieldErrors(validated.error.flatten().fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(validated.data);

    if (error) {
      setFormError(toErrorMessage(error, "We could not sign you in."));
      setIsSubmitting(false);
      return;
    }

    startTransition(() => {
      router.replace(nextPath ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="surface-panel w-full max-w-md rounded-[32px] border border-white/60 p-7 shadow-[0_30px_72px_-44px_rgba(15,23,42,0.34)] md:p-8">
      <div className="space-y-2">
        <p className="section-kicker">Welcome back</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Log in to TaskFlow</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Continue to your boards and pick up exactly where you left off.
        </p>
      </div>

      {initialMessage ? (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {initialMessage}
        </div>
      ) : null}

      {formError ? (
        <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {formError}
        </div>
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" placeholder="you@company.com" type="email" />
          {fieldErrors.email ? <p className="text-sm text-danger">{fieldErrors.email[0]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" placeholder="••••••••" type="password" />
          {fieldErrors.password ? <p className="text-sm text-danger">{fieldErrors.password[0]}</p> : null}
        </div>

        <Button fullWidth loading={isPending || isSubmitting} size="lg" type="submit">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        New to TaskFlow?{" "}
        <Link className="font-semibold text-primary hover:text-accent" href="/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}
