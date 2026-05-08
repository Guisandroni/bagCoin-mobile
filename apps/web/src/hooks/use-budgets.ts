"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface Budget {
  id: number
  name: string
  period: string
  total_limit: number
  total_spent: number
  total_remaining: number
  percentage: number
  budget_type: string
  category_id: number | null
  category_name: string | null
  created_at: string
  updated_at: string | null
}

export interface BudgetCreate {
  name: string
  period: string
  total_limit: number
  budget_type?: string
  category_id?: number | null
}

export interface BudgetUpdate {
  name?: string
  period?: string
  total_limit?: number
}

export interface BudgetListResponse {
  items: Budget[]
  total: number
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const data = await api.get<Budget[]>("/bagcoin/budgets")
      if (Array.isArray(data)) return { items: data, total: data.length } as BudgetListResponse
      return (data as unknown as BudgetListResponse)
    },
  })
}

export function useBudget(id: number) {
  return useQuery({
    queryKey: ["budgets", id],
    queryFn: () => api.get<Budget>(`/bagcoin/budgets/${id}`),
    enabled: !!id,
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BudgetCreate) =>
      api.post<Budget>("/bagcoin/budgets", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Orçamento criado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar orçamento")
    },
  })
}

export function useUpdateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BudgetUpdate }) =>
      api.patch<Budget>(`/bagcoin/budgets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Orçamento atualizado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar orçamento")
    },
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/bagcoin/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Orçamento excluído com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir orçamento")
    },
  })
}