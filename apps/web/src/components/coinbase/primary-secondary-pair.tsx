"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PrimarySecondaryPairProps {
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
  className?: string
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
}

export function PrimarySecondaryPair({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  className,
  primaryDisabled,
  secondaryDisabled,
}: PrimarySecondaryPairProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        className
      )}
    >
      <Button
        type="button"
        size="lg"
        className="h-12 rounded-full font-semibold shadow-none"
        onClick={onPrimary}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </Button>
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="h-12 rounded-full border-0 bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] font-semibold text-primary shadow-none hover:bg-[color-mix(in_oklch,var(--primary)_18%,transparent)]"
        onClick={onSecondary}
        disabled={secondaryDisabled}
      >
        {secondaryLabel}
      </Button>
    </div>
  )
}
