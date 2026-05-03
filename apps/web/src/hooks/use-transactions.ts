"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"

export interface TransactionResponse {
  id: string
  name: string
  category: string
  amount: number
  date: string
  source: string
  status: string
}

interface TransactionListResponse {
  items: TransactionResponse[]
  total: number
}

export interface TransactionSummary {
  balance: number
  total_income: number
  total_expenses: number
  transaction_count: number
  categories: Array<{ name: string; amount: number; color: string }>
  recent_transactions: TransactionResponse[]
}

interface CreateTransactionData {
  type: "EXPENSE" | "INCOME"
  amount: number
  description: string
  category_name?: string
  transaction_date?: string
  source?: "manual" | "auto"
  status?: "confirmed" | "pending"
}

interface UpdateTransactionData {
  type?: "EXPENSE" | "INCOME"
  amount?: number
  description?: string
  category_name?: string
  transaction_date?: string
  status?: "confirmed" | "pending"
}

export function useTransactions(filters?: {
  type?: string
  search?: string
  skip?: number
  limit?: number
}) {
  return useQuery<TransactionListResponse>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.type) params.append("type", filters.type)
      if (filters?.search) params.append("search", filters.search)
      if (filters?.skip !== undefined) params.append("skip", String(filters.skip))
      if (filters?.limit !== undefined) params.append("limit", String(filters.limit))
      const { data } = await apiClient.get(`/transactions?${params.toString()}`)
      return data
    },
  })
}

export function useTransactionSummary() {
  return useQuery<TransactionSummary>({
    queryKey: ["transactions", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/transactions/summary")
      return data
    },
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const { data: result } = await apiClient.post("/transactions", data)
      return result as TransactionResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateTransactionData) => {
      const { data: result } = await apiClient.patch(`/transactions/${id}`, data)
      return result as TransactionResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/transactions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
  })
}
