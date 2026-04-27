"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { TransactionModal } from "@/components/app/TransactionModal";
import { MonthNavigator } from "@/components/app/MonthNavigator";
import { Modal } from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";

export default function AccountsPage() {
  const { state, dispatch } = useFinance();
  const { showToast } = useToast();
  const { selectedMonth, setSelectedMonth } = useMonthFilter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [accountModal, setAccountModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<string | null>(null);

  const [newAccountName, setNewAccountName] = React.useState("");
  const [newAccountBank, setNewAccountBank] = React.useState("");
  const [newAccountBalance, setNewAccountBalance] = React.useState("");
  const [newAccountColor, setNewAccountColor] = React.useState("#9fe870");

  const colors = ["#9fe870", "#163300", "#ffd11a", "#ffc091", "#d03238", "#56c2ff", "#868685"];

  const selectedAccount = state.accounts.find((a) => a.id === state.selectedAccountId);
  const accountTransactions = selectedAccount
    ? state.transactions.filter((t) => t.accountId === selectedAccount.id)
    : [];

  const resetForm = () => {
    setNewAccountName("");
    setNewAccountBank("");
    setNewAccountBalance("");
    setNewAccountColor("#9fe870");
    setEditingAccount(null);
  };

  const handleOpenAccountModal = (accountId?: string) => {
    if (accountId) {
      const acc = state.accounts.find((a) => a.id === accountId);
      if (acc) {
        setNewAccountName(acc.name);
        setNewAccountBank(acc.bankName);
        setNewAccountBalance(acc.balance.toString());
        setNewAccountColor(acc.color);
        setEditingAccount(accountId);
      }
    } else {
      resetForm();
    }
    setAccountModal(true);
  };

  const handleCreateOrUpdate = () => {
    const balance = parseFloat(newAccountBalance.replace(",", ".")) || 0;
    if (!newAccountName || !newAccountBank) {
      showToast("Preencha nome e banco", "error");
      return;
    }

    if (editingAccount) {
      dispatch({
        type: "UPDATE_ACCOUNT",
        payload: {
          id: editingAccount,
          name: newAccountName,
          bankName: newAccountBank,
          balance,
          color: newAccountColor,
          icon: "account_balance",
        },
      });
      showToast("Conta atualizada!");
    } else {
      dispatch({
        type: "ADD_ACCOUNT",
        payload: {
          id: `acc-${Date.now()}`,
          name: newAccountName,
          bankName: newAccountBank,
          balance,
          color: newAccountColor,
          icon: "account_balance",
        },
      });
      showToast("Conta criada com sucesso!");
    }
    setAccountModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_ACCOUNT", payload: id });
    showToast("Conta excluída", "warning");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Contas Bancárias"
        subtitle="Gerencie suas contas e saldos"
      >
        <button
          onClick={() => setModalOpen(true)}
          className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Transação
        </button>
      </PageHeader>

      <MonthNavigator selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.accounts.map((account) => {
          const isSelected = state.selectedAccountId === account.id;
          const txs = state.transactions.filter((t) => t.accountId === account.id);
          const income = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
          const expense = txs.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);

          return (
            <div
              key={account.id}
              className={`text-left p-6 rounded-3xl transition-all duration-200 card-lift cursor-pointer relative group ${
                isSelected ? "bg-wise-green text-dark-green ring-2 ring-wise-green" : "bg-white text-near-black ring-shadow"
              }`}
            >
              <div onClick={() => dispatch({ type: "SELECT_ACCOUNT", payload: isSelected ? null : account.id })}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: isSelected ? "rgba(22,51,0,0.15)" : `${account.color}20` }}>
                    <span className="material-symbols-outlined text-2xl" style={{ color: isSelected ? "#163300" : account.color }}>{account.icon}</span>
                  </div>
                  <span className="text-xs font-semibold opacity-60">{account.bankName}</span>
                </div>
                <p className={`font-display font-black text-2xl mb-1 ${isSelected ? "text-dark-green" : "text-near-black"}`}>
                  R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm font-medium mb-3 ${isSelected ? "text-dark-green/70" : "text-gray"}`}>{account.name}</p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className={isSelected ? "text-dark-green/70" : "text-positive-green"}>+R$ {income.toLocaleString("pt-BR")}</span>
                  <span className={isSelected ? "text-dark-green/70" : "text-danger-red"}>-R$ {expense.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleOpenAccountModal(account.id); }} className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-sm">
                  <span className="material-symbols-outlined text-xs text-gray">edit</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }} className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white shadow-sm">
                  <span className="material-symbols-outlined text-xs text-gray">delete</span>
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => handleOpenAccountModal()}
          className="p-6 rounded-3xl border-2 border-dashed border-light-surface text-gray hover:border-wise-green hover:text-dark-green transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
        >
          <span className="material-symbols-outlined text-3xl">add_circle</span>
          <span className="font-semibold text-sm">Adicionar Conta</span>
        </button>
      </div>

      {selectedAccount && (
        <div className="bg-white rounded-3xl p-6 ring-shadow animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-xl text-near-black">Transações — {selectedAccount.name}</h3>
          </div>
          <div className="space-y-2">
            {accountTransactions.length === 0 && (
              <p className="text-gray text-center py-8">Nenhuma transação nesta conta</p>
            )}
            {accountTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-light-surface transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "income" ? "bg-positive-green/10" : "bg-danger-red/10"}`}>
                  <span className={`material-symbols-outlined ${tx.type === "income" ? "text-positive-green" : "text-danger-red"}`}>
                    {tx.type === "income" ? "trending_up" : "trending_down"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-near-black text-sm">{tx.name}</p>
                  <p className="text-xs text-gray">{tx.category} · {tx.date}</p>
                </div>
                <span className={`font-display font-bold text-sm ${tx.type === "income" ? "text-positive-green" : "text-near-black"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={accountModal} onClose={() => { setAccountModal(false); resetForm(); }} title={editingAccount ? "Editar Conta" : "Nova Conta"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Nome da conta</label>
            <input type="text" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Ex: Conta Principal" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Banco</label>
            <input type="text" value={newAccountBank} onChange={(e) => setNewAccountBank(e.target.value)} placeholder="Ex: Nubank" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Saldo inicial</label>
            <input type="text" value={newAccountBalance} onChange={(e) => setNewAccountBalance(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setNewAccountColor(c)} className={`w-8 h-8 rounded-full transition-all ${newAccountColor === c ? "ring-2 ring-offset-2 ring-near-black" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {editingAccount && (
              <button onClick={() => { handleDelete(editingAccount); setAccountModal(false); resetForm(); }} className="px-4 py-3 rounded-full bg-danger-red/10 text-danger-red font-semibold text-sm">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button onClick={() => { setAccountModal(false); resetForm(); }} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm">Cancelar</button>
            <button onClick={handleCreateOrUpdate} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm">{editingAccount ? "Salvar" : "Criar"}</button>
          </div>
        </div>
      </Modal>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
