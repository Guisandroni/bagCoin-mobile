"use client";

import React from "react";
import { Transaction } from "./useFinance";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function useMonthFilter(initialMonth?: string) {
  const [selectedMonth, setSelectedMonth] = React.useState(
    initialMonth || new Date().toISOString().slice(0, 7)
  );

  const goToPrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const getTransactionsForMonth = (transactions: Transaction[]) => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = `${monthNames[month - 1]} ${year}`;
  const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);

  return {
    selectedMonth,
    setSelectedMonth,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    getTransactionsForMonth,
    monthLabel,
    isCurrentMonth,
    monthNames,
  };
}
