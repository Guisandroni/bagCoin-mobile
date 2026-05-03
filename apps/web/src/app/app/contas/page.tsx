"use client"

import { CreditCard, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MOCK_ACCOUNTS, MOCK_CARDS } from "@/data/mock"

function formatCurrency(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

export default function ContasPage() {
  const totalBalance = MOCK_ACCOUNTS.reduce((acc, a) => acc + a.balance, 0)

  return (
    <div className="p-4 lg:p-7">
      <div className="mb-6 rounded-2xl bg-[#0a0b0d] p-6 text-white lg:p-7">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
          Patrimônio total
        </p>
        <p className="mt-3 font-heading text-[36px] font-semibold tracking-tight">
          {formatCurrency(totalBalance)}
        </p>
        <p className="mt-1 text-[13px] text-white/50">
          {MOCK_ACCOUNTS.length} contas registradas
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 font-heading text-[16px] font-semibold">Contas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_ACCOUNTS.map((account) => (
            <Card key={account.id} className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{account.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{account.name}</p>
                    <p className="text-[12px] text-muted-foreground">{account.bank}</p>
                  </div>
                </div>
                <p className="mt-3 font-heading text-[20px] font-semibold tracking-tight">
                  {formatCurrency(account.balance)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-[16px] font-semibold">Cartões de crédito</h2>
          <Button variant="secondary" size="sm" className="gap-1.5 text-[12px]">
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_CARDS.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl p-5 text-white"
              style={{ backgroundColor: card.color }}
            >
              <div className="flex items-center justify-between">
                <CreditCard className="h-6 w-6 text-white/70" />
                <span className="text-[12px] font-semibold text-white/70">•••• {card.last4}</span>
              </div>
              <p className="mt-4 font-heading text-[11px] font-medium uppercase tracking-wider text-white/70">
                {card.name}
              </p>
              <p className="mt-1 font-heading text-[20px] font-semibold tracking-tight">
                {formatCurrency(card.used)}
                <span className="text-[12px] font-normal text-white/50">
                  {" "}de {formatCurrency(card.limit)}
                </span>
              </p>
              <div className="mt-3">
                <Progress
                  value={(card.used / card.limit) * 100}
                  className="h-1.5 bg-white/20"
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/50">
                <span>Fechamento: dia {card.closingDay}</span>
                <span>Vencimento: dia {card.dueDay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}