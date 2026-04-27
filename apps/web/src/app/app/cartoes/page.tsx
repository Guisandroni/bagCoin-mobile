"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { TransactionModal } from "@/components/app/TransactionModal";
import { MonthNavigator } from "@/components/app/MonthNavigator";
import { Modal } from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";

export default function CardsPage() {
  const { state, dispatch } = useFinance();
  const { showToast } = useToast();
  const { selectedMonth, setSelectedMonth } = useMonthFilter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [payModal, setPayModal] = React.useState<string | null>(null);
  const [cardModal, setCardModal] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<string | null>(null);

  const [newCardName, setNewCardName] = React.useState("");
  const [newCardLimit, setNewCardLimit] = React.useState("");
  const [newCardDueDate, setNewCardDueDate] = React.useState("15");
  const [newCardClosingDay, setNewCardClosingDay] = React.useState("7");
  const [newCardColor, setNewCardColor] = React.useState("#454745");

  const colors = ["#454745", "#163300", "#0e0f0c", "#d03238", "#163300", "#9fe870"];

  const resetForm = () => {
    setNewCardName("");
    setNewCardLimit("");
    setNewCardDueDate("15");
    setNewCardClosingDay("7");
    setNewCardColor("#454745");
    setEditingCard(null);
  };

  const handleOpenCardModal = (cardId?: string) => {
    if (cardId) {
      const card = state.cards.find((c) => c.id === cardId);
      if (card) {
        setNewCardName(card.name);
        setNewCardLimit(card.limit.toString());
        setNewCardDueDate(card.dueDate.toString());
        setNewCardClosingDay(card.closingDay.toString());
        setNewCardColor(card.color);
        setEditingCard(cardId);
      }
    } else {
      resetForm();
    }
    setCardModal(true);
  };

  const handlePayInvoice = (cardId: string) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card || card.used <= 0) return;
    const account = state.accounts[0];
    if (!account) return;
    dispatch({
      type: "PAY_INVOICE",
      payload: { accountId: account.id, cardId, amount: card.used },
    });
    showToast("Fatura paga com sucesso!");
    setPayModal(null);
  };

  const handleCreateOrUpdate = () => {
    const limit = parseFloat(newCardLimit.replace(",", ".")) || 0;
    if (!newCardName || limit <= 0) {
      showToast("Preencha nome e limite", "error");
      return;
    }

    if (editingCard) {
      const existing = state.cards.find((c) => c.id === editingCard);
      dispatch({
        type: "UPDATE_CARD",
        payload: {
          id: editingCard,
          name: newCardName,
          limit,
          used: existing?.used || 0,
          dueDate: parseInt(newCardDueDate),
          closingDay: parseInt(newCardClosingDay),
          color: newCardColor,
          flag: "visa",
        },
      });
      showToast("Cartão atualizado!");
    } else {
      dispatch({
        type: "ADD_CARD",
        payload: {
          id: `card-${Date.now()}`,
          name: newCardName,
          limit,
          used: 0,
          dueDate: parseInt(newCardDueDate),
          closingDay: parseInt(newCardClosingDay),
          color: newCardColor,
          flag: "visa",
        },
      });
      showToast("Cartão criado com sucesso!");
    }
    setCardModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_CARD", payload: id });
    showToast("Cartão excluído", "warning");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Cartões"
        subtitle="Gerencie seus cartões de crédito e débito"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCardModal()}
            className="bg-light-surface text-near-black font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Adicionar Cartão
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Despesa
          </button>
        </div>
      </PageHeader>

      <MonthNavigator selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.cards.map((card) => {
          const percentage = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
          const cardTxs = state.transactions.filter((t) => t.cardId === card.id);
          return (
            <div key={card.id} className="space-y-4">
              <div className="relative group">
                <div
                  className="relative overflow-hidden rounded-3xl p-6 text-white aspect-[1.58/1] flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl"
                  style={{ backgroundColor: card.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-lg">{card.name}</span>
                    <span className="material-symbols-outlined text-3xl opacity-80">{card.flag === "mastercard" ? "credit_card" : "credit_score"}</span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl tracking-wider mb-3">•••• {card.id.slice(-4)}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] opacity-60 uppercase tracking-wider">Vencimento</p>
                        <p className="text-xs font-semibold">Dia {card.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60 uppercase tracking-wider">Fechamento</p>
                        <p className="text-xs font-semibold">Dia {card.closingDay}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenCardModal(card.id)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
                    <span className="material-symbols-outlined text-sm text-white">edit</span>
                  </button>
                  <button onClick={() => handleDelete(card.id)} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
                    <span className="material-symbols-outlined text-sm text-white">delete</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 ring-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray">Limite utilizado</span>
                  <span className="font-display font-bold text-near-black">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-light-surface rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-wise-green rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-near-black">R$ {card.used.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <span className="text-gray">R$ {card.limit.toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-light-surface">
                  <p className="text-xs text-gray mb-2">{cardTxs.length} transações este mês</p>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 rounded-xl bg-light-surface text-near-black text-xs font-semibold btn-scale">Ver fatura</button>
                    {card.used > 0 && state.accounts.length > 0 && (
                      <button onClick={() => setPayModal(card.id)} className="flex-1 py-2 rounded-xl bg-wise-green text-dark-green text-xs font-bold btn-scale">Pagar fatura</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {payModal && (
        <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Pagar Fatura" maxWidth="max-w-sm">
          <div className="space-y-4">
            <p className="text-sm text-gray">
              Pagar fatura do cartão usando conta {state.accounts[0]?.name}?
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm">Cancelar</button>
              <button onClick={() => handlePayInvoice(payModal)} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm">Confirmar</button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={cardModal} onClose={() => { setCardModal(false); resetForm(); }} title={editingCard ? "Editar Cartão" : "Novo Cartão"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Nome</label>
            <input type="text" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} placeholder="Ex: Platinum" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Limite</label>
            <input type="text" value={newCardLimit} onChange={(e) => setNewCardLimit(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Vencimento</label>
              <select value={newCardDueDate} onChange={(e) => setNewCardDueDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black">
                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>Dia {i + 1}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Fechamento</label>
              <select value={newCardClosingDay} onChange={(e) => setNewCardClosingDay(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black">
                {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>Dia {i + 1}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setNewCardColor(c)} className={`w-8 h-8 rounded-full transition-all ${newCardColor === c ? "ring-2 ring-offset-2 ring-near-black" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {editingCard && (
              <button onClick={() => { handleDelete(editingCard); setCardModal(false); resetForm(); }} className="px-4 py-3 rounded-full bg-danger-red/10 text-danger-red font-semibold text-sm">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button onClick={() => { setCardModal(false); resetForm(); }} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm">Cancelar</button>
            <button onClick={handleCreateOrUpdate} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm">{editingCard ? "Salvar" : "Criar"}</button>
          </div>
        </div>
      </Modal>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
