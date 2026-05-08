import { FadeInUp } from "@/components/ui/animation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContasLoading() {
  return (
    <div className="p-4 lg:p-7">
      <FadeInUp>
        <div className="mb-6 rounded-2xl bg-[#0a0b0d] p-6 lg:p-7">
          <Skeleton className="h-3 w-28 bg-white/10" />
          <Skeleton className="mt-3 h-9 w-48 bg-white/10" />
          <Skeleton className="mt-1 h-3 w-32 bg-white/10" />
        </div>
        <div className="mb-8">
          <Skeleton className="mb-4 h-5 w-20" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl border-border/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="mt-3 h-6 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-muted p-5">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="mt-4 h-3 w-24" />
                <Skeleton className="mt-1 h-6 w-32" />
                <Skeleton className="mt-3 h-1.5 w-full" />
                <div className="mt-2 flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInUp>
    </div>
  )
}
