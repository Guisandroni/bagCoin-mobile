"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { Modal } from "@/components/app/Modal";
import { useToast } from "@/components/app/Toast";

export default function BudgetPage() {
  const { state, dispatch } = useFinance();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [category, setCategory] = React.useState("");
  const [budgeted, setBudgeted] = React.useState("");
  const [spent, setSpent] = React.useState("");
  const [icon, setIcon] = React.useState("restaurant");
  const [color, setColor] = React.useState("#9fe870");
  const [subcategories, setSubcategories] = React.useState("");

  const colors = ["#9fe870", "#163300", "#ffd11a", "#ffc091", "#d03238", "#56c2ff", "#868685"];
  const icons = ["restaurant", "directions_car", "home", "movie", "health_and_safety", "shopping_bag", "payments", "school"];

  const totalBudgeted = state.budgets.reduce((acc, b) => acc + b.budgeted, 0);
  const totalSpent = state.budgets.reduce((acc, b) => acc + b.spent, 0);

  const resetForm = () => {
    setCategory("");
    setBudgeted("");
    setSpent("");
    setIcon("restaurant");
    setColor("#9fe870");
    setSubcategories("");
    setEditingId(null);
  };

  const handleOpenModal = (budgetId?: string) => {
    if (budgetId) {
      const item = state.budgets.find((b) => b.id === budgetId);
      if (item) {
        setCategory(item.category);
        setBudgeted(item.budgeted.toString());
        setSpent(item.spent.toString());
        setIcon(item.icon);
        setColor(item.color);
        setSubcategories(item.subcategories.join(", "));
        setEditingId(budgetId);
      }
    } else {
      resetForm();
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const bud = parseFloat(budgeted.replace(",", "."));
    const sp = parseFloat(spent.replace(",", "."));
    if (!category || !bud) {
      showToast("Preencha categoria e orçamento", "error");
      return;
    }

    const item = {
      category,
      budgeted: bud,
      spent: sp || 0,
      icon,
      color,
      subcategories: subcategories.split(",").map((s) => s.trim()).filter(Boolean),
    };

    if (editingId) {
      dispatch({ type: "UPDATE_BUDGET", payload: { id: editingId, ...item } });
      showToast("Orçamento atualizado!");
    } else {
      dispatch({ type: "ADD_BUDGET", payload: { id: `budget-${Date.now()}`, ...item } });
      showToast("Orçamento criado!");
    }
    setModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_BUDGET", payload: id });
    showToast("Orçamento excluído", "warning");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Orçamento"
        subtitle="Controle seus gastos por categoria"
      >
        <button
          onClick={() => handleOpenModal()}
          className="bg-wise-green text-dark-green font-semibold px-5 py-2.5 rounded-full btn-scale flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Categoria
        </button>
      </PageHeader>

      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray mb-1">Orçamento total do mês</p>
            <p className="font-display font-black text-3xl text-near-black">
              R$ {totalBudgeted.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray mb-1">Gasto</p>
              <p className="font-display font-bold text-xl text-near-black">
                R$ {totalSpent.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray mb-1">Restante</p>
              <p className="font-display font-bold text-xl text-positive-green">
                R$ {(totalBudgeted - totalSpent).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="w-20 h-20 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e8ebe6" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#9fe870" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${Math.min((totalSpent / totalBudgeted) * 251, 251)} 251`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-sm text-near-black">
                  {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.budgets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 ring-shadow text-center">
          <span className="material-symbols-outlined text-5xl text-gray mb-4">account_balance_wallet</span>
          <p className="text-gray text-lg font-medium">Nenhum orçamento cadastrado</p>
          <p className="text-sm text-gray mt-2">Crie categorias para controlar seus gastos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.budgets.map((item) => {
            const percentage = item.budgeted > 0 ? Math.min((item.spent / item.budgeted) * 100, 100) : 0;
            const isOver = item.spent > item.budgeted;
            const remaining = item.budgeted - item.spent;
            return (
              <div key={item.id} className="bg-white rounded-3xl p-6 ring-shadow card-lift group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <span className="material-symbols-outlined" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-near-black">{item.category}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(item.id)} className="w-7 h-7 rounded-full bg-light-surface flex items-center justify-center hover:bg-wise-green/20">
                          <span className="material-symbols-outlined text-xs text-gray">edit</span>
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-full bg-light-surface flex items-center justify-center hover:bg-danger-red/10">
                          <span className="material-symbols-outlined text-xs text-gray">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-display font-bold text-near-black">R$ {item.spent.toLocaleString("pt-BR")}</span>
                  <span className="text-sm text-gray">R$ {item.budgeted.toLocaleString("pt-BR")}</span>
                </div>
                <div className="w-full h-2.5 bg-light-surface rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-danger-red" : ""}`} style={{ width: `${percentage}%`, backgroundColor: isOver ? undefined : item.color }} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.subcategories.map((sub) => (
                    <span key={sub} className="text-xs font-medium px-3 py-1.5 rounded-full bg-light-surface text-warm-dark">{sub}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingId ? "Editar Orçamento" : "Novo Orçamento"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Categoria</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Alimentação" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Orçado</label>
              <input type="text" value={budgeted} onChange={(e) => setBudgeted(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Gasto</label>
              <input type="text" value={spent} onChange={(e) => setSpent(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-2 block">Subcategorias (separadas por vírgula)</label>
            <input type="text" value={subcategories} onChange={(e) => setSubcategories(e.target.value)} placeholder="Ex: Mercado, Restaurantes, Delivery" className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black" />
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
