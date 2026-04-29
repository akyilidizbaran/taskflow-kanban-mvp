export default function BoardLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-6">
        <div className="surface-panel h-60 animate-pulse rounded-[30px]" />
        <div className="flex gap-4 overflow-hidden">
          <div className="surface-panel h-[34rem] min-w-[20rem] animate-pulse rounded-[28px]" />
          <div className="surface-panel h-[34rem] min-w-[20rem] animate-pulse rounded-[28px]" />
          <div className="surface-panel h-[34rem] min-w-[20rem] animate-pulse rounded-[28px]" />
        </div>
      </div>
    </main>
  );
}
