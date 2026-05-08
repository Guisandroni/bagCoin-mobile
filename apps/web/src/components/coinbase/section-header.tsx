import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  right?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  onAction,
  right,
  className,
}: SectionHeaderProps) {
  const link =
    actionHref && actionLabel ? (
      <Link
        href={actionHref}
        className="inline-flex min-h-[44px] items-center gap-0.5 text-sm font-semibold text-primary"
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    ) : onAction && actionLabel ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex min-h-[44px] items-center gap-0.5 text-sm font-semibold text-primary"
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    ) : null

  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <h2 className="section-title">{title}</h2>
      <div className="flex shrink-0 items-center gap-2">{right ?? link}</div>
    </div>
  )
}
