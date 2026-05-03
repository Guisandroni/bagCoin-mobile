"use client"

import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

const TITLES: Record<string, string> = {
  "/app": "Visão geral",
  "/app/transacoes": "Transações",
  "/app/contas": "Contas",
  "/app/configuracoes": "Configurações",
}

export function TopBar() {
  const pathname = usePathname()
  const openModal = useAppStore((s) => s.openModal)
  const title = TITLES[pathname] || "Bagcoin"

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
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
          onClick={() => openModal("new-transaction")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo lançamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
    </header>
  )
}