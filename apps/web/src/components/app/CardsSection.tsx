"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";
import { TransactionModal } from "@/components/app/TransactionModal";

export function CardsSection() {
  const { state, dispatch } = useFinance();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [payModal, setPayModal] = React.useState<{ cardId: string; amount: number } | null>(null);

  const handlePayInvoice = (cardId: string) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card || card.used <= 0) return;
    const account = state.accounts[0];
    if (!account) return;
    dispatch({
      type: "PAY_INVOICE",
      payload: { accountId: account.id, cardId, amount: card.used },
    });
    setPayModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-xl text-near-black">Meus Cartões</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center btn-scale hover:bg-wise-green/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-gray">add</span>
        </button>
      </div>

      {state.cards.length === 0 ? (
        <div className="bg-white rounded-[30px] p-8 ring-shadow text-center">
          <span className="material-symbols-outlined text-4xl text-gray mb-2">credit_card</span>
          <p className="text-gray text-sm font-medium">Nenhum cartão cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.cards.map((card, i) => {
            const percentage = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
            return (
              <div
                key={card.id}
                className="bg-white rounded-[24px] p-5 ring-shadow card-lift animate-scale-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <span className="material-symbols-outlined" style={{ color: card.color }}>
                        {card.flag === "mastercard" ? "credit_card" : "credit_score"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-near-black text-sm">{card.name}</p>
                      <p className="text-xs text-gray">Vencimento dia {card.dueDate}</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-sm text-near-black">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-light-surface rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: card.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray">R$ {card.used.toLocaleString("pt-BR")}</span>
                  <span className="text-gray">R$ {card.limit.toLocaleString("pt-BR")}</span>
                </div>
                {card.used > 0 && state.accounts.length > 0 && (
                  <button
                    onClick={() => setPayModal({ cardId: card.id, amount: card.used })}
                    className="w-full mt-4 py-2.5 rounded-xl bg-wise-green text-dark-green text-xs font-bold btn-scale"
                  >
                    Pagar fatura
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-transparent" onClick={() => setPayModal(null)} />
          <div className="relative bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="font-display font-bold text-xl text-near-black mb-4">Pagar Fatura</h3>
            <p className="text-sm text-gray mb-4">
              Pagar R$ {payModal.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} da fatura usando conta {state.accounts[0]?.name}?
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale">Cancelar</button>
              <button onClick={() => handlePayInvoice(payModal.cardId)} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
