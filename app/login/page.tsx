import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath =
    resolvedSearchParams.next && resolvedSearchParams.next.startsWith("/")
      ? resolvedSearchParams.next
      : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <p className="section-kicker">TaskFlow</p>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Sign in and get straight back to the board.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              TaskFlow keeps project work lightweight: boards, columns, cards, and persistent drag-and-drop ordering.
            </p>
          </div>
          <div className="workspace-shell p-5">
            <div className="space-y-3">
              {[
                "One clean board per project stream",
                "Fast card editing without leaving the page",
                "Persistent card order backed by Supabase",
              ].map((feature) => (
                <div className="flex items-start gap-3" key={feature}>
                  <CheckCircle2 className="mt-0.5 size-4 text-accent" />
                  <p className="text-sm leading-6 text-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LoginForm initialMessage={resolvedSearchParams.message} nextPath={nextPath} />
      </div>
    </main>
  );
}
