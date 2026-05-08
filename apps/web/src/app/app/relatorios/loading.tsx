import { Skeleton } from "@/components/ui/skeleton"

export default function RelatoriosLoading() {
  return (
    <div className="page-in space-y-5 pb-28 lg:pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />
      ))}
    </div>
  )
}
