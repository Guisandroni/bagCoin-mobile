"use client"

import { ArrowLeft, Plus } from "lucide-react"
import { AppBar } from "./app-bar"
import { InfoCard } from "./info-card"
import type { ReleaseGoal } from "./types"

interface SavingsGoalsViewProps {
  goals: ReleaseGoal[]
  totalCurrent: number
  totalTarget: number
  globalPercentage: number
  onBack?: () => void
  onAddGoal?: () => void
}

const goalIcons: Record<string, React.ReactNode> = {
  viagem: "✈️",
  veiculo: "🚗",
  casa: "🏠",
  outro: "🎯",
}

export function SavingsGoalsView({
  goals,
  totalCurrent,
  totalTarget,
  globalPercentage,
  onBack,
  onAddGoal,
}: SavingsGoalsViewProps) {
  return (
    <div className="rls min-h-screen bg-[var(--rls-background)]">
      <AppBar title="Minhas Metas" onBack={onBack} />

      <main className="px-[var(--rls-container-margin)] flex flex-col gap-[var(--rls-stack-gap-lg)] pt-[var(--rls-stack-gap-md)] pb-32">
        {/* Summary Card */}
        <InfoCard
          title="Total em Metas"
          value={`R$ ${totalCurrent.toLocaleString("pt-BR")}`}
          variant="default"
        >
          {/* Circular Progress */}
          <div className="flex items-center gap-4 mt-2">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle
                  className="text-[var(--rls-surface-container-high)]"
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-[var(--rls-primary-container)]"
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="16"
                  stroke="currentColor"
                  strokeDasharray={`${globalPercentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="4"
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rls-text-title-lg text-[var(--rls-primary-container)]">
                  {globalPercentage}%
                </span>
              </div>
            </div>
            <span className="rls-text-body-md text-[var(--rls-on-surface-variant)] px-3 py-1 bg-[var(--rls-primary-container)]/10 rounded-[var(--rls-radius-pill)] text-[var(--rls-primary-container)]">
              R$ {totalTarget.toLocaleString("pt-BR")} Alvo Global
            </span>
          </div>
        </InfoCard>

        {/* Goals List */}
        <div className="flex flex-col gap-[var(--rls-stack-gap-md)]">
          {goals.map((goal) => {
            const percentage = Math.round((goal.current / goal.target) * 100)
            return (
              <div
                key={goal.id}
                className="bg-[var(--rls-surface-container-lowest)] p-[var(--rls-inline-padding-md)] rounded-[var(--rls-radius-lg)] shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--rls-surface-container)] flex items-center justify-center text-xl">
                      {goalIcons[goal.category] || goalIcons.outro}
                    </div>
                    <div className="flex flex-col">
                      <span className="rls-text-body-lg text-[var(--rls-on-surface)]">
                        {goal.name}
                      </span>
                      <span className="rls-text-body-md text-[var(--rls-on-surface-variant)]">
                        R$ {goal.current.toLocaleString("pt-BR")} / R${" "}
                        {goal.target.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rls-text-label-lg px-2 py-0.5 rounded-[var(--rls-radius-pill)] ${
                      percentage >= 80
                        ? "bg-[var(--rls-primary-container)]/10 text-[var(--rls-primary-container)]"
                        : "bg-[var(--rls-surface-container-high)] text-[var(--rls-on-surface-variant)]"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--rls-surface-container-high)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--rls-primary-container)] rounded-full transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-[var(--rls-container-margin)] bg-gradient-to-t from-[var(--rls-background)] via-[var(--rls-background)] to-transparent pt-12">
        <button
          onClick={onAddGoal}
          className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Nova Meta
        </button>
      </div>
    </div>
  )
}