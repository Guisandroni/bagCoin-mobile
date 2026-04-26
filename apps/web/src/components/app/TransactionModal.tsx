"use client";

import React from "react";
import { useFinance, Transaction, TransactionStatus } from "@/hooks/useFinance";
import { Modal } from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

export function TransactionModal({ isOpen, onClose, editingId }: TransactionModalProps) {
  const { state, dispatch } = useFinance();
  const { showToast } = useToast();
  const baseCategories = [
    "Alimentação", "Transporte", "Moradia", "Entretenimento",
    "Saúde", "Compras", "Renda", "Renda Extra", "Educação", "Outros",
  ];
  const categories = [...baseCategories, ...state.settings.customCategories];

  const existing = editingId ? state.transactions.find((t) => t.id === editingId) : null;

  const [txType, setTxType] = React.useState<"income" | "expense">(existing?.type || "expense");
  const [sourceType, setSourceType] = React.useState<"account" | "card">(
    existing?.accountId ? "account" : existing?.cardId ? "card" : "account"
  );
  const [sourceId, setSourceId] = React.useState(existing?.accountId || existing?.cardId || state.accounts[0]?.id || state.cards[0]?.id || "");
  const [name, setName] = React.useState(existing?.name || "");
  const [amount, setAmount] = React.useState(existing?.amount.toString() || "");
  const [category, setCategory] = React.useState(existing?.category || "");
  const [date, setDate] = React.useState(existing?.date || new Date().toISOString().slice(0, 10));
  const [status, setStatus] = React.useState<TransactionStatus>(existing?.status || "pending");
  const [recurring, setRecurring] = React.useState(existing?.recurring || false);
  const [installments, setInstallments] = React.useState(existing?.installments || 1);

  React.useEffect(() => {
    if (isOpen) {
      if (editingId && existing) {
        setTxType(existing.type);
        setSourceType(existing.accountId ? "account" : "card");
        setSourceId(existing.accountId || existing.cardId || "");
        setName(existing.name);
        setAmount(existing.amount.toString());
        setCategory(existing.category);
        setDate(existing.date);
        setStatus(existing.status);
        setRecurring(existing.recurring);
        setInstallments(existing.installments || 1);
      } else {
        setTxType("expense");
        setSourceType("account");
        setSourceId(state.accounts[0]?.id || state.cards[0]?.id || "");
        setName("");
        setAmount("");
        setCategory("");
        setDate(new Date().toISOString().slice(0, 10));
        setStatus("pending");
        setRecurring(false);
        setInstallments(1);
      }
    }
  }, [isOpen, editingId, existing, state.accounts, state.cards]);

  const handleSubmit = () => {
    const amt = parseFloat(amount.replace(",", "."));
    if (!name || !amt || !category || !sourceId) {
      showToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    if (existing) {
      const updatedTx: Transaction = {
        ...existing,
        name,
        amount: amt,
        category,
        date,
        type: txType,
        status,
        recurring,
        accountId: sourceType === "account" ? sourceId : undefined,
        cardId: sourceType === "card" ? sourceId : undefined,
      };
      dispatch({ type: "UPDATE_TRANSACTION", payload: updatedTx });
      showToast("Transação atualizada com sucesso!");
    } else {
      const baseId = `tx-${Date.now()}`;
      const baseTransaction = {
        name,
        amount: amt,
        category,
        date,
        type: txType,
        recurring,
        status,
        accountId: sourceType === "account" ? sourceId : undefined,
        cardId: sourceType === "card" ? sourceId : undefined,
      };

      const transactionsToAdd: typeof state.transactions = [];
      if (sourceType === "card" && txType === "expense" && installments > 1) {
        for (let i = 0; i < installments; i++) {
          const d = new Date(date);
          d.setMonth(d.getMonth() + i);
          transactionsToAdd.push({
            id: i === 0 ? baseId : `${baseId}-${i}`,
            ...baseTransaction,
            date: d.toISOString().slice(0, 10),
            installments,
            installmentNumber: i + 1,
            parentId: i === 0 ? undefined : baseId,
          });
        }
      } else {
        transactionsToAdd.push({ id: baseId, ...baseTransaction });
      }

      dispatch({ type: "ADD_TRANSACTIONS", payload: transactionsToAdd });

      if (sourceType === "account") {
        const account = state.accounts.find((a) => a.id === sourceId);
        if (account) {
          const newBalance = txType === "expense" ? account.balance - amt : account.balance + amt;
          dispatch({ type: "UPDATE_ACCOUNT", payload: { ...account, balance: newBalance } });
        }
      } else if (sourceType === "card" && txType === "expense") {
        const card = state.cards.find((c) => c.id === sourceId);
        if (card) {
          dispatch({ type: "UPDATE_CARD", payload: { ...card, used: card.used + amt } });
        }
      }
      showToast("Transação criada com sucesso!");
    }

    onClose();
  };

  const handleDelete = () => {
    if (!existing) return;
    dispatch({ type: "DELETE_TRANSACTION", payload: existing.id });
    showToast("Transação excluída", "warning");
    onClose();
  };

  const canSubmit = name && amount && category && sourceId;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black placeholder:text-gray/50";
  const selectClass = "w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black appearance-none cursor-pointer";
  const labelClass = "text-xs font-semibold text-gray uppercase tracking-wider mb-2 block";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? "Editar Transação" : "Nova Transação"} maxWidth="max-w-md">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Tipo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTxType("expense")}
              className={`py-3 rounded-xl text-sm font-semibold transition-all btn-scale border-2 ${
                txType === "expense" ? "border-danger-red bg-danger-red/5 text-near-black" : "border-light-surface text-gray hover:border-danger-red/30"
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-1">trending_down</span>
              Despesa
            </button>
            <button
              onClick={() => setTxType("income")}
              className={`py-3 rounded-xl text-sm font-semibold transition-all btn-scale border-2 ${
                txType === "income" ? "border-positive-green bg-positive-green/5 text-near-black" : "border-light-surface text-gray hover:border-positive-green/30"
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-1">trending_up</span>
              Receita
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Supermercado" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Valor</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Categoria</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {categories.map((cat) => (
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

        <div>
          <label className={labelClass}>Origem</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={() => { setSourceType("account"); setSourceId(state.accounts[0]?.id || ""); }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                sourceType === "account" ? "border-wise-green bg-wise-green/5 text-near-black" : "border-light-surface text-gray"
              }`}
            >
              Conta
            </button>
            <button
              onClick={() => { setSourceType("card"); setSourceId(state.cards[0]?.id || ""); }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                sourceType === "card" ? "border-wise-green bg-wise-green/5 text-near-black" : "border-light-surface text-gray"
              }`}
            >
              Cartão
            </button>
          </div>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={selectClass}>
            {sourceType === "account"
              ? state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
              : state.cards.map((c) => <option key={c.id} value={c.id}>{c.name} — R$ {(c.limit - c.used).toLocaleString("pt-BR")} disponível</option>)}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${status === "paid" ? "bg-wise-green border-wise-green" : "border-gray"}`}>
              {status === "paid" && <span className="material-symbols-outlined text-dark-green text-xs font-bold">check</span>}
            </div>
            <input type="checkbox" checked={status === "paid"} onChange={(e) => setStatus(e.target.checked ? "paid" : "pending")} className="sr-only" />
            <span className="text-sm font-medium text-near-black">Pago/Recebido</span>
          </label>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${recurring ? "bg-wise-green border-wise-green" : "border-gray"}`}>
            {recurring && <span className="material-symbols-outlined text-dark-green text-xs font-bold">check</span>}
          </div>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="sr-only" />
          <span className="text-sm font-medium text-near-black">Recorrente</span>
        </label>

        {sourceType === "card" && txType === "expense" && (
          <div>
            <label className={labelClass}>Parcelas</label>
            <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className={selectClass}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                <option key={n} value={n}>{n}x {n > 1 ? `de R$ ${(parseFloat(amount.replace(",",".")) / n).toFixed(2).replace(".",",")}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          {existing && (
            <button onClick={handleDelete} className="px-4 py-3 rounded-full bg-danger-red/10 text-danger-red font-semibold text-sm btn-scale">
              <span className="material-symbols-outlined text-sm align-middle">delete</span>
            </button>
          )}
          <button onClick={() => onClose()} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale disabled:opacity-50"
          >
            {existing ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
