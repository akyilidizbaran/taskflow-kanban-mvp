import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  MoveHorizontal,
  SquareKanban,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "Boards",
    description: "Owner-scoped workspaces for each initiative.",
    icon: LayoutDashboard,
  },
  {
    title: "Drag flow",
    description: "Cards move cleanly between lanes and keep order.",
    icon: MoveHorizontal,
  },
  {
    title: "Persistent order",
    description: "Refresh-safe ordering backed by Supabase.",
    icon: SquareKanban,
  },
] as const;

const previewColumns = [
  {
    title: "To do",
    cards: ["Finalize signup copy", "Add board ownership policy"],
  },
  {
    title: "In progress",
    cards: ["Tune drag handle feedback", "Refine dashboard spacing"],
  },
  {
    title: "Done",
    cards: ["Persist card order", "Protect board routes"],
  },
] as const;

function CtaLink({
  children,
  href,
  primary,
}: {
  children: React.ReactNode;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition ${
        primary
          ? "bg-[linear-gradient(135deg,#1d4ed8_0%,#0f766e_100%)] text-primary-foreground shadow-[0_18px_38px_-24px_rgba(29,78,216,0.62)] hover:brightness-[1.02]"
          : "border border-border bg-white/84 text-foreground hover:bg-surface-muted"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-4 md:px-6 md:py-5">
      <section className="hero-shell surface-panel w-full overflow-hidden rounded-[34px] px-5 py-5 md:px-8 md:py-7 lg:px-9 lg:py-8">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="section-kicker">TaskFlow</div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="glass-badge">Persistent ordering</span>
            <span className="glass-badge">Touch-ready lanes</span>
          </div>
        </div>

        <div className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)] lg:items-center">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="section-kicker">Focused project operating surface</div>
              <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-[0.98] text-foreground sm:text-5xl xl:text-6xl">
                A cleaner Kanban workspace that fits in one glance.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-[1.05rem]">
                TaskFlow keeps the core workflow disciplined: sign in, create a board, move work across lanes, and preserve card order without cluttering the surface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/register" primary>
                Create account
                <ArrowRight className="size-4" />
              </CtaLink>
              <CtaLink href="/login">Log in</CtaLink>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Owner-only boards",
                "Compact lanes & cards",
                "Refresh-safe drag flow",
              ].map((item) => (
                <div className="metric-tile flex min-h-0 items-start gap-3 rounded-[20px] px-4 py-3.5" key={item}>
                  <CheckCircle2 className="mt-0.5 size-4 text-accent" />
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map(({ description, icon: Icon, title }) => (
                <article className="rounded-[22px] border border-border/72 bg-white/74 px-4 py-3.5" key={title}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-2xl bg-surface-muted text-primary">
                      <Icon className="size-[17px]" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
                      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="workspace-shell p-3 md:p-4">
            <div className="workspace-rail rounded-[26px] border border-border/70 bg-white/86 p-4">
              <div className="flex items-center justify-between gap-3 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Preview board</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">Product launch</h2>
                </div>
                <div className="glass-badge">3 lanes</div>
              </div>

              <div className="soft-divider mt-1 pt-3">
                <div className="grid gap-3 md:grid-cols-3">
                  {previewColumns.map((column) => (
                    <div className="rounded-[22px] border border-border/72 bg-surface-muted/55 p-3" key={column.title}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {column.cards.length}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {column.cards.map((card) => (
                          <div className="surface-card rounded-[18px] px-3 py-2.5" key={card}>
                            <p className="text-[13px] font-medium leading-5 text-foreground">{card}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-3">
                {[
                  ["Boards", "Project-level ownership"],
                  ["Cards", "Fast edit in place"],
                  ["Order", "Persists after refresh"],
                ].map(([label, value]) => (
                  <div className="rounded-[18px] border border-border/72 bg-white/78 px-3.5 py-3" key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{label}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
