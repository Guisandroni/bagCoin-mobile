"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { TransactionModal } from "@/components/app/TransactionModal";
import { MonthNavigator } from "@/components/app/MonthNavigator";

const filters = ["Todas", "Receitas", "Despesas", "Pendentes"];

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

export default function TransactionsPage() {
  const { state } = useFinance();
  const { selectedMonth, setSelectedMonth, getTransactionsForMonth } = useMonthFilter();
  const [activeFilter, setActiveFilter] = React.useState("Todas");
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const monthTxs = getTransactionsForMonth(state.transactions);

  const filtered = monthTxs.filter((tx) => {
    if (activeFilter === "Receitas") return tx.type === "income";
    if (activeFilter === "Despesas") return tx.type === "expense";
    if (activeFilter === "Pendentes") return tx.date > new Date().toISOString().slice(0, 10);
    return true;
  }).filter((tx) =>
    tx.name.toLowerCase().includes(search.toLowerCase()) ||
    tx.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["Nome", "Categoria", "Data", "Tipo", "Valor", "Status", "Conta/Cartão"];
    const rows = filtered.map((tx) => {
      const source = tx.accountId
        ? state.accounts.find((a) => a.id === tx.accountId)?.name
        : state.cards.find((c) => c.id === tx.cardId)?.name;
      return [
        tx.name,
        tx.category,
        tx.date,
        tx.type === "income" ? "Receita" : "Despesa",
        tx.amount.toString(),
        tx.status === "paid" ? "Pago" : tx.status === "overdue" ? "Atrasado" : "Pendente",
        source || "",
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transacoes-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Transações"
        subtitle="Gerencie todas as suas movimentações financeiras"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white text-near-black font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm ring-shadow"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            CSV
          </button>
          <button
            onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Transação
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all btn-scale ${
                activeFilter === f
                  ? "bg-near-black text-white"
                  : "bg-white text-gray hover:text-near-black ring-shadow"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray">search</span>
          <input
            type="text"
            placeholder="Buscar transação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white ring-shadow text-sm font-medium text-near-black placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-wise-green/50"
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <MonthNavigator selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        <span className="text-xs text-gray font-medium">
          {filtered.length} transação{filtered.length !== 1 ? "ões" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-white rounded-3xl ring-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-surface">
                <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Transação</th>
                <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Origem</th>
                <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Categoria</th>
                <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Data</th>
                <th className="text-right text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Valor</th>
                <th className="text-center text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-center text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const source = tx.accountId
                  ? state.accounts.find((a) => a.id === tx.accountId)
                  : state.cards.find((c) => c.id === tx.cardId);
                return (
                  <tr key={tx.id} className="border-b border-light-surface/50 hover:bg-light-surface/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === "income" ? "bg-positive-green/10" : "bg-danger-red/10"
                        }`}>
                          <span className={`material-symbols-outlined ${
                            tx.type === "income" ? "text-positive-green" : "text-danger-red"
                          }`}>
                            {categoryIcons[tx.category] || "receipt"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-near-black text-sm block">{tx.name}</span>
                          {tx.installments && tx.installments > 1 && (
                            <span className="text-[10px] text-wise-green font-medium">{tx.installmentNumber}/{tx.installments}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray">{source?.name || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray">{tx.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray">{tx.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-display font-bold text-sm ${
                        tx.type === "income" ? "text-positive-green" : "text-near-black"
                      }`}>
                        {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tx.status === "paid" ? "bg-light-mint text-positive-green" :
                        tx.status === "overdue" ? "bg-danger-red/10 text-danger-red" :
                        "bg-warning-yellow/10 text-near-black"
                      }`}>
                        {tx.status === "paid" ? "Pago" : tx.status === "overdue" ? "Atrasado" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(tx.id); setModalOpen(true); }}
                          className="w-7 h-7 rounded-full bg-light-surface flex items-center justify-center hover:bg-wise-green/20"
                        >
                          <span className="material-symbols-outlined text-xs text-gray">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-gray mb-2">search_off</span>
            <p className="text-gray font-medium">Nenhuma transação encontrada</p>
          </div>
        )}
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} editingId={editingId} />
    </div>
  );
}
