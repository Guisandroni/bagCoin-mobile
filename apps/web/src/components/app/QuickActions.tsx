"use client";

import React from "react";
import Link from "next/link";

const quickActions = [
  { label: "Nova Transação", icon: "add_card", href: "#", color: "#9fe870" },
  { label: "Transferir", icon: "sync_alt", href: "#", color: "#163300" },
  { label: "Pagar Conta", icon: "receipt", href: "#", color: "#ffd11a" },
  { label: "Investir", icon: "trending_up", href: "#", color: "#d03238" },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <h3 className="font-display font-bold text-xl text-near-black mb-5">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-light-surface/50 hover:bg-light-surface transition-all duration-200 btn-scale group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <span className="material-symbols-outlined" style={{ color: action.color }}>
                {action.icon}
              </span>
            </div>
            <span className="text-xs font-semibold text-near-black text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
