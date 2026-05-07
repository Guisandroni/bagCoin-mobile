"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export interface TransactionResponse {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  source: string;
  status: string;
}

interface TransactionListResponse {
  items: TransactionResponse[];
  total: number;
}

export interface TransactionSummary {
  balance: number;
  total_income: number;
  total_expenses: number;
  transaction_count: number;
  categories: Array<{ name: string; amount: number; color: string }>;
  recent_transactions: TransactionResponse[];
}

interface CreateTransactionData {
  type: "EXPENSE" | "INCOME";
  amount: number;
  description: string;
  category_name?: string;
  transaction_date?: string;
  source?: "manual" | "auto";
  status?: "confirmed" | "pending";
}

interface UpdateTransactionData {
  id: string;
  type?: "EXPENSE" | "INCOME";
  amount?: number;
  description?: string;
  category_name?: string;
  transaction_date?: string;
  status?: "confirmed" | "pending";
}

export function useTransactions(filters?: {
  type?: string;
  search?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery<TransactionListResponse>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.skip !== undefined)
        params.append("skip", String(filters.skip));
      if (filters?.limit !== undefined)
        params.append("limit", String(filters.limit));
      const { data } = await apiClient.get(
        `/bagcoin/transactions?${params.toString()}`,
      );
      return data;
    },
  });
}

export function useTransactionSummary() {
  return useQuery<TransactionSummary>({
    queryKey: ["transactions", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/bagcoin/transactions/summary");
      return data;
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const { data: result } = await apiClient.post(
        "/bagcoin/transactions",
        data,
      );
      return result as TransactionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação criada com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar transação");
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTransactionData) => {
      const { data: result } = await apiClient.patch(
        `/bagcoin/transactions/${id}`,
        data,
      );
      return result as TransactionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar transação");
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/bagcoin/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação excluída com sucesso!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir transação");
    },
  });
}
