import { Skeleton } from "@/components/ui/skeleton"

export default function OrcamentosLoading() {
  return (
    <div className="page-in space-y-5 pb-28 lg:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}
