"use client";

import React from "react";
import { useFinance } from "@/hooks/useFinance";

interface SummaryCardProps {
  title: string;
  amount: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  color: "green" | "dark" | "orange";
  index: number;
}

const colorMap = {
  green: {
    bg: "bg-wise-green",
    text: "text-dark-green",
    iconBg: "bg-dark-green/10",
    iconColor: "text-dark-green",
    glow: "shadow-wise-green/20",
  },
  dark: {
    bg: "bg-near-black",
    text: "text-white",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    glow: "shadow-near-black/20",
  },
  orange: {
    bg: "bg-bright-orange",
    text: "text-near-black",
    iconBg: "bg-near-black/10",
    iconColor: "text-near-black",
    glow: "shadow-bright-orange/20",
  },
};

export function SummaryCard({ title, amount, trend, trendUp, icon, color, index }: SummaryCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={`${c.bg} rounded-3xl p-6 relative overflow-hidden card-lift shadow-lg ${c.glow} animate-scale-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Decorative circle */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${c.iconColor}`}>{icon}</span>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 ${c.text} backdrop-blur-sm`}>
            {trendUp ? "↗" : "↘"} {trend}
          </span>
        </div>
        <p className={`text-sm font-medium opacity-70 ${c.text} mb-1`}>{title}</p>
        <p className={`font-display font-black text-2xl ${c.text} tracking-tight`}>{amount}</p>
      </div>
    </div>
  );
}

export function SummaryCards() {
  const { totalBalance, totalIncomeForMonth, totalExpenseForMonth } = useFinance();

  const fmt = (n: number) =>
    `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <SummaryCard
        title="Saldo Disponível"
        amount={fmt(totalBalance)}
        trend="+12.5%"
        trendUp={true}
        icon="account_balance_wallet"
        color="green"
        index={0}
      />
      <SummaryCard
        title="Receitas do Mês"
        amount={fmt(totalIncomeForMonth)}
        trend="+5.2%"
        trendUp={true}
        icon="trending_up"
        color="dark"
        index={1}
      />
      <SummaryCard
        title="Despesas do Mês"
        amount={fmt(totalExpenseForMonth)}
        trend="-2.1%"
        trendUp={false}
        icon="trending_down"
        color="orange"
        index={2}
      />
    </div>
  );
}
