"use client"

import { cn } from "@/lib/utils"
import type { ReleaseBudgetType } from "./types"

interface SegmentToggleProps {
  value: ReleaseBudgetType
  onChange: (value: ReleaseBudgetType) => void
  metaLabel?: string
  budgetLabel?: string
}

export function SegmentToggle({
  value,
  onChange,
  metaLabel = "Meta de Economia",
  budgetLabel = "Orçamento de Gasto",
}: SegmentToggleProps) {
  return (
    <div className="flex bg-[var(--rls-surface-container)] rounded-[var(--rls-radius-pill)] p-1">
      <button
        onClick={() => onChange("meta")}
        className={cn(
          "flex-1 py-3 px-4 rounded-[var(--rls-radius-pill)] rls-text-label-lg transition-all",
          value === "meta"
            ? "bg-[var(--rls-primary-container)] text-[var(--rls-on-primary)] shadow-md"
            : "text-[var(--rls-on-surface-variant)] hover:bg-[var(--rls-surface-container-high)]"
        )}
      >
        {metaLabel}
      </button>
      <button
        onClick={() => onChange("orcamento")}
        className={cn(
          "flex-1 py-3 px-4 rounded-[var(--rls-radius-pill)] rls-text-label-lg transition-all",
          value === "orcamento"
            ? "bg-[var(--rls-primary-container)] text-[var(--rls-on-primary)] shadow-md"
            : "text-[var(--rls-on-surface-variant)] hover:bg-[var(--rls-surface-container-high)]"
        )}
      >
        {budgetLabel}
      </button>
    </div>
  )
}