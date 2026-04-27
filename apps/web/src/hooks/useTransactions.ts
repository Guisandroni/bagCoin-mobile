"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, Transaction, TransactionSummary } from "@/lib/api";

export function useTransactions(month?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [txs, sum] = await Promise.all([
        apiClient.getTransactions(month),
        apiClient.getTransactionSummary(month),
      ]);
      setTransactions(txs.items);
      setSummary(sum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: Omit<Transaction, "id">) => {
    try {
      const newTx = await apiClient.createTransaction(data);
      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    } catch (err) {
      throw err;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await apiClient.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    transactions,
    summary,
    isLoading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
  };
}
