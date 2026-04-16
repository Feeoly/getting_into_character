/** 进入会话详情时的即时占位，避免点击后「空窗」感 */
export default function SessionDetailLoading() {
  return (
    <main className="px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-9 w-28 animate-pulse rounded-md bg-ink/10" />
            <div className="h-7 w-24 animate-pulse rounded-md bg-ink/10" />
            <div className="h-10 max-w-xl animate-pulse rounded-md bg-ink/10" />
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-ink/10" />
          <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-ink/10" />
        </div>
      </div>
    </main>
  );
}
