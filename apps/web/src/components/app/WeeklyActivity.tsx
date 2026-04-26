"use client";

import React from "react";

interface ActivityItem {
  day: string;
  amount: number;
  type: "income" | "expense";
}

const activities: ActivityItem[] = [
  { day: "Seg", amount: 320, type: "expense" },
  { day: "Ter", amount: 150, type: "income" },
  { day: "Qua", amount: 480, type: "expense" },
  { day: "Qui", amount: 200, type: "income" },
  { day: "Sex", amount: 650, type: "expense" },
  { day: "Sáb", amount: 120, type: "expense" },
  { day: "Dom", amount: 80, type: "expense" },
];

const maxAmount = Math.max(...activities.map((a) => a.amount));

export function WeeklyActivity() {
  return (
    <div className="bg-white rounded-3xl p-6 ring-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-xl text-near-black">Atividade Semanal</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-wise-green" />
            <span className="text-xs text-gray">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-near-black" />
            <span className="text-xs text-gray">Despesas</span>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 h-40">
        {activities.map((activity) => (
          <div key={activity.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center gap-1 h-32">
              <div
                className={`w-full max-w-6 rounded-t-lg transition-all duration-500 hover:opacity-80 ${
                  activity.type === "income" ? "bg-wise-green" : "bg-near-black"
                }`}
                style={{ height: `${(activity.amount / maxAmount) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray">{activity.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
