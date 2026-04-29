"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
      <div className="surface-panel w-full rounded-[32px] px-6 py-12 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Something went wrong</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">
          We hit a temporary problem
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          The action could not be completed right now. Try again or return to the dashboard.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Button onClick={() => (window.location.href = "/dashboard")} variant="secondary">
            Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
