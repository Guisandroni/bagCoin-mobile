"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";
import { TransactionModal } from "@/components/app/TransactionModal";

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

export function RecentTransactions() {
  const { state } = useFinance();
  const [modalOpen, setModalOpen] = React.useState(false);
  const targetMonth = new Date().toISOString().slice(0, 7);
  const monthTxs = state.transactions.filter((t) => t.date.startsWith(targetMonth));

  const transactions = [...monthTxs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="bg-white rounded-[30px] p-6 ring-shadow card-lift animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-xl text-near-black">Transações Recentes</h3>
          <p className="text-xs text-gray mt-0.5">Últimas 7 movimentações</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm font-semibold text-dark-green bg-wise-green/10 px-4 py-2 rounded-full btn-scale hover:bg-wise-green/20 transition-colors"
        >
          Ver todas
        </button>
      </div>
      <div className="space-y-2">
        {transactions.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-light-surface flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl text-gray">receipt_long</span>
            </div>
            <p className="text-gray font-medium text-sm">Nenhuma transação este mês</p>
          </div>
        )}
        {transactions.map((tx, i) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-light-surface/60 transition-colors group animate-fade-in-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              tx.type === "income" ? "bg-positive-green/10" : "bg-danger-red/10"
            }`}>
              <span className={`material-symbols-outlined ${
                tx.type === "income" ? "text-positive-green" : "text-danger-red"
              }`}>
                {categoryIcons[tx.category] || "receipt"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-near-black text-sm truncate">{tx.name}</p>
              <p className="text-xs text-gray">
                {tx.category} · {formatDate(tx.date)}
                {tx.installments && tx.installments > 1 && (
                  <span className="ml-1 text-wise-green font-medium"> {tx.installmentNumber}/{tx.installments}</span>
                )}
              </p>
            </div>
            <span className={`font-display font-bold text-sm ${
              tx.type === "income" ? "text-positive-green" : "text-near-black"
            }`}>
              {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
