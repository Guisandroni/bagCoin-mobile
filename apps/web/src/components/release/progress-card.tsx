"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ProgressCardProps {
  title: string
  subtitle?: string
  current: number
  target: number
  percentage: number
  color?: string
  remainingText?: string
  icon?: ReactNode
  iconBg?: string
  className?: string
}

const defaultColors: Record<string, string> = {
  blue: "bg-[var(--rls-primary-container)]",
  red: "bg-[var(--rls-error)]",
  green: "bg-[var(--rls-secondary-container)]",
  pink: "bg-[var(--rls-tertiary-container)]",
  gray: "bg-[var(--rls-outline)]",
}

export function ProgressCard({
  title,
  subtitle,
  current,
  target,
  percentage,
  color = "blue",
  remainingText,
  icon,
  iconBg,
  className,
}: ProgressCardProps) {
  const barColor = defaultColors[color] || defaultColors.blue

  return (
    <div
      className={cn(
        "bg-[var(--rls-surface-container-lowest)] p-[var(--rls-inline-padding-md)] rounded-[var(--rls-radius-lg)]",
        "shadow-sm flex flex-col gap-[var(--rls-stack-gap-sm)]",
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                iconBg || "bg-[var(--rls-surface-container)]"
              )}
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <span className="rls-text-body-lg text-[var(--rls-on-surface)]">{title}</span>
            {subtitle && (
              <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <span className="rls-text-body-lg text-[var(--rls-on-surface)]">
          R$ {current.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}{" "}
          <span className="text-[var(--rls-on-surface-variant)]">
            / R$ {target.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </span>
        </span>
        <span
          className={cn(
            "rls-text-label-lg",
            percentage >= 90
              ? "text-[var(--rls-error)]"
              : "text-[var(--rls-primary-container)]"
          )}
        >
          {percentage}%
        </span>
      </div>

      <div className="w-full h-2 bg-[var(--rls-surface-container-high)] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {remainingText && (
        <span
          className={cn(
            "rls-text-label-md",
            percentage >= 90
              ? "text-[var(--rls-error)]"
              : "text-[var(--rls-on-surface-variant)]"
          )}
        >
          {remainingText}
        </span>
      )}
    </div>
  )
}