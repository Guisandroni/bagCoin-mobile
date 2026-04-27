"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { useMonthFilter } from "@/hooks/useMonthFilter";
import { MonthNavigator } from "@/components/app/MonthNavigator";
import { HistoricalComparison } from "@/components/app/HistoricalComparison";
import { WeekdaySpendingChart } from "@/components/app/WeekdaySpendingChart";
import { BudgetVsActual } from "@/components/app/BudgetVsActual";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

const monthlyData: MonthlyData[] = [
  { month: "Jan", income: 7200, expense: 4100 },
  { month: "Fev", income: 7500, expense: 3900 },
  { month: "Mar", income: 8100, expense: 4500 },
  { month: "Abr", income: 8500, expense: 4230 },
  { month: "Mai", income: 7800, expense: 3800 },
  { month: "Jun", income: 9200, expense: 5100 },
];

const maxValue = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)));

export default function ReportsPage() {
  const { state } = useFinance();
  const { selectedMonth, setSelectedMonth, getTransactionsForMonth } = useMonthFilter();

  const monthTxs = getTransactionsForMonth(state.transactions);
  const totalIncomeForMonth = monthTxs
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseForMonth = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const savingsRate = totalIncomeForMonth > 0 ? ((totalIncomeForMonth - totalExpenseForMonth) / totalIncomeForMonth) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Relatórios"
        subtitle="Visão geral das suas finanças"
      >
        <MonthNavigator selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-full bg-near-black text-white text-sm font-semibold btn-scale">
            Mensal
          </button>
          <button className="px-4 py-2 rounded-full bg-white text-gray text-sm font-semibold ring-shadow btn-scale hover:text-near-black">
            Anual
          </button>
        </div>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 ring-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-positive-green">trending_up</span>
              <span className="text-sm text-gray">Total de Receitas</span>
            </div>
            <span className="text-xs font-semibold text-positive-green">↗ 100.0%</span>
          </div>
          <p className="font-display font-black text-3xl text-near-black">
            R$ {totalIncomeForMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 ring-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-danger-red">trending_down</span>
              <span className="text-sm text-gray">Total de Despesas</span>
            </div>
            <span className="text-xs font-semibold text-danger-red">↗ 100.0%</span>
          </div>
          <p className="font-display font-black text-3xl text-near-black">
            R$ {totalExpenseForMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 ring-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray">Saldo</span>
            <span className="text-xs font-semibold text-positive-green">↗ 100.0%</span>
          </div>
          <p className="font-display font-black text-3xl text-positive-green">
            R$ {(totalIncomeForMonth - totalExpenseForMonth).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="material-symbols-outlined text-gray text-sm">savings</span>
            <span className="text-xs text-gray">Taxa de poupança: {savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 ring-shadow border-l-4 border-positive-green">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-positive-green mt-0.5">savings</span>
            <div>
              <p className="font-display font-bold text-near-black">Taxa de Poupança Excelente</p>
              <p className="text-sm text-gray mt-1">
                Você está economizando {savingsRate.toFixed(1)}% da sua receita. Continue assim!
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 ring-shadow border-l-4 border-wise-green">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-dark-green mt-0.5">target</span>
            <div>
              <p className="font-display font-bold text-near-black">Categoria Dominante</p>
              <p className="text-sm text-gray mt-1">
                Aluguel representa a maior parte das despesas. Considere diversificar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 ring-shadow">
          <h3 className="font-display font-bold text-xl text-near-black mb-6">Comparativo Anual</h3>
          <div className="flex items-end justify-between gap-2 h-56 px-2">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div
                    className="w-full max-w-8 bg-wise-green rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                    style={{ height: `${(data.income / maxValue) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-near-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      R$ {data.income.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div
                    className="w-full max-w-8 bg-danger-red rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                    style={{ height: `${(data.expense / maxValue) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-near-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      R$ {data.expense.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-wise-green" />
              <span className="text-sm text-gray">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger-red" />
              <span className="text-sm text-gray">Despesas</span>
            </div>
          </div>
        </div>

        <WeekdaySpendingChart month={selectedMonth} />
      </div>

      <HistoricalComparison />

      <BudgetVsActual month={selectedMonth} />
    </div>
  );
}
