"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance, Transaction } from "@/hooks/useFinance";

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

const allCategories = [
  "Alimentação", "Transporte", "Moradia", "Entretenimento",
  "Saúde", "Compras", "Renda", "Renda Extra", "Educação", "Outros",
];

export default function RecorrentesPage() {
  const { state, dispatch } = useFinance();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Get unique recurring transactions (one per parent, not installments)
  const recurringTransactions = state.transactions.filter((t) => t.recurring && !t.parentId);

  const handleDelete = (id: string) => {
    // Delete this transaction and all its future recurring copies
    const tx = state.transactions.find((t) => t.id === id);
    if (!tx) return;
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    // Also delete future copies with same name/category/type pattern
    state.transactions
      .filter((t) => t.parentId === id || (t.name === tx.name && t.recurring && t.date > tx.date))
      .forEach((t) => dispatch({ type: "DELETE_TRANSACTION", payload: t.id }));
  };

  const handleToggleStatus = (tx: Transaction) => {
    const newStatus = tx.status === "paid" ? "pending" : "paid";
    dispatch({ type: "UPDATE_TRANSACTION", payload: { ...tx, status: newStatus } });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Recorrentes"
        subtitle="Gerencie suas receitas e despesas que se repetem automaticamente"
      >
        <button
          onClick={() => { setEditingId(null); setModalOpen(true); }}
          className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Transação Recorrente
        </button>
      </PageHeader>

      {recurringTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 ring-shadow text-center">
          <span className="material-symbols-outlined text-5xl text-gray mb-4">event_repeat</span>
          <p className="text-gray text-lg font-medium">Nenhuma transação recorrente cadastrada</p>
          <p className="text-sm text-gray mt-2">Crie uma para começar a automatizar suas finanças</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl ring-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-surface">
                  <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Transação</th>
                  <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Categoria</th>
                  <th className="text-left text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Origem</th>
                  <th className="text-right text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Valor</th>
                  <th className="text-center text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-center text-xs font-semibold text-gray uppercase tracking-wider px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recurringTransactions.map((tx) => {
                  const source = tx.accountId
                    ? state.accounts.find((a) => a.id === tx.accountId)
                    : state.cards.find((c) => c.id === tx.cardId);
                  return (
                    <tr key={tx.id} className="border-b border-light-surface/50 hover:bg-light-surface/30 transition-colors">
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
                          <span className="font-semibold text-near-black text-sm">{tx.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray">{tx.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray">{source?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-display font-bold text-sm ${
                          tx.type === "income" ? "text-positive-green" : "text-near-black"
                        }`}>
                          {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(tx)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            tx.status === "paid"
                              ? "bg-light-mint text-positive-green"
                              : tx.status === "overdue"
                              ? "bg-danger-red/10 text-danger-red"
                              : "bg-warning-yellow/10 text-near-black"
                          }`}
                        >
                          {tx.status === "paid" ? "Pago" : tx.status === "overdue" ? "Atrasado" : "Pendente"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setEditingId(tx.id); setModalOpen(true); }}
                            className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center btn-scale"
                          >
                            <span className="material-symbols-outlined text-sm text-gray">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center btn-scale hover:bg-danger-red/10"
                          >
                            <span className="material-symbols-outlined text-sm text-gray hover:text-danger-red">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <RecurringModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          editingId={editingId}
        />
      )}
    </div>
  );
}

function RecurringModal({ isOpen, onClose, editingId }: { isOpen: boolean; onClose: () => void; editingId: string | null }) {
  const { state, dispatch } = useFinance();
  const existing = editingId ? state.transactions.find((t) => t.id === editingId) : null;

  const [name, setName] = React.useState(existing?.name || "");
  const [amount, setAmount] = React.useState(existing?.amount.toString() || "");
  const [category, setCategory] = React.useState(existing?.category || "");
  const [type, setType] = React.useState<"income" | "expense">(existing?.type || "expense");
  const [sourceType, setSourceType] = React.useState<"account" | "card">(
    existing?.accountId ? "account" : existing?.cardId ? "card" : "account"
  );
  const [sourceId, setSourceId] = React.useState(existing?.accountId || existing?.cardId || "");
  const [dayOfMonth, setDayOfMonth] = React.useState(
    existing ? parseInt(existing.date.split("-")[2]) : 1
  );

  if (!isOpen) return null;

  const handleSubmit = () => {
    const amt = parseFloat(amount.replace(",", "."));
    if (!name || !amt || !category || !sourceId) return;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const date = `${year}-${month}-${String(dayOfMonth).padStart(2, "0")}`;

    if (existing) {
      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: {
          ...existing,
          name,
          amount: amt,
          category,
          type,
          date,
          accountId: sourceType === "account" ? sourceId : undefined,
          cardId: sourceType === "card" ? sourceId : undefined,
        },
      });
    } else {
      dispatch({
        type: "ADD_TRANSACTION",
        payload: {
          id: `tx-${Date.now()}`,
          name,
          amount: amt,
          category,
          date,
          type,
          recurring: true,
          status: "pending",
          accountId: sourceType === "account" ? sourceId : undefined,
          cardId: sourceType === "card" ? sourceId : undefined,
        },
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="relative bg-white rounded-[30px] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-black text-2xl text-near-black">
            {existing ? "Editar Recorrente" : "Nova Transação Recorrente"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center btn-scale">
            <span className="material-symbols-outlined text-gray">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setType("expense")}
              className={`p-4 rounded-2xl border-2 transition-all btn-scale ${
                type === "expense" ? "border-danger-red bg-danger-red/5" : "border-light-surface hover:border-danger-red/30"
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-danger-red mb-1">trending_down</span>
              <p className="font-display font-bold text-near-black text-sm">Despesa</p>
            </button>
            <button
              onClick={() => setType("income")}
              className={`p-4 rounded-2xl border-2 transition-all btn-scale ${
                type === "income" ? "border-positive-green bg-positive-green/5" : "border-light-surface hover:border-positive-green/30"
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-positive-green mb-1">trending_up</span>
              <p className="font-display font-bold text-near-black text-sm">Receita</p>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Origem</label>
            <select
              value={sourceType}
              onChange={(e) => { setSourceType(e.target.value as "account" | "card"); setSourceId(""); }}
              className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black mb-2"
            >
              <option value="account">Conta Bancária</option>
              <option value="card">Cartão de Crédito</option>
            </select>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
            >
              <option value="">Selecione...</option>
              {sourceType === "account"
                ? state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
                : state.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Netflix"
              className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Valor</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Dia do mês</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all btn-scale ${
                    category === cat ? "bg-wise-green text-dark-green" : "bg-light-surface text-gray hover:text-near-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !amount || !category || !sourceId}
            className="w-full py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale disabled:opacity-50 disabled:hover:scale-100"
          >
            {existing ? "Salvar Alterações" : "Criar Recorrente"}
          </button>
        </div>
      </div>
    </div>
  );
}
