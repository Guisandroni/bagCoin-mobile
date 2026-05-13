"use client"

import { cn } from "@/lib/utils"

interface FilterChipsProps<T extends string> {
  options: { label: string; value: T }[]
  selected: T
  onChange: (value: T) => void
  className?: string
}

export function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-[var(--rls-radius-pill)] rls-text-label-lg transition-all whitespace-nowrap",
            selected === option.value
              ? "bg-[var(--rls-primary-container)] text-white"
              : "bg-[var(--rls-surface-container)] text-[var(--rls-on-surface-variant)] hover:bg-[var(--rls-surface-container-high)]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}