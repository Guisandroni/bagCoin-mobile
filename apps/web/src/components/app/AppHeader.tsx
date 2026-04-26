"use client";

import React from "react";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between py-4 px-2">
      <div>
        <h1 className="font-display font-black text-3xl text-near-black tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray mt-1">
          Bem-vindo de volta, aqui está o resumo das suas finanças
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-light-surface flex items-center justify-center btn-scale ring-shadow">
          <span className="material-symbols-outlined text-warm-dark">notifications</span>
        </button>
        <button className="w-10 h-10 rounded-full bg-light-surface flex items-center justify-center btn-scale ring-shadow">
          <span className="material-symbols-outlined text-warm-dark">settings</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-wise-green flex items-center justify-center">
          <span className="font-display font-bold text-dark-green text-sm">JD</span>
        </div>
      </div>
    </header>
  );
}
