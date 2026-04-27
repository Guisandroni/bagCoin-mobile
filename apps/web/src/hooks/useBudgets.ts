"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, Budget } from "@/lib/api";

export function useBudgets(year?: number, month?: number) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getBudgets(year, month);
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch budgets");
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    isLoading,
    error,
    refetch: fetchBudgets,
  };
}
