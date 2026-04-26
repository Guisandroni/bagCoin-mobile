"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

interface BudgetCategory {
  category: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
}

const budgets: BudgetCategory[] = [
  { category: "Alimentação", budgeted: 1500, spent: 1250, icon: "restaurant", color: "#9fe870" },
  { category: "Transporte", budgeted: 800, spent: 680, icon: "directions_car", color: "#163300" },
  { category: "Moradia", budgeted: 2800, spent: 2800, icon: "home", color: "#ffd11a" },
  { category: "Entretenimento", budgeted: 500, spent: 420, icon: "movie", color: "#ffc091" },
  { category: "Saúde", budgeted: 400, spent: 380, icon: "health_and_safety", color: "#d03238" },
  { category: "Compras", budgeted: 600, spent: 210, icon: "shopping_bag", color: "#868685" },
];

interface BudgetVsActualProps {
  month?: string;
}

export function BudgetVsActual({ month }: BudgetVsActualProps) {
  const { state } = useFinance();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const monthTxs = state.transactions.filter((t) => t.date.startsWith(targetMonth));

  // Calculate actual spending by category from real transactions
  const actualByCategory = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <h3 className="font-display font-bold text-xl text-near-black mb-6">Orçamento vs Realizado</h3>
      <div className="space-y-5">
        {budgets.map((item) => {
          const actual = actualByCategory[item.category] || 0;
          const percentage = item.budgeted > 0 ? Math.min((actual / item.budgeted) * 100, 100) : 0;
          const remaining = item.budgeted - actual;
          const isOver = actual > item.budgeted;

          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray">{item.icon}</span>
                  <span className="font-semibold text-near-black text-sm">{item.category}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isOver ? "bg-danger-red/10 text-danger-red" : "bg-light-mint text-positive-green"
                  }`}>
                    {isOver ? "Excedido" : `${percentage.toFixed(0)}%`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-display font-bold text-near-black">
                    R$ {actual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray ml-2">
                    / R$ {item.budgeted.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-light-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-danger-red" : ""}`}
                  style={{
                    width: `${Math.min((actual / item.budgeted) * 100, 100)}%`,
                    backgroundColor: isOver ? undefined : item.color,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray">
                  Orçado: R$ {item.budgeted.toLocaleString("pt-BR")}
                </span>
                <span className={`text-xs font-semibold ${remaining >= 0 ? "text-positive-green" : "text-danger-red"}`}>
                  {remaining >= 0 ? `+R$ ${remaining.toLocaleString("pt-BR")}` : `-R$ ${Math.abs(remaining).toLocaleString("pt-BR")}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
