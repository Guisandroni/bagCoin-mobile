import { Skeleton } from "@/components/ui/skeleton"

export default function TransacoesLoading() {
  return (
    <div className="page-in space-y-4 pb-28 lg:pb-10">
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-10 w-40 rounded-full" />
      <Skeleton className="h-5 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] w-full rounded-2xl" />
      ))}
      <Skeleton className="h-5 w-20" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={`b-${i}`} className="h-[68px] w-full rounded-2xl" />
      ))}
    </div>
  )
}
