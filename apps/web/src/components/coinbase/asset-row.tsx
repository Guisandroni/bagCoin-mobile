"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssetRowProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  trailing?: ReactNode
  amount?: ReactNode
  onClick?: () => void
  href?: string
  className?: string
}

export function AssetRow({
  icon,
  title,
  subtitle,
  trailing,
  amount,
  onClick,
  href,
  className,
}: AssetRowProps) {
  const rowClass = cn(
    "flex w-full min-h-[56px] items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-left transition-colors active:bg-muted/60"
  )

  const inner = (
    <>
      {icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {amount ? <div className="text-right">{amount}</div> : null}
        {trailing}
        {onClick || href ? (
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn(rowClass, className)}>
        {inner}
      </Link>
    )
  }

  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(rowClass, "cursor-pointer", className)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
          }
        }}
      >
        {inner}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-[56px] items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5",
        className
      )}
    >
      {inner}
    </div>
  )
}
