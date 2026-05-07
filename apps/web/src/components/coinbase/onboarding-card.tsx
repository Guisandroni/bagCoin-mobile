"use client"

import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingCardProps {
  eyebrow?: string
  title: string
  description?: string
  completedSteps: number
  totalSteps: number
  onViewAll?: () => void
  viewAllHref?: string
  className?: string
}

export function OnboardingCard({
  eyebrow = "Comece aqui",
  title,
  description,
  completedSteps,
  totalSteps,
  onViewAll,
  viewAllHref,
  className,
}: OnboardingCardProps) {
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const action =
    viewAllHref && !onViewAll ? (
      <Link
        href={viewAllHref}
        className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        Ver todos os passos
      </Link>
    ) : onViewAll ? (
      <Button variant="link" className="h-auto p-0 text-sm font-semibold text-primary" type="button" onClick={onViewAll}>
        Ver todos os passos
      </Button>
    ) : null

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
          <h3 className="section-title mt-1">{title}</h3>
          {description ? <p className="mt-2 text-[14px] text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[12px] font-semibold">
          <span className="text-muted-foreground">Progresso</span>
          <span>
            {completedSteps}/{totalSteps}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </div>
  )
}
