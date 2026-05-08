import { getAccounts, getCreditCards } from "@/lib/api-server"
import { ContasClient } from "./contas-client"

export default async function ContasPage() {
  const [accountsData, cardsData] = await Promise.all([
    getAccounts(),
    getCreditCards(),
  ])

  const accounts = (accountsData || []).map((a) => ({
    id: typeof a.id === "string" ? parseInt(a.id, 10) || 0 : a.id,
    name: a.name,
    type: a.type,
    balance: a.balance,
    bank: a.bank,
    color: a.color,
    created_at: a.created_at,
  }))

  const cards = (cardsData || []).map((c) => ({
    id: typeof c.id === "string" ? parseInt(c.id, 10) || 0 : c.id,
    name: c.name,
    issuer: c.issuer,
    limit: c.limit,
    closing_day: c.closing_day,
    due_day: c.due_day,
    color: c.color,
    created_at: c.created_at,
  }))

  return <ContasClient initialAccounts={accounts} initialCards={cards} />
}
