"use client"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { useTransactions } from "@/hooks/use-transactions"
import { CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { FadeInUp } from "@/components/ui/animation"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

function formatCurrency(v: number) {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  return (v < 0 ? "-R$ " : "R$ ") + formatted
}

export default function TransacoesPage() {
  const { filter, openModal } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<"all" | "confirmed" | "pending">("all")

  const { data, isLoading } = useTransactions({
    type: filter.type === "despesa" ? "EXPENSE" : filter.type === "receita" ? "INCOME" : undefined,
    search: filter.searchQuery || undefined,
  })

  const transactions = (data?.items ?? []).filter((t) => {
    if (activeFilter === "confirmed" && t.status !== "confirmed") return false
    if (activeFilter === "pending" && t.status !== "pending") return false
    return true
  })

  return (
    <div className="p-4 lg:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar transações..."
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              value={filter.searchQuery}
              onChange={(e) => useAppStore.getState().setFilter({ searchQuery: e.target.value })}
            />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            onClick={() => openModal("filter")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1.5">
          {(["all", "confirmed", "pending"] as const).map((key) => {
            const labels = { all: "Todas", confirmed: "Confirmadas", pending: "Pendentes" }
            return (
              <Button
                key={key}
                variant={activeFilter === key ? "default" : "secondary"}
                size="sm"
                className="text-[12px]"
                onClick={() => setActiveFilter(key)}
              >
                {labels[key]}
              </Button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 p-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </FadeInUp>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Tente ajustar os filtros ou registre uma nova transação."
          actionLabel="Nova transação"
          onAction={() => openModal("new-transaction")}
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border/60 px-5 pb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              <span>Transação</span>
              <span>Categoria</span>
              <span>Data</span>
              <span>Origem</span>
              <span className="text-right">Valor</span>
            </div>

            <div className="divide-y divide-border/60">
              {transactions.map((t) => {
                const cat = CATEGORIES.find((c) => c.name === t.category)
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      openModal("transaction-detail", {
                        id: t.id,
                        name: t.name,
                        category: t.category,
                        amount: t.amount,
                        date: t.date,
                        source: t.source as "manual" | "auto" | "whatsapp",
                        status: t.status as "confirmed" | "pending",
                      })
                    }
                    className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px]"
                        style={{ backgroundColor: `${cat?.color}14` }}
                      >
                        {cat?.emoji}
                      </span>
                      <span className="truncate text-[13px] font-semibold">{t.name}</span>
                    </div>
                    <span className="text-[13px] text-muted-foreground">{t.category}</span>
                    <span className="text-[13px] text-muted-foreground">{t.date}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {t.source === "whatsapp" ? "WhatsApp" : t.source === "auto" ? "Auto" : "Manual"}
                    </span>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-heading text-[13px] font-semibold tracking-tight",
                          t.amount < 0 ? "text-danger" : "text-success"
                        )}
                      >
                        {formatCurrency(t.amount)}
                      </span>
                      {t.status === "pending" && (
                        <Badge className="ml-1.5 border-0 bg-warning/15 text-warning hover:bg-warning/25 [&]:text-[9px] [&]:px-1.5 [&]:py-0">
                          pendente
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2 lg:hidden">
            {transactions.map((t) => {
              const cat = CATEGORIES.find((c) => c.name === t.category)
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    openModal("transaction-detail", {
                      id: t.id,
                      name: t.name,
                      category: t.category,
                      amount: t.amount,
                      date: t.date,
                      source: t.source as "manual" | "auto" | "whatsapp",
                      status: t.status as "confirmed" | "pending",
                    })
                  }
                  className="flex w-full items-center gap-2.5 rounded-2xl border border-border/60 bg-card p-3.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                    style={{ backgroundColor: `${cat?.color}18` }}
                  >
                    {cat?.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.category} · {t.date}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-heading text-[13px] font-semibold tracking-tight",
                        t.amount < 0 ? "text-danger" : "text-success"
                      )}
                    >
                      {formatCurrency(t.amount)}
                    </p>
                    {t.status === "pending" && (
                      <Badge className="mt-0.5 border-0 bg-warning/15 text-warning hover:bg-warning/25 [&]:text-[9px] [&]:px-1.5 [&]:py-0">
                        pendente
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
