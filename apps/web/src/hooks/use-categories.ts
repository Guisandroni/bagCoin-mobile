"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api-client"

export interface CategoryResponse {
  id: number
  name: string
  color: string
  emoji?: string
  type: "despesa" | "receita" | "investimento"
  is_default: boolean
  is_user_created?: boolean
  can_delete?: boolean
}

export interface CategoryCreate {
  name: string
  type?: "despesa" | "receita" | "investimento"
  color?: string
}

export interface CategoryUpdate {
  name: string
  type?: "despesa" | "receita" | "investimento"
  color?: string
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoryResponse[]>("/bagcoin/categories"),
  })
}

const TOAST_ID_CREATE_CATEGORY = "categories-create"

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryCreate) => api.post<CategoryResponse>("/bagcoin/categories", data),
    onSuccess: () => {
      toast.dismiss(TOAST_ID_CREATE_CATEGORY)
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Categoria criada com sucesso!", { id: TOAST_ID_CREATE_CATEGORY })
    },
    onError: (err: Error) => {
      toast.dismiss(TOAST_ID_CREATE_CATEGORY)
      toast.error(err.message || "Erro ao criar categoria", { id: TOAST_ID_CREATE_CATEGORY })
    },
  })
}

const TOAST_ID_UPDATE_CATEGORY = "categories-update"

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      api.patch<CategoryResponse>(`/bagcoin/categories/${id}`, data),
    onSuccess: () => {
      toast.dismiss(TOAST_ID_UPDATE_CATEGORY)
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Categoria atualizada com sucesso!", { id: TOAST_ID_UPDATE_CATEGORY })
    },
    onError: (err: Error) => {
      toast.dismiss(TOAST_ID_UPDATE_CATEGORY)
      toast.error(err.message || "Erro ao atualizar categoria", { id: TOAST_ID_UPDATE_CATEGORY })
    },
  })
}

const TOAST_ID_DELETE_CATEGORY = "categories-delete"

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/bagcoin/categories/${id}`),
    onSuccess: () => {
      toast.dismiss(TOAST_ID_DELETE_CATEGORY)
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
      qc.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Categoria excluída com sucesso!", { id: TOAST_ID_DELETE_CATEGORY })
    },
    onError: (err: Error) => {
      toast.dismiss(TOAST_ID_DELETE_CATEGORY)
      toast.error(err.message || "Erro ao excluir categoria", { id: TOAST_ID_DELETE_CATEGORY })
    },
  })
}
