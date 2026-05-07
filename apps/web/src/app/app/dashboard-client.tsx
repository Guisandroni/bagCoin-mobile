"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Compass,
  Loader2,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react"
import { CATEGORIES } from "@/lib/constants"
import { useAppStore } from "@/lib/store"
import { cn, formatCurrency } from "@/lib/utils"
import type { ServerAccount, ServerCreditCard, ServerGoal, TransactionSummary } from "@/lib/api-server"
import { useOpenIntegrationChat, useIntegrationStatus } from "@/hooks/use-integrations"
import {
  AssetRow,
  HCarousel,
  HCarouselCard,
  HeroBalanceCard,
  OnboardingCard,
  PrimarySecondaryPair,
  PromoBanner,
  PriceListItem,
  SectionHeader,
  FilterChip,
} from "@/components/coinbase"

interface Props {
  summary: TransactionSummary | null
  accounts: ServerAccount[]
  creditCards: ServerCreditCard[]
  budgetsCount: number
  goals: ServerGoal[]
}

function syntheticSparkline(seed: number): number[] {
  const out: number[] = []
  let v = 0.5 + (seed % 10) / 20
  for (let i = 0; i < 6; i++) {
    v += (Math.sin(seed + i) * 0.08)
    out.push(Math.max(0.1, Math.min(1, v)))
  }
  return out
}

