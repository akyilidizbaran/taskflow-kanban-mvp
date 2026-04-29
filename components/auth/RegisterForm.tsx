"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const registerSchema = z.object({
  fullName: z.string().trim().max(80, "Full name must be 80 characters or fewer.").optional(),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
});

export function RegisterForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const validated = registerSchema.safeParse(values);

    if (!validated.success) {
      setFieldErrors(validated.error.flatten().fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        data: {
          full_name: validated.data.fullName || null,
        },
      },
    });

    if (error) {
      setFormError(toErrorMessage(error, "We could not create your account."));
      setIsSubmitting(false);
      return;
    }

    startTransition(() => {
      if (data.session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login?message=Account created. Check your email to confirm it before signing in.");
      }

      router.refresh();
    });
  }

  return (
    <div className="surface-panel w-full max-w-md rounded-[32px] border border-white/60 p-7 shadow-[0_30px_72px_-44px_rgba(15,23,42,0.34)] md:p-8">
      <div className="space-y-2">
        <p className="section-kicker">Get started</p>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Create your TaskFlow account</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Set up a focused project board in minutes and keep card order persistent.
        </p>
      </div>

      {formError ? (
        <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {formError}
        </div>
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="fullName">
            Full name <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input id="fullName" name="fullName" placeholder="Alex Johnson" />
          {fieldErrors.fullName ? <p className="text-sm text-danger">{fieldErrors.fullName[0]}</p> : null}
        </div>

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
          <Input id="password" name="password" placeholder="Use at least 8 characters" type="password" />
          {fieldErrors.password ? <p className="text-sm text-danger">{fieldErrors.password[0]}</p> : null}
        </div>

        <Button fullWidth loading={isPending || isSubmitting} size="lg" type="submit">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-primary hover:text-accent" href="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
