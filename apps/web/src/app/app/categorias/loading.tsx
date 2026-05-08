import { Skeleton } from "@/components/ui/skeleton"

export default function CategoriasLoading() {
  return (
    <div className="rls p-5 flex flex-col gap-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}