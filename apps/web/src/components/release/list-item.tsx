"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ListItemProps {
  icon: ReactNode
  iconBg?: string
  title: string
  description?: string
  onClick?: () => void
  trailing?: ReactNode
  className?: string
}

export function ListItem({
  icon,
  iconBg = "bg-[var(--rls-primary-container)]/10",
  title,
  description,
  onClick,
  trailing,
  className,
}: ListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-[var(--rls-radius)]",
        "bg-[var(--rls-surface-container-lowest)] hover:bg-[var(--rls-surface-container-low)]",
        "transition-colors text-left",
        className
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="rls-text-body-lg text-[var(--rls-on-surface)] block">
          {title}
        </span>
        {description && (
          <span className="rls-text-body-md text-[var(--rls-on-surface-variant)] block">
            {description}
          </span>
        )}
      </div>
      {trailing || (
        <ChevronRight className="w-5 h-5 text-[var(--rls-outline)] shrink-0" />
      )}
    </button>
  )
}