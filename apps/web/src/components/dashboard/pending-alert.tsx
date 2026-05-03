"use client"

import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MOCK_TRANSACTIONS } from "@/data/mock"
import { cn } from "@/lib/utils"

export function PendingAlert({ className }: { className?: string }) {
  const pendingCount = MOCK_TRANSACTIONS.filter(
    (t) => t.source === "whatsapp" && t.status === "pending"
  ).length

  if (pendingCount === 0) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20">
        <AlertTriangle className="h-5 w-5 text-warning" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">Pendências do WhatsApp</p>
        <p className="text-[12px] text-muted-foreground">
          Aguardando sua revisão
        </p>
      </div>
      <Badge className="border-0 bg-warning/20 text-warning hover:bg-warning/30">
        {pendingCount} confirmações
      </Badge>
    </div>
  )
}