import { Skeleton } from "@/components/ui/skeleton"

export default function MetasLoading() {
  return (
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-3 h-10 w-40" />
        <Skeleton className="mt-4 h-[120px] w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="min-h-[88px] w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="flex gap-3 overflow-hidden pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`c-${i}`} className="h-[100px] min-w-[200px] shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
