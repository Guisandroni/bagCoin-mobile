"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

const categoryIcons: Record<string, string> = {
  Alimentação: "restaurant",
  Transporte: "directions_car",
  Moradia: "home",
  Entretenimento: "movie",
  Saúde: "health_and_safety",
  Compras: "shopping_bag",
  Renda: "payments",
  "Renda Extra": "work",
  Educação: "school",
  Outros: "more_horiz",
};

export function FutureTransactionsSection() {
  const { getFutureTransactions, getRecurringTransactions } = useFinance();
  const future = getFutureTransactions();
  const recurring = getRecurringTransactions();

  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-xl text-near-black">Próximas Movimentações</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-wise-green/10 text-dark-green">
            {future.length} futuras
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-light-mint text-positive-green">
            {recurring.length} recorrentes
          </span>
        </div>
      </div>

      {future.length === 0 && recurring.length === 0 ? (
        <p className="text-gray text-center py-8">Nenhuma transação futura programada</p>
      ) : (
        <div className="space-y-3">
          {future.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-3 rounded-2xl bg-light-surface/30">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tx.type === "income" ? "bg-positive-green/10" : "bg-warning-yellow/10"
              }`}>
                <span className={`material-symbols-outlined ${
                  tx.type === "income" ? "text-positive-green" : "text-warning-yellow"
                }`}>
                  {categoryIcons[tx.category] || "event"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-near-black text-sm">{tx.name}</p>
                <p className="text-xs text-gray">{tx.category} · {tx.date}</p>
              </div>
              <span className={`font-display font-bold text-sm ${
                tx.type === "income" ? "text-positive-green" : "text-near-black"
              }`}>
                {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
