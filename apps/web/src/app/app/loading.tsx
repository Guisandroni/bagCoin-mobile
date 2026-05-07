export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
          </div>

        </div>
        {/* Balance card skeleton */}
        <div className="h-[200px] animate-pulse rounded-2xl bg-muted" />
        {/* Stat cards skeleton */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        {/* Content skeletons */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
          <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
