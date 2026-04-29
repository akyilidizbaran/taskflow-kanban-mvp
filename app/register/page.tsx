import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <p className="section-kicker">TaskFlow</p>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              Build a clean Kanban workflow in a single session.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Start with one board, add columns and cards, then drag everything into the right order without losing state on refresh.
            </p>
          </div>
          <div className="workspace-shell p-5">
            <div className="space-y-3">
              {[
                "Quick email and password onboarding",
                "Mobile-friendly board lanes with horizontal scroll",
                "A deploy-ready MVP tuned for Vercel",
              ].map((feature) => (
                <div className="flex items-start gap-3" key={feature}>
                  <CheckCircle2 className="mt-0.5 size-4 text-accent" />
                  <p className="text-sm leading-6 text-foreground">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RegisterForm />
      </div>
    </main>
  );
}
