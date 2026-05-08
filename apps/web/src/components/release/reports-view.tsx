"use client"

import { useState } from "react"
import { ArrowLeft, MoreVertical, Download, CheckCircle, Archive } from "lucide-react"
import { AppBar, AppBarMoreAction } from "./app-bar"
import { FilterChips } from "./filter-chips"
import { BottomNavBar } from "./bottom-nav-bar"
import { cn } from "@/lib/utils"
import type { ReleaseReport, ReleaseNavItem } from "./types"

interface ReportsViewProps {
  reports: ReleaseReport[]
  navItems: ReleaseNavItem[]
  onBack?: () => void
  onNavigate: (href: string) => void
  onDownload?: (reportId: number) => void
}

const statusConfig = {
  concluido: {
    label: "Concluído",
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  arquivado: {
    label: "Arquivado",
    bg: "bg-[var(--rls-surface-container)]",
    text: "text-[var(--rls-on-surface-variant)]",
    icon: <Archive className="w-3.5 h-3.5" />,
  },
  pendente: {
    label: "Pendente",
    bg: "bg-[var(--rls-primary-container)]/10",
    text: "text-[var(--rls-primary-container)]",
    icon: null,
  },
}

export function ReportsView({
  reports,
  navItems,
  onBack,
  onNavigate,
  onDownload,
}: ReportsViewProps) {
  const [activeFilter, setActiveFilter] = useState("monthly")

  const filterOptions = [
    { label: "Mensal", value: "monthly" as const },
    { label: "Impostos", value: "taxes" as const },
    { label: "Anual", value: "yearly" as const },
    { label: "Customizado", value: "custom" as const },
  ]

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] pb-24">
      <AppBar
        onBack={onBack}
        title="Relatórios Financeiros"
        titleClassName="rls-text-title-lg text-[var(--rls-primary)]"
        // actions={[AppBarMoreAction(() => {})]}
      />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-md)] pt-[var(--rls-stack-gap-md)]">
        {/* Filter Chips */}
        <FilterChips
          options={filterOptions}
          selected={activeFilter}
          onChange={setActiveFilter}
        />

        {/* Report Cards */}
        <div className="flex flex-col gap-[var(--rls-stack-gap-md)]">
          {reports.map((report) => {
            const status = statusConfig[report.status]
            return (
              <div
                key={report.id}
                className="bg-[var(--rls-surface-container-lowest)] rounded-[var(--rls-radius-lg)] p-[var(--rls-inline-padding-md)] shadow-sm relative overflow-hidden"
              >
                {/* Decorative circle */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--rls-primary-container)]/5 rounded-full" />

                <div className="flex flex-col gap-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="rls-text-title-lg text-[var(--rls-on-surface)]">
                        {report.name}
                      </h3>
                      <p className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                        {report.date}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-[var(--rls-radius-pill)] rls-text-label-lg",
                        status.bg,
                        status.text
                      )}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  <button
                    onClick={() => onDownload?.(Number(report.id))}
                    className={cn(
                      "self-start px-4 py-2 rounded-[var(--rls-radius-pill)] rls-text-label-lg flex items-center gap-2 transition-all",
                      report.status === "concluido" && report.type === "mensal"
                        ? "bg-[var(--rls-primary-container)] text-white hover:bg-[var(--rls-primary)]"
                        : "border border-[var(--rls-primary-container)] text-[var(--rls-primary-container)] hover:bg-[var(--rls-primary-container)]/5"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* <BottomNavBar items={navItems} onNavigate={onNavigate} /> */}
    </div>
  )
}