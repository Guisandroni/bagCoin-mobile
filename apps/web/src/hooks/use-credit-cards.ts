"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface CreditCardResponse {
  id: number
  name: string
  limit: number
  closing_day: number
  due_day: number
  issuer: string
  color: string
  created_at: string
}

export interface CreditCardCreate {
  name: string
  issuer: string
  limit: number
  closing_day: number
  due_day: number
  color?: string
}

export interface CreditCardUpdate {
  name?: string
  issuer?: string
  limit?: number
  closing_day?: number
  due_day?: number
  color?: string
}

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      return api.get<CreditCardResponse[]>("/bagcoin/credit-cards")
    },
  })
}

export function useCreateCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreditCardCreate) =>
      api.post<CreditCardResponse>("/bagcoin/credit-cards", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-cards"] })
      toast.success("Cartão criado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar cartão")
    },
  })
}

export function useUpdateCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreditCardUpdate }) =>
      api.patch<CreditCardResponse>(`/bagcoin/credit-cards/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-cards"] })
      toast.success("Cartão atualizado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar cartão")
    },
  })
}

export function useDeleteCreditCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/bagcoin/credit-cards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-cards"] })
      toast.success("Cartão excluído com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir cartão")
    },
  })
}
