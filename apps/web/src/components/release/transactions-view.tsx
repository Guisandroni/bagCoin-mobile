"use client"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { AppBar } from "./app-bar"
import { FilterChips } from "./filter-chips"
import { PillInput } from "./pill-input"
import { BottomNavBar } from "./bottom-nav-bar"
import { cn } from "@/lib/utils"
import type { ReleaseTransaction, ReleaseFilterPeriod, ReleaseNavItem } from "./types"

interface TransactionsViewProps {
  transactions: ReleaseTransaction[]
  totalSpent: number
  totalReceived: number
  navItems: ReleaseNavItem[]
  onNavigate: (href: string) => void
  onSearch?: (query: string) => void
}

const transactionIcons: Record<string, React.ReactNode> = {
  alimentacao: "🍽️",
  transporte: "🚕",
  receita: "💰",
  compras: "🛍️",
  lazer: "🎬",
  restaurantes: "☕",
  saude: "❤️",
}

export function TransactionsView({
  transactions,
  totalSpent,
  totalReceived,
  navItems,
  onNavigate,
}: TransactionsViewProps) {
  const [activeFilter, setActiveFilter] = useState<ReleaseFilterPeriod>("todo")
  const [searchQuery, setSearchQuery] = useState("")

  const filterOptions: { label: string; value: ReleaseFilterPeriod }[] = [
    { label: "Todo o tempo", value: "todo" },
    { label: "1D", value: "1d" },
    { label: "1S", value: "1s" },
    { label: "1M", value: "1m" },
    { label: "Filtros", value: "todo" },
  ]

  const grouped = transactions.reduce<Record<string, ReleaseTransaction[]>>(
    (acc, tx) => {
      const group = tx.date.includes("hoje") || tx.date.includes("Hoje")
        ? "Hoje"
        : tx.date.includes("ontem") || tx.date.includes("Ontem")
          ? "Ontem"
          : tx.date
      if (!acc[group]) acc[group] = []
      acc[group].push(tx)
      return acc
    },
    {}
  )

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] pb-24">
      <AppBar
        title="Financial Hub"
        titleClassName="rls-text-display-md text-[var(--rls-primary-container)]"
        avatar={
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--rls-surface-variant)] flex items-center justify-center">
            <span className="text-[var(--rls-on-surface-variant)]">👤</span>
          </div>
        }
        actions={[
          {
            icon: (
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Search className="w-5 h-5 text-[var(--rls-primary)]" />
              </div>
            ),
            onClick: () => {},
          },
        ]}
      />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-md)] pt-[var(--rls-stack-gap-sm)]">
        {/* Search Bar */}
        <PillInput
          icon={<Search className="w-5 h-5" />}
          placeholder="Buscar transações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filter Chips */}
        <FilterChips
          options={filterOptions}
          selected={activeFilter}
          onChange={setActiveFilter}
        />

        {/* Insights Banner */}
        <div className="bg-[var(--rls-surface-container-lowest)] rounded-[var(--rls-radius-lg)] p-[var(--rls-inline-padding-md)] shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="rls-text-title-lg text-[var(--rls-on-surface)]">
              Visão Mensal
            </span>
            <button className="text-[var(--rls-on-surface-variant)]">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="rls-text-body-lg text-[var(--rls-on-surface)]">
              Total Gasto:{" "}
              <span className="text-[var(--rls-error)]">
                R$ {totalSpent.toLocaleString("pt-BR")}
              </span>
            </span>
            <span className="rls-text-body-lg text-[var(--rls-on-surface)]">
              Total Recebido:{" "}
              <span className="text-green-600">
                R$ {totalReceived.toLocaleString("pt-BR")}
              </span>
            </span>
          </div>
        </div>

        {/* Transaction Groups */}
        {Object.entries(grouped).map(([dateLabel, txs]) => (
          <div key={dateLabel} className="flex flex-col gap-2">
            <h3 className="rls-text-label-lg text-[var(--rls-on-surface-variant)] sticky top-0 bg-[var(--rls-background)] py-2 z-10 uppercase">
              {dateLabel}
            </h3>
            <div className="flex flex-col">
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center h-[72px] border-b border-[var(--rls-surface-variant)] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        tx.type === "receita"
                          ? "bg-green-100"
                          : "bg-[var(--rls-surface-container)]"
                      )}
                    >
                      {transactionIcons[tx.category] || tx.categoryIcon || "💳"}
                    </div>
                    <div className="flex flex-col">
                      <span className="rls-text-body-lg text-[var(--rls-on-surface)]">
                        {tx.name}
                      </span>
                      <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rls-text-body-lg font-semibold",
                      tx.type === "receita"
                        ? "text-green-600"
                        : "text-[var(--rls-on-surface)]"
                    )}
                  >
                    {tx.type === "receita" ? "+" : "-"}R${" "}
                    {Math.abs(tx.amount).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      <BottomNavBar items={navItems} onNavigate={onNavigate} />
    </div>
  )
}