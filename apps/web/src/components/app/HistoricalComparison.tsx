"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

export function HistoricalComparison() {
  const { state } = useFinance();

  // Get last 6 months of data
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthData = months.map((month) => {
    const txs = state.transactions.filter((t) => t.date.startsWith(month));
    const income = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    return { month, income, expense, balance: income - expense };
  });

  const avgIncome = monthData.reduce((a, m) => a + m.income, 0) / monthData.length || 0;
  const avgExpense = monthData.reduce((a, m) => a + m.expense, 0) / monthData.length || 0;
  const avgBalance = monthData.reduce((a, m) => a + m.balance, 0) / monthData.length || 0;

  const currentMonth = monthData[monthData.length - 1];
  const incomeChange = avgIncome > 0 ? ((currentMonth.income - avgIncome) / avgIncome) * 100 : 0;
  const expenseChange = avgExpense > 0 ? ((currentMonth.expense - avgExpense) / avgExpense) * 100 : 0;

  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <h3 className="font-display font-bold text-xl text-near-black mb-2">Comparação com Média Histórica</h3>
      <p className="text-xs text-gray mb-6">Baseado na média dos últimos 6 meses</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-light-surface/50 rounded-2xl p-4">
          <p className="text-xs text-gray uppercase tracking-wider mb-1">Receita Média</p>
          <p className="font-display font-bold text-xl text-near-black">
            R$ {avgIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-semibold mt-1 ${incomeChange >= 0 ? "text-positive-green" : "text-danger-red"}`}>
            {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}% vs média
          </p>
        </div>
        <div className="bg-light-surface/50 rounded-2xl p-4">
          <p className="text-xs text-gray uppercase tracking-wider mb-1">Despesa Média</p>
          <p className="font-display font-bold text-xl text-near-black">
            R$ {avgExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-semibold mt-1 ${expenseChange >= 0 ? "text-danger-red" : "text-positive-green"}`}>
            {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}% vs média
          </p>
        </div>
        <div className="bg-light-surface/50 rounded-2xl p-4">
          <p className="text-xs text-gray uppercase tracking-wider mb-1">Saldo Média</p>
          <p className="font-display font-bold text-xl text-near-black">
            R$ {avgBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
