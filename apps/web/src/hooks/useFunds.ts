"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, Fund } from "@/lib/api";

export function useFunds() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getFunds();
      setFunds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch funds");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const createFund = async (data: Omit<Fund, "id">) => {
    try {
      const newFund = await apiClient.createFund(data);
      setFunds((prev) => [...prev, newFund]);
      return newFund;
    } catch (err) {
      throw err;
    }
  };

  const addContribution = async (fundId: number, amount: number, note?: string) => {
    try {
      await apiClient.addContribution(fundId, amount, note);
      await fetchFunds();
    } catch (err) {
      throw err;
    }
  };

  return {
    funds,
    isLoading,
    error,
    refetch: fetchFunds,
    createFund,
    addContribution,
  };
}
