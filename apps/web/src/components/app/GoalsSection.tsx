"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

export function GoalsSection() {
  const { state } = useFinance();

  return (
    <div className="bg-white rounded-[30px] p-6 ring-shadow card-lift animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-xl text-near-black">Metas</h3>
          <p className="text-xs text-gray mt-0.5">{state.goals.length} objetivos ativos</p>
        </div>
        <a href="/app/metas" className="text-sm font-semibold text-dark-green bg-wise-green/10 px-4 py-2 rounded-full btn-scale hover:bg-wise-green/20 transition-colors">
          Ver todas
        </a>
      </div>

      {state.goals.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-light-surface flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl text-gray">flag</span>
          </div>
          <p className="text-gray font-medium text-sm">Nenhuma meta cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {state.goals.slice(0, 3).map((goal, i) => {
            const percentage = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
            return (
              <div key={goal.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: goal.color }}>{goal.icon}</span>
                    </div>
                    <span className="font-semibold text-near-black text-sm">{goal.title}</span>
                  </div>
                  <span className="font-display font-bold text-sm" style={{ color: goal.color }}>{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-light-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: goal.color }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-gray">R$ {goal.current.toLocaleString("pt-BR")}</span>
                  <span className="text-[11px] text-gray">R$ {goal.target.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
