import { Skeleton } from "@/components/ui/skeleton"

export default function ConfiguracoesLoading() {
  return (
    <div className="p-4 lg:p-7 space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
