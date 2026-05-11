"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Register error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-sm">
        <h1 className="text-2xl font-bold text-foreground">Erro ao carregar</h1>
        <p className="text-muted-foreground">
          Não foi possível carregar a página de registro. Tente novamente.
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