export function DashboardClient({
  summary,
  accounts,
  creditCards,
  budgetsCount,
  goals,
}: Props) {
  const router = useRouter()
  const { openModal } = useAppStore()
  const { openIntegrationChat, openingChannel } = useOpenIntegrationChat()
  const { data: integrationStatus } = useIntegrationStatus(false)

  const txCount = summary?.transaction_count ?? 0
  const pendingCount = summary?.recent_transactions?.filter((t) => t.status === "pending").length ?? 0
  const transactions = summary?.recent_transactions ?? []
  const categoryData = summary?.categories ?? []

  const linked =
    Boolean(integrationStatus?.whatsapp_linked || integrationStatus?.telegram_linked)

  const onboardingSteps = useMemo(() => {
    const hasBudget = budgetsCount > 0
    const hasGoal = goals.some((g) => g.status === "active")
    const hasTx = txCount > 0
    const bits = [linked, hasTx, hasBudget, hasGoal]
    const done = bits.filter(Boolean).length
    return { done, total: 4, bits }
  }, [linked, txCount, budgetsCount, goals])

  const [catSort, setCatSort] = useState<"spent" | "alpha">("spent")
  const sortedCategories = useMemo(() => {
    const arr = [...categoryData]
    if (catSort === "spent") arr.sort((a, b) => b.amount - a.amount)
    else arr.sort((a, b) => a.name.localeCompare(b.name))
    return arr.slice(0, 6)
  }, [categoryData, catSort])

  const accountsTotal = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const cardsTotalLimit = creditCards.reduce((s, c) => s + (c.limit ?? 0), 0)

  const topGoals = goals.filter((g) => g.status === "active").slice(0, 8)
  const completedGoals = goals.filter((g) => g.status === "completed").slice(0, 8)

  const showOnboarding = onboardingSteps.done < onboardingSteps.total

  return (
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="section-title">Início</h1>
      </div>

      <HeroBalanceCard
        summary={summary}
        connectBusy={openingChannel === "whatsapp"}
        onConnectWhatsApp={txCount === 0 ? () => void openIntegrationChat("whatsapp") : undefined}
      />

      <div className="grid gap-2">
        <AssetRow
          href="/app/contas"
          icon={<Wallet className="h-5 w-5 text-primary" />}
          title="Contas"
          subtitle={`${accounts.length} conta(s)`}
          amount={<span className="row-amount">{formatCurrency(accountsTotal)}</span>}
        />
        <AssetRow
          href="/app/contas"
          icon={<span className="text-lg">💳</span>}
          title="Cartões"
          subtitle={`${creditCards.length} cartão(ões)`}
          amount={
            <span className="row-amount text-muted-foreground">
              {cardsTotalLimit > 0 ? `Lim. ${formatCurrency(cardsTotalLimit)}` : "—"}
            </span>
          }
        />
      </div>

      {showOnboarding ? (
        <OnboardingCard
          title="Complete seu perfil financeiro"
          description="Conecte bots, registre lançamentos e defina orçamentos e metas."
          completedSteps={onboardingSteps.done}
          totalSteps={onboardingSteps.total}
          viewAllHref="/app/configuracoes/integracoes"
        />
      ) : null}

      <HCarousel title="Explorar" labelledBy="explore-carousel">
        <HCarouselCard>
          <p className="text-[13px] font-bold">WhatsApp</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Lançar pelo chat com um toque.</p>
          <button
            type="button"
            disabled={openingChannel !== null}
            className="mt-3 text-[13px] font-semibold text-primary"
            onClick={() => void openIntegrationChat("whatsapp")}
          >
            {openingChannel === "whatsapp" ? (
              <Loader2 className="inline h-4 w-4 animate-spin" />
            ) : (
              "Abrir WhatsApp"
            )}
          </button>
        </HCarouselCard>
        <HCarouselCard>
          <p className="text-[13px] font-bold">Telegram</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Mesma experiência no Telegram.</p>
          <button
            type="button"
            disabled={openingChannel !== null}
            className="mt-3 text-[13px] font-semibold text-primary"
            onClick={() => void openIntegrationChat("telegram")}
          >
            {openingChannel === "telegram" ? (
              <Loader2 className="inline h-4 w-4 animate-spin" />
            ) : (
              "Abrir Telegram"
            )}
          </button>
        </HCarouselCard>
        <HCarouselCard>
          <Compass className="mb-2 h-8 w-8 text-primary" />
          <p className="text-[13px] font-bold">Orçamentos</p>
          <Link href="/app/orcamentos" className="mt-3 block text-[13px] font-semibold text-primary">
            Planejar gastos
          </Link>
        </HCarouselCard>
        <HCarouselCard>
          <Target className="mb-2 h-8 w-8 text-primary" />
          <p className="text-[13px] font-bold">Metas</p>
          <Link href="/app/metas" className="mt-3 block text-[13px] font-semibold text-primary">
            Ver metas
          </Link>
        </HCarouselCard>
      </HCarousel>

      <PromoBanner
        id="referral-tip"
        title="Convide amigos"
        description="Compartilhe o bagCoin e mantenha suas finanças organizadas no WhatsApp."
        illustration={<Sparkles className="h-14 w-14 text-primary opacity-90" />}
      />

      <section>
        <SectionHeader
          title="Categorias"
          right={
            <FilterChip label={catSort === "spent" ? "Mais gastas" : "A–Z"}>
              <div className="flex flex-col gap-1 p-1">
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => setCatSort("spent")}
                >
                  Mais gastas
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => setCatSort("alpha")}
                >
                  Ordem alfabética
                </button>
              </div>
            </FilterChip>
          }
        />
        <div className="rounded-2xl border border-border bg-card px-2 py-1">
          {sortedCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem gastos por categoria ainda</p>
          ) : (
            sortedCategories.map((cat, i) => {
              const emoji = CATEGORIES.find((c) => c.name === cat.name)?.emoji ?? "📁"
              const maxAmt = Math.max(...sortedCategories.map((c) => c.amount), 1)
              const delta = ((cat.amount / maxAmt) * 100 - 50) * 0.2
              return (
                <PriceListItem
                  key={cat.name}
                  icon={<span>{emoji}</span>}
                  name={cat.name}
                  ticker="Gasto no período"
                  priceLabel={formatCurrency(cat.amount)}
                  deltaPercent={delta}
                  sparklineValues={syntheticSparkline(cat.name.length + i)}
                />
              )
            })
          )}
        </div>
      </section>

      {topGoals.length > 0 ? (
        <HCarousel title="Metas em destaque" labelledBy="goals-dash">
          {topGoals.map((g) => (
            <HCarouselCard key={g.id}>
              <p className="line-clamp-2 text-[14px] font-bold">{g.name}</p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, g.percentage)}%` }}
                />
              </div>
              <Link href="/app/metas" className="mt-3 inline-block text-[13px] font-semibold text-primary">
                Abrir meta
              </Link>
            </HCarouselCard>
          ))}
        </HCarousel>
      ) : null}

      {completedGoals.length > 0 ? (
        <HCarousel title="Metas concluídas" labelledBy="goals-done">
          {completedGoals.map((g) => (
            <HCarouselCard key={g.id} className="border-dashed opacity-90">
              <p className="text-[14px] font-bold line-through decoration-muted-foreground">{g.name}</p>
              <p className="mt-1 text-[12px] text-success">Concluída</p>
            </HCarouselCard>
          ))}
        </HCarousel>
      ) : null}

      <section>
        <SectionHeader title="Transações recentes" actionLabel="Ver todas" actionHref="/app/transacoes" />
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação recente</p>
          ) : (
            transactions.slice(0, 8).map((t, i) => {
              const cat = CATEGORIES.find((c) => c.name === (t.category || t.category_name))
              return (
                <AssetRow
                  key={t.id || i}
                  icon={
                    <span className="text-lg">{cat?.emoji ?? (t.amount >= 0 ? "📥" : "📤")}</span>
                  }
                  title={t.name || t.description || "Lançamento"}
                  subtitle={`${t.category || t.category_name || "—"} · ${t.date || t.transaction_date || ""}`}
                  amount={
                    <span
                      className={cn(
                        "row-amount",
                        t.amount >= 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {formatCurrency(t.amount)}
                    </span>
                  }
                  onClick={() =>
                    openModal("transaction-detail", {
                      id: String(t.id ?? ""),
                      name: t.name,
                      category: String(
                        t.category ?? (t as { category_name?: string }).category_name ?? ""
                      ),
                      amount: t.amount,
                      date: String(t.date ?? (t as { transaction_date?: string }).transaction_date ?? ""),
                      source: t.source as "manual" | "auto" | "whatsapp",
                      status: t.status as "confirmed" | "pending",
                    })
                  }
                />
              )
            })
          )}
        </div>
      </section>

      {pendingCount > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm">
            <span className="font-semibold">{pendingCount} pendente(s)</span>
            {" · "}
            <Link href="/app/confirmacoes" className="font-semibold text-primary underline">
              Revisar
            </Link>
          </p>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:static lg:z-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <PrimarySecondaryPair
          primaryLabel="Novo lançamento"
          secondaryLabel="Contas"
          onPrimary={() => openModal("new-transaction")}
          onSecondary={() => router.push("/app/contas")}
        />
      </div>
    </div>
  )
}
