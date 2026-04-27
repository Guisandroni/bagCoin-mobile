"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface WeekdaySpendingChartProps {
  month?: string;
}

export function WeekdaySpendingChart({ month }: WeekdaySpendingChartProps) {
  const { state } = useFinance();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const monthTxs = state.transactions.filter((t) => t.date.startsWith(targetMonth));

  const spendingByDay = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const day = new Date(t.date + "T00:00:00").getDay();
      acc[day] = (acc[day] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);

  const maxSpent = Math.max(...Object.values(spendingByDay), 1);

  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <h3 className="font-display font-bold text-xl text-near-black mb-6">Gastos por Dia da Semana</h3>
      <div className="flex items-end justify-between gap-3 h-48">
        {weekdays.map((day, index) => {
          const spent = spendingByDay[index] || 0;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center h-36">
                <div
                  className="w-full max-w-10 bg-danger-red rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                  style={{ height: `${(spent / maxSpent) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-near-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
