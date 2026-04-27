"use client";

import React from "react";

interface MonthNavigatorProps {
  selectedMonth: string;
  onChange: (month: string) => void;
}

const monthNamesShort = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthNavigator({ selectedMonth, onChange }: MonthNavigatorProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() => parseInt(selectedMonth.split("-")[0]));

  const goToPrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const goToCurrentMonth = () => {
    const now = new Date().toISOString().slice(0, 7);
    onChange(now);
    setViewYear(parseInt(now.split("-")[0]));
  };

  const selectMonth = (monthIndex: number) => {
    onChange(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setModalOpen(false);
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const label = `${monthNamesShort[month - 1]} ${year}`;
  const isCurrent = selectedMonth === new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={goToPrevMonth}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center btn-scale ring-shadow"
          aria-label="Mês anterior"
        >
          <span className="material-symbols-outlined text-sm text-warm-dark">chevron_left</span>
        </button>
        <button
          onClick={() => { setViewYear(year); setModalOpen(true); }}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors btn-scale ${
            isCurrent
              ? "bg-wise-green text-dark-green"
              : "bg-white text-near-black hover:bg-wise-green/20 ring-shadow"
          }`}
        >
          {label}
        </button>
        <button
          onClick={goToNextMonth}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center btn-scale ring-shadow"
          aria-label="Próximo mês"
        >
          <span className="material-symbols-outlined text-sm text-warm-dark">chevron_right</span>
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-transparent" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-[30px] p-6 md:p-8 w-full max-w-sm shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setViewYear((y) => y - 1)}
                className="w-10 h-10 rounded-full bg-light-surface flex items-center justify-center btn-scale"
              >
                <span className="material-symbols-outlined text-warm-dark">chevron_left</span>
              </button>
              <h3 className="font-display font-black text-xl text-near-black">{viewYear}</h3>
              <button
                onClick={() => setViewYear((y) => y + 1)}
                className="w-10 h-10 rounded-full bg-light-surface flex items-center justify-center btn-scale"
              >
                <span className="material-symbols-outlined text-warm-dark">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {monthNames.map((name, index) => {
                const isSelected = year === viewYear && month === index + 1;
                const isCurrentMonth = currentYear === viewYear && currentMonth === index;
                return (
                  <button
                    key={name}
                    onClick={() => selectMonth(index)}
                    className={`py-3 rounded-2xl text-sm font-semibold transition-all btn-scale ${
                      isSelected
                        ? "bg-wise-green text-dark-green"
                        : isCurrentMonth
                        ? "bg-light-surface text-near-black border-2 border-wise-green/50"
                        : "bg-light-surface text-gray hover:text-near-black hover:bg-wise-green/10"
                    }`}
                  >
                    {name.slice(0, 3)}
                    {isCurrentMonth && (
                      <span className="block text-[10px] font-medium mt-0.5 opacity-70">Atual</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full mt-6 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
