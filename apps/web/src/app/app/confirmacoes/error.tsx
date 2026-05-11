"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ConfirmacoesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Confirmacoes error:", error)
  }, [error])

  return (
    <div className="p-4 lg:p-7">
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Erro ao carregar</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Não foi possível carregar as confirmações. Tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">Digest: {error.digest}</p>
        )}
        <Button onClick={reset} variant="default">
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
