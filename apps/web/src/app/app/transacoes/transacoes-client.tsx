"use client"

import { TransactionsView } from "@/components/release/transactions-view"
import { usePathname } from "next/navigation"
import { getReleaseNavItems } from "@/lib/adapters"
import type { ReleaseTransaction } from "@/components/release/types"

interface Props {
  transactions: ReleaseTransaction[]
}

export function TransacoesClient({ transactions }: Props) {
  const pathname = usePathname()
  const navItems = getReleaseNavItems(pathname)

  const totalSpent = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalReceived = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <TransactionsView
      transactions={transactions}
      totalSpent={totalSpent}
      totalReceived={totalReceived}
      navItems={navItems}
      onNavigate={(href) => {
        if (href === "#settings") return
        window.location.href = href
      }}
    />
  )
}