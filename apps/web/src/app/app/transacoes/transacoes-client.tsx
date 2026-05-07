"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { CATEGORIES } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { AssetRow, FilterChip } from "@/components/coinbase"
import type { Transaction } from "@/types"

interface TransacoesClientProps {
  transactions: Transaction[]
}

function parseTxDate(dateStr: string): Date {
  const trimmed = dateStr.trim()
  const iso = Date.parse(trimmed)
  if (!Number.isNaN(iso)) return new Date(iso)
  const parts = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (parts) {
    const [, d, m, y] = parts
    return new Date(Number(y), Number(m) - 1, Number(d))
  }
  return new Date(0)
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDayLabel(d: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const cmp = new Date(d)
  cmp.setHours(0, 0, 0, 0)
  if (cmp.getTime() === today.getTime()) return "Hoje"
  if (cmp.getTime() === yesterday.getTime()) return "Ontem"
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(d)
}

export default function TransacoesClient({ transactions: initialTransactions }: TransacoesClientProps) {
  const searchParams = useSearchParams()
  const { filter, openModal } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<"all" | "confirmed" | "pending">("all")

  useEffect(() => {
    const s = searchParams?.get("search")
    if (s) {
      useAppStore.getState().setFilter({ searchQuery: decodeURIComponent(s) })
    }
  }, [searchParams])

  const transactions = useMemo(() => {
    return initialTransactions.filter((t) => {
      if (filter.type === "despesa" && t.amount >= 0) return false
      if (filter.type === "receita" && t.amount < 0) return false

      if (filter.searchQuery && !t.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
        return false
      }

      if (activeFilter === "confirmed" && t.status !== "confirmed") return false
      if (activeFilter === "pending" && t.status !== "pending") return false

      return true
    })
  }, [initialTransactions, filter.type, filter.searchQuery, activeFilter])

  const groups = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => parseTxDate(b.date).getTime() - parseTxDate(a.date).getTime()
    )
    const map = new Map<string, Transaction[]>()
    for (const t of sorted) {
      const d = parseTxDate(t.date)
      const key = dayKey(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    const orderedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a))
    return orderedKeys.map((key) => ({
      key,
      label: formatDayLabel(parseTxDate(map.get(key)![0].date)),
      items: map.get(key)!,
    }))
  }, [transactions])

  const statusLabels = { all: "Todas", confirmed: "Confirmadas", pending: "Pendentes" }
  const statusFilterLabel = statusLabels[activeFilter]

  return (
    <div className="page-in space-y-4 pb-28 lg:pb-10">
      <h1 className="section-title">Transações</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar transações..."
            className="h-11 w-full rounded-full border border-border bg-muted/80 pl-10 pr-4 text-[14px] shadow-none"
            value={filter.searchQuery}
            onChange={(e) => useAppStore.getState().setFilter({ searchQuery: e.target.value })}
            aria-label="Buscar transações"
          />
        </div>
        <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-end">
          <FilterChip label={statusFilterLabel} ariaLabel="Filtrar por status da transação">
            <div className="flex flex-col gap-0.5 p-1">
              {(["all", "confirmed", "pending"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                    activeFilter === key && "bg-[var(--primary-tint)] font-semibold text-primary"
                  )}
                  onClick={() => setActiveFilter(key)}
                >
                  {statusLabels[key]}
                </button>
              ))}
            </div>
          </FilterChip>
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={() => openModal("filter")}
            aria-label="Mais filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Tente ajustar os filtros ou registre uma nova transação."
          actionLabel="Nova transação"
          onAction={() => openModal("new-transaction")}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ key, label, items }) => (
            <section key={key} className="space-y-2">
              <div className="sticky top-0 z-10 -mx-1 border-b border-border/40 bg-background/90 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {label}
                </p>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const cat = CATEGORIES.find((c) => c.name === t.category)
                  const sourceLabel =
                    t.source === "whatsapp" ? "WhatsApp" : t.source === "auto" ? "Auto" : "Manual"
                  return (
                    <AssetRow
                      key={t.id}
                      icon={
                        <span
                          className="flex h-full w-full items-center justify-center text-[16px]"
                          style={
                            cat?.color ? { backgroundColor: `${cat.color}22` } : undefined
                          }
                        >
                          {cat?.emoji ?? (t.amount >= 0 ? "📥" : "📤")}
                        </span>
                      }
                      title={t.name}
                      subtitle={`${t.category} · ${t.date} · ${sourceLabel}`}
                      trailing={
                        t.status === "pending" ? (
                          <Badge className="border-0 bg-warning/15 text-[10px] text-warning hover:bg-warning/25">
                            pendente
                          </Badge>
                        ) : undefined
                      }
                      amount={
                        <span
                          className={cn(
                            "row-amount",
                            t.amount < 0 ? "text-danger" : "text-success"
                          )}
                        >
                          {formatCurrency(t.amount)}
                        </span>
                      }
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
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
