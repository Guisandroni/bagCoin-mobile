"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FilterChipProps {
  label: string
  children: ReactNode
  className?: string
  /** Accessible name for the trigger (defaults to label). */
  ariaLabel?: string
}

export function FilterChip({ label, children, className, ariaLabel }: FilterChipProps) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={ariaLabel ?? label}
        className={cn(
          "touch-target inline-flex items-center gap-1 rounded-full border border-border bg-muted/80 px-3 text-[13px] font-semibold text-foreground",
          className
        )}
      >
        {label}
        <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[200px] p-2">
        {children}
      </PopoverContent>
    </Popover>
  )
}
