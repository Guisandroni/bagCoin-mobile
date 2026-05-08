import { getTransactionSummary } from "@/lib/api-server"
import { categoriesFromSummary } from "@/lib/adapters"
import { CategoriasClient } from "./categorias-client"

export default async function CategoriasPage() {
  const summary = await getTransactionSummary()
  const categories = categoriesFromSummary(summary)
  const totalAllocated = categories.reduce((s, c) => s + c.allocated, 0)

  return (
    <CategoriasClient
      categories={categories}
      totalAllocated={totalAllocated}
    />
  )
}