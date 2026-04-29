import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
      <div className="surface-panel w-full rounded-[32px] px-6 py-12 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">404</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold text-foreground">Board not found</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          The board may have been removed, or you might not have access to it with the current account.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-[#102947]"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
            href="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
