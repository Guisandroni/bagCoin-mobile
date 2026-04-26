"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

const categoryColors: Record<string, string> = {
  Alimentação: "#9fe870",
  Transporte: "#163300",
  Moradia: "#ffd11a",
  Entretenimento: "#ffc091",
  Saúde: "#d03238",
  Compras: "#868685",
  Renda: "#054d28",
  "Renda Extra": "#cdffad",
  Educação: "#56c2ff",
  Outros: "#454745",
};

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

interface ExpenseChartProps {
  month?: string;
}

export function ExpenseChart({ month }: ExpenseChartProps) {
  const { state } = useFinance();
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const monthTxs = state.transactions.filter((t) => t.date.startsWith(targetMonth));

  const expensesByCategory = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, amount]) => ({
      name,
      amount,
      color: categoryColors[name] || "#868685",
      icon: categoryIcons[name] || "receipt",
    }));

  const total = categories.reduce((acc, cat) => acc + cat.amount, 0);
  let currentAngle = 0;

  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <h3 className="font-display font-bold text-xl text-near-black mb-6">Despesas por Categoria</h3>
      {categories.length === 0 ? (
        <p className="text-gray text-center py-8">Nenhuma despesa este mês</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {categories.map((cat) => {
                const percentage = cat.amount / total;
                const angle = percentage * 360;
                const startAngle = currentAngle;
                currentAngle += angle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = ((startAngle + angle) * Math.PI) / 180;
                const x1 = 50 + 35 * Math.cos(startRad);
                const y1 = 50 + 35 * Math.sin(startRad);
                const x2 = 50 + 35 * Math.cos(endRad);
                const y2 = 50 + 35 * Math.sin(endRad);
                const largeArc = angle > 180 ? 1 : 0;
                return (
                  <path
                    key={cat.name}
                    d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={cat.color}
                    stroke="white"
                    strokeWidth="2"
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
              <circle cx="50" cy="50" r="22" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-display font-black text-lg text-near-black">{categories.length}</p>
                <p className="text-[10px] text-gray font-medium">categorias</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3 w-full">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="material-symbols-outlined text-gray text-lg">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-near-black">{cat.name}</span>
                    <span className="text-sm font-display font-bold text-near-black">
                      R$ {cat.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-light-surface rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(cat.amount / total) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
