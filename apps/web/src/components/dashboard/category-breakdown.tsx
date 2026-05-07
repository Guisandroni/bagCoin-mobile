"use client"

import { DashboardPieChart, type PieSlice } from "@/components/charts/pie-chart"

interface Category {
  name: string
  amount: number
  color: string
}

interface Props {
  categories?: Category[]
}

export function CategoryBreakdown({ categories = [] }: Props) {
  if (categories.length === 0) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">Nenhum gasto registrado</p>
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0)
  const slices: PieSlice[] = categories.map((c) => ({
    name: c.name,
    value: Math.max(c.amount, 0.0001),
    color: c.color,
  }))

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="flex shrink-0 justify-center">
        <DashboardPieChart data={slices} size={168} />
      </div>
      <div className="flex w-full max-w-sm flex-1 flex-col gap-2.5">
        {categories.map((cat) => (
          <div key={cat.name} className="flex min-h-[44px] items-center justify-between gap-3 text-[13px]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="truncate font-medium">{cat.name}</span>
            </div>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {total > 0 ? `${Math.round((cat.amount / total) * 100)}%` : "0%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
