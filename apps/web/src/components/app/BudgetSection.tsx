"use client";

import React from "react";

interface BudgetItem {
  category: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
}

const budgets: BudgetItem[] = [
  { category: "Alimentação", budgeted: 1500, spent: 1250, icon: "restaurant", color: "#9fe870" },
  { category: "Transporte", budgeted: 800, spent: 680, icon: "directions_car", color: "#163300" },
  { category: "Entretenimento", budgeted: 500, spent: 420, icon: "movie", color: "#ffd11a" },
  { category: "Saúde", budgeted: 400, spent: 380, icon: "health_and_safety", color: "#d03238" },
  { category: "Compras", budgeted: 600, spent: 210, icon: "shopping_bag", color: "#ffc091" },
];

export function BudgetSection() {
  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-xl text-near-black">Orçamento Mensal</h3>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-light-mint text-dark-green">
          Abril 2026
        </span>
      </div>
      <div className="space-y-4">
        {budgets.map((item) => {
          const percentage = Math.min((item.spent / item.budgeted) * 100, 100);
          const isOver = item.spent > item.budgeted;
          return (
            <div key={item.category} className="group">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-gray text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-near-black">{item.category}</span>
                    <span className="text-sm font-display font-bold text-near-black">
                      R$ {item.spent.toLocaleString("pt-BR")}
                      <span className="text-gray font-normal text-xs ml-1">
                        / R$ {item.budgeted.toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full h-2.5 bg-light-surface rounded-full overflow-hidden ml-9">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-danger-red" : ""}`}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isOver ? undefined : item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
