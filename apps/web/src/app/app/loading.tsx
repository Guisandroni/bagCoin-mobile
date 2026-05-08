import { Skeleton } from "@/components/ui/skeleton"

/** Matches dashboard Coinbase column: hero balance + rows + carousel peek + sections */
export default function Loading() {
  return (
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-4 p-5">
          <Skeleton className="mx-auto h-4 w-32" />
          <Skeleton className="mx-auto h-12 w-48" />
          <Skeleton className="h-[140px] w-full rounded-xl bg-muted" />
          <div className="flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-11 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[120px] w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] min-w-[260px] shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[64px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
