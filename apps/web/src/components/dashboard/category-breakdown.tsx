"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

interface Category {
  name: string
  amount: number
  color: string
}

interface Props {
  categories: Category[]
}

export function CategoryBreakdown({ categories }: Props) {
  if (categories.length === 0) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">Nenhum gasto registrado</p>
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0)
  const donutData = categories.map((c) => ({
    name: c.name,
    value: total > 0 ? Math.round((c.amount / total) * 100) : 0,
    amount: c.amount,
    color: c.color,
  }))

  return (
    <div className="flex items-center gap-5">
      <div className="h-[140px] w-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {donutData.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-medium">{cat.name}</span>
            </div>
            <span className="font-mono text-muted-foreground">{cat.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
