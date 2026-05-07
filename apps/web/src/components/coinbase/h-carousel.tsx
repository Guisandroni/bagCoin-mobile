"use client"

import type { ReactNode } from "react"
import { useId } from "react"
import { cn } from "@/lib/utils"

interface HCarouselProps {
  title?: string
  children: ReactNode
  className?: string
  labelledBy?: string
}

export function HCarousel({ title, children, className, labelledBy }: HCarouselProps) {
  const autoHeadingId = useId()
  const headingId = labelledBy ?? (title ? autoHeadingId : undefined)
  return (
    <section
      role="region"
      aria-labelledby={headingId}
      className={cn("space-y-3", className)}
    >
      {title ? (
        <h3 id={headingId} className="px-0.5 text-[15px] font-bold tracking-tight">
          {title}
        </h3>
      ) : null}
      <div
        className={cn(
          "scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 scroll-pr-4 pb-1 pl-1 pr-4"
        )}
      >
        {children}
      </div>
    </section>
  )
}

export function HCarouselCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "min-w-[260px] max-w-[280px] snap-start rounded-2xl border border-border bg-card p-4 active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  )
}
