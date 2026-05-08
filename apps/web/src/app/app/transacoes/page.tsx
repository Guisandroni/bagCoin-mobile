import dynamic from "next/dynamic"
import { getTransactions } from "@/lib/api-server"
import { serverTransactionToRelease } from "@/lib/adapters"
import TransacoesLoading from "./loading"

const TransacoesClient = dynamic(() => import("./transacoes-client").then((m) => m.TransacoesClient), {
  loading: () => <TransacoesLoading />,
})

export default async function TransacoesPage() {
  const result = await getTransactions()
  const serverTransactions = result?.items ?? []
  const transactions = serverTransactions.map(serverTransactionToRelease)

  return <TransacoesClient transactions={transactions} />
}