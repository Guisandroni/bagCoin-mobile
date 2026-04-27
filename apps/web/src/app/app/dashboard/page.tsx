"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SummaryCards } from "@/components/app/SummaryCards";
import { RecentTransactions } from "@/components/app/RecentTransactions";
import { ExpenseChart } from "@/components/app/ExpenseChart";
import { GoalsSection } from "@/components/app/GoalsSection";
import { CardsSection } from "@/components/app/CardsSection";
import { WeeklyActivity } from "@/components/app/WeeklyActivity";
import { FutureTransactionsSection } from "@/components/app/FutureTransactionsSection";
import { TransactionModal } from "@/components/app/TransactionModal";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        title="Dashboard"
        subtitle="Bem-vindo de volta, aqui está o resumo das suas finanças"
      >
        <button
          onClick={() => setModalOpen(true)}
          className="bg-wise-green text-dark-green font-semibold px-6 py-3 rounded-full btn-scale flex items-center gap-2 text-sm shadow-lg shadow-wise-green/25 hover:shadow-xl hover:shadow-wise-green/30 transition-shadow"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Transação
        </button>
      </PageHeader>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <CardsSection />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart />
        <WeeklyActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsSection />
        <FutureTransactionsSection />
      </div>

      <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
