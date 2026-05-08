"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface Goal {
  id: number
  title: string
  target_amount: number
  current_amount: number
  deadline: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string | null
}

export interface GoalCreate {
  title: string
  target_amount: number
  current_amount?: number
  deadline?: string | null
  status?: "active" | "completed" | "cancelled"
}

export interface GoalUpdate {
  title?: string
  target_amount?: number
  current_amount?: number
  deadline?: string | null
  status?: "active" | "completed" | "cancelled"
}

export interface GoalListResponse {
  items: Goal[]
  total: number
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const data = await api.get<Goal[]>("/bagcoin/goals")
      if (Array.isArray(data)) return { items: data, total: data.length } as GoalListResponse
      return (data as unknown as GoalListResponse)
    },
  })
}

export function useGoal(id: number) {
  return useQuery({
    queryKey: ["goals", id],
    queryFn: () => api.get<Goal>(`/bagcoin/goals/${id}`),
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GoalCreate) =>
      api.post<Goal>("/bagcoin/goals", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] })
      toast.success("Meta criada com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar meta")
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GoalUpdate }) =>
      api.patch<Goal>(`/bagcoin/goals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] })
      toast.success("Meta atualizada com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar meta")
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/bagcoin/goals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] })
      toast.success("Meta excluída com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir meta")
    },
  })
}