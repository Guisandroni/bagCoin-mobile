"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { Modal } from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";

export default function GoalsPage() {
  const { state, dispatch } = useFinance();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [addAmount, setAddAmount] = React.useState("");
  const [addToGoalId, setAddToGoalId] = React.useState<string | null>(null);

  // Form state
  const [title, setTitle] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [current, setCurrent] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [icon, setIcon] = React.useState("flag");
  const [color, setColor] = React.useState("#9fe870");

  const colors = ["#9fe870", "#163300", "#ffd11a", "#ffc091", "#d03238", "#56c2ff", "#868685"];
  const icons = ["flag", "flight", "laptop_mac", "shield", "apartment", "directions_car", "restaurant", "school"];

  const resetForm = () => {
    setTitle("");
    setTarget("");
    setCurrent("");
    setDeadline("");
    setIcon("flag");
    setColor("#9fe870");
    setEditingId(null);
  };

  const handleOpenModal = (goalId?: string) => {
    if (goalId) {
      const goal = state.goals.find((g) => g.id === goalId);
      if (goal) {
        setTitle(goal.title);
        setTarget(goal.target.toString());
        setCurrent(goal.current.toString());
        setDeadline(goal.deadline);
        setIcon(goal.icon);
        setColor(goal.color);
        setEditingId(goalId);
      }
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const tgt = parseFloat(target.replace(",", "."));
    const cur = parseFloat(current.replace(",", "."));
    if (!title || !tgt || !deadline) {
      showToast("Preencha todos os campos", "error");
      return;
    }
    const monthly = Math.ceil((tgt - cur) / 12);

    if (editingId) {
      dispatch({
        type: "UPDATE_GOAL",
        payload: {
          id: editingId,
          title,
          target: tgt,
          current: cur,
          deadline,
          icon,
          color,
          monthly,
        },
      });
      showToast("Meta atualizada!");
    } else {
      dispatch({
        type: "ADD_GOAL",
        payload: {
          id: `goal-${Date.now()}`,
          title,
          target: tgt,
          current: cur,
          deadline,
          icon,
          color,
          monthly,
        },
      });
      showToast("Meta criada com sucesso!");
    }
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_GOAL", payload: id });
    showToast("Meta excluída", "warning");
  };

  const handleAddContribution = () => {
    if (!addToGoalId || !addAmount) return;
    const amt = parseFloat(addAmount.replace(",", "."));
    if (!amt || amt <= 0) return;
    dispatch({ type: "ADD_CONTRIBUTION", payload: { goalId: addToGoalId, amount: amt } });
    showToast("Contribuição adicionada!");
    setAddToGoalId(null);
    setAddAmount("");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Metas"
        subtitle="Acompanhe e gerencie seus objetivos financeiros"
      >
        <button
          onClick={() => handleOpenModal()}
          className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Meta
        </button>
      </PageHeader>

      {state.goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 ring-shadow text-center">
          <span className="material-symbols-outlined text-5xl text-gray mb-4">flag</span>
          <p className="text-gray text-lg font-medium">Nenhuma meta cadastrada</p>
          <p className="text-sm text-gray mt-2">Crie uma meta para começar a economizar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.goals.map((goal) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const remaining = goal.target - goal.current;
            return (
              <div key={goal.id} className="bg-white rounded-3xl p-6 ring-shadow card-lift group">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                      <span className="material-symbols-outlined text-2xl" style={{ color: goal.color }}>{goal.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-near-black">{goal.title}</h3>
                      <p className="text-xs text-gray">Prazo: {goal.deadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(goal.id)} className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center hover:bg-wise-green/20 transition-colors">
                      <span className="material-symbols-outlined text-sm text-gray">edit</span>
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center hover:bg-danger-red/10 transition-colors">
                      <span className="material-symbols-outlined text-sm text-gray">delete</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-3 bg-light-surface rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: goal.color }} />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-light-surface/50 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-gray uppercase tracking-wider mb-1">Atual</p>
                    <p className="font-display font-bold text-sm text-near-black">R$ {goal.current.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-light-surface/50 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-gray uppercase tracking-wider mb-1">Meta</p>
                    <p className="font-display font-bold text-sm text-near-black">R$ {goal.target.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-light-surface/50 rounded-2xl p-3 text-center">
                    <p className="text-[10px] text-gray uppercase tracking-wider mb-1">Falta</p>
                    <p className="font-display font-bold text-sm text-near-black">R$ {remaining.toLocaleString("pt-BR")}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-light-surface">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray text-sm">calendar_month</span>
                    <span className="text-xs text-gray">R$ {goal.monthly.toLocaleString("pt-BR")}/mês</span>
                  </div>
                  <button
                    onClick={() => setAddToGoalId(goal.id)}
                    className="px-4 py-2 rounded-full bg-wise-green text-dark-green text-xs font-bold btn-scale"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contribution Modal */}
      {addToGoalId && (
        <Modal isOpen={!!addToGoalId} onClose={() => { setAddToGoalId(null); setAddAmount(""); }} title="Adicionar Contribuição">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Valor</label>
              <input type="text" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setAddToGoalId(null); setAddAmount(""); }} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm">Cancelar</button>
              <button onClick={handleAddContribution} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm">Adicionar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingId ? "Editar Meta" : "Nova Meta"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Viagem Japão" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Valor Meta</label>
              <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Valor Atual</label>
              <input type="text" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Prazo</label>
            <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Ex: Dez 2026" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === ic ? "bg-wise-green text-dark-green" : "bg-light-surface text-gray hover:text-near-black"}`}>
                  <span className="material-symbols-outlined">{ic}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-near-black" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {editingId && (
              <button onClick={() => { handleDelete(editingId); setModalOpen(false); resetForm(); }} className="px-4 py-3 rounded-full bg-danger-red/10 text-danger-red font-semibold text-sm">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm">Cancelar</button>
            <button onClick={handleSubmit} className="flex-1 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm">{editingId ? "Salvar" : "Criar"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
