import { getTransactions } from "@/lib/api-server"
import type { ServerTransaction } from "@/lib/api-server"
import type { Transaction } from "@/types"
import TransacoesClient from "./transacoes-client"

function mapServerTransaction(t: ServerTransaction): Transaction {
  return {
    id: t.id,
    name: t.name || t.description || "",
    category: t.category || t.category_name || "",
    amount: t.amount,
    date: t.date || t.transaction_date || "",
    source: (t.source || "manual") as Transaction["source"],
    status: (t.status || "confirmed") as Transaction["status"],
  }
}

export default async function TransacoesPage() {
  const result = await getTransactions()
  const serverTransactions = result?.items ?? []
  const transactions: Transaction[] = serverTransactions.map(mapServerTransaction)

  return <TransacoesClient transactions={transactions} />
}
