"use client"

import { useState } from "react"
import { Search, User } from "lucide-react"
import { AppBar } from "./app-bar"
import { FilterChips } from "./filter-chips"
import { InfoCard } from "./info-card"
import { BottomNavBar } from "./bottom-nav-bar"
import type { ReleaseCategory, ReleaseNavItem } from "./types"
import { cn } from "@/lib/utils"

interface CategoriesViewProps {
  categories: ReleaseCategory[]
  totalAllocated: number
  navItems: ReleaseNavItem[]
  onNavigate: (href: string) => void
  onSearch?: (query: string) => void
}

export function CategoriesView({
  categories,
  totalAllocated,
  navItems,
  onNavigate,
  onSearch,
}: CategoriesViewProps) {
  const [activeFilter, setActiveFilter] = useState("todas")

  const filterOptions = [
    { label: "Todas", value: "todas" as const },
    { label: "Despesas", value: "despesa" as const },
    { label: "Receitas", value: "receita" as const },
    { label: "Investimentos", value: "investimento" as const },
  ]

  const categoryIcons: Record<string, React.ReactNode> = {
    alimentacao: "🍽️",
    moradia: "🏠",
    transporte: "🚗",
    lazer: "🎬",
    saude: "❤️",
  }

  const categoryBgColors: Record<string, string> = {
    alimentacao: "bg-red-100",
    moradia: "bg-blue-100",
    transporte: "bg-green-100",
    lazer: "bg-orange-100",
    saude: "bg-purple-100",
  }

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] pb-24">
      <AppBar
        title="Categorias"
        avatar={
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--rls-surface-variant)] flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--rls-outline)]" />
          </div>
        }
        actions={[{ icon: <Search className="w-6 h-6" />, onClick: () => {} }]}
      />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)]">
        {/* Summary Hero */}
        <InfoCard
          variant="primary"
          title="Total Alocado"
          value={`R$ ${totalAllocated.toLocaleString("pt-BR")}`}
        />

        {/* Filter Chips */}
        <FilterChips
          options={filterOptions}
          selected={activeFilter}
          onChange={setActiveFilter}
        />

        {/* Category List */}
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-[var(--rls-surface-container-lowest)] p-4 rounded-[var(--rls-radius-lg)] shadow-sm flex items-center gap-4"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                  categoryBgColors[cat.name.toLowerCase()] || "bg-[var(--rls-surface-container)]"
                )}
                style={{ backgroundColor: cat.color ? `${cat.color}20` : undefined }}
              >
                {categoryIcons[cat.name.toLowerCase()] || cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="rls-text-body-lg text-[var(--rls-on-surface)] block">
                  {cat.name}
                </span>
                <span className="rls-text-label-md text-[var(--rls-on-surface-variant)]">
                  {cat.type === "despesa" ? `${cat.percentage}% utilizado` : cat.isFixed ? "Fixo" : ""}
                </span>
              </div>
              <span className="rls-text-body-lg text-[var(--rls-on-surface)] font-semibold">
                R$ {cat.allocated.toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </div>
      </main>

      <BottomNavBar items={navItems} onNavigate={onNavigate} />
    </div>
  )
}