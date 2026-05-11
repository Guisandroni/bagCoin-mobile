"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const TITLES: Record<string, string> = {
  "/app": "Visão geral",
  "/app/transacoes": "Transações",
  "/app/orcamentos": "Orçamentos",
  "/app/metas": "Metas",
  "/app/categorias": "Categorias",
  "/app/relatorios": "Relatórios",
  "/app/contas": "Contas",
  "/app/confirmacoes": "Confirmações",
  "/app/configuracoes": "Configurações",
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const title = TITLES[pathname] || "Bagcoin"

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="hidden text-[13px] sm:inline-flex"
        >
          Exportar
        </Button>
        <Button
          size="sm"
          className="gap-1.5 text-[13px]"
          onClick={() => router.push("/app/transacoes")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo lançamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
    </header>
  )
}
