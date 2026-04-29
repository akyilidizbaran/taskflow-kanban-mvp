export default function DashboardLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-6">
        <div className="surface-panel h-52 animate-pulse rounded-[30px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="surface-card h-64 animate-pulse rounded-[28px]" />
          <div className="surface-card h-64 animate-pulse rounded-[28px]" />
          <div className="surface-card h-64 animate-pulse rounded-[28px]" />
        </div>
      </div>
    </main>
  );
}
