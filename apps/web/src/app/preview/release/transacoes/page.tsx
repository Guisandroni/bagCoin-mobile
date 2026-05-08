"use client"

import { TransactionsView } from "@/components/release"
import { mockTransactions, mockNavItems } from "@/components/release/__preview__/mock-data"

export default function TransacoesPreview() {
  return (
    <TransactionsView
      transactions={mockTransactions}
      totalSpent={1432.5}
      totalReceived={3200}
      navItems={mockNavItems}
      onNavigate={(href) => console.log("Navigate:", href)}
    />
  )
}