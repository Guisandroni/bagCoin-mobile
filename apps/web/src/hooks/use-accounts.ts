"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface AccountResponse {
  id: number
  name: string
  type: string
  balance: number
  bank: string
  color: string
  created_at: string
}

export interface AccountCreate {
  name: string
  type: "CHECKING" | "SAVINGS"
  balance?: number
  bank?: string
  color?: string
}

export interface AccountUpdate {
  name?: string
  type?: "CHECKING" | "SAVINGS"
  balance?: number
  bank?: string
  color?: string
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      return api.get<AccountResponse[]>("/bagcoin/accounts")
    },
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AccountCreate) =>
      api.post<AccountResponse>("/bagcoin/accounts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Conta criada com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar conta")
    },
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AccountUpdate }) =>
      api.patch<AccountResponse>(`/bagcoin/accounts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Conta atualizada com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar conta")
    },
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/bagcoin/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Conta excluída com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir conta")
    },
  })
}
