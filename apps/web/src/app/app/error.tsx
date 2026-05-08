"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-foreground">Erro no painel</h2>
        <p className="text-muted-foreground max-w-md">
          Ocorreu um erro ao carregar o painel. Tente novamente.
        </p>
        <Button onClick={reset} variant="default">
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
