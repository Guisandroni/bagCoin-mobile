"use client"

import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  title = "Nenhum item encontrado",
  description = "Não há dados para exibir no momento.",
  actionLabel,
  onAction,
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-[15px] font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}