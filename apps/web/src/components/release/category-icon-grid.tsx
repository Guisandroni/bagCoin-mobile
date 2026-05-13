"use client"

import { cn } from "@/lib/utils"
import { getCategoryLucideIcon } from "@/lib/category"
import type { ReleaseCategoryType } from "./types"

interface CategoryOption {
  value: ReleaseCategoryType
  label: string
  icon: React.ReactNode
}

function getGoalCategoryOptions(): CategoryOption[] {
  const categories: { value: ReleaseCategoryType; label: string }[] = [
    { value: "viagem", label: "Viagem" },
    { value: "veiculo", label: "Veículo" },
    { value: "casa", label: "Casa" },
    { value: "outro", label: "Outro" },
  ]
  return categories.map((c) => {
    const Icon = getCategoryLucideIcon(c.label)
    return { ...c, icon: <Icon className="w-5 h-5" /> }
  })
}

const CATEGORY_OPTIONS: CategoryOption[] = getGoalCategoryOptions()

interface CategoryIconGridProps {
  value?: ReleaseCategoryType
  onChange: (value: ReleaseCategoryType) => void
  options?: CategoryOption[]
  label?: string
  className?: string
}

export function CategoryIconGrid({
  value,
  onChange,
  options = CATEGORY_OPTIONS,
  label = "Categoria",
  className,
}: CategoryIconGridProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="rls-text-label-lg text-[var(--rls-on-background)] ml-1">
          {label}
        </span>
      )}
      <div className="grid grid-cols-4 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-[var(--rls-radius)] transition-all",
              "border-2",
              value === option.value
                ? "border-[var(--rls-primary-container)] bg-[var(--rls-primary-container)]/5"
                : "border-transparent bg-[var(--rls-surface-container)] hover:bg-[var(--rls-surface-container-high)]"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                value === option.value
                  ? "bg-[var(--rls-primary-container)] text-[var(--rls-on-primary)]"
                  : "bg-[var(--rls-surface-container-high)] text-[var(--rls-on-surface-variant)]"
              )}
            >
              {option.icon}
            </div>
            <span
              className={cn(
                "rls-text-label-md",
                value === option.value
                  ? "text-[var(--rls-primary-container)]"
                  : "text-[var(--rls-on-surface-variant)]"
              )}
            >
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}