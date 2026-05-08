"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export interface Report {
  id: number
  user_uuid: string | null
  period_start: string
  period_end: string
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface ReportListResponse {
  items: Report[]
  total: number
}

export interface ReportGenerateRequest {
  report_type: "monthly" | "category" | "budget"
  month: number
  year: number
}

export interface ReportGenerateResponse extends Report {
  summary: {
    total_income: number
    total_expense: number
    balance: number
    transaction_count: number
  }
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const data = await api.get<Report[]>("/bagcoin/reports")
      if (Array.isArray(data)) return { items: data, total: data.length } as ReportListResponse
      return (data as unknown as ReportListResponse)
    },
  })
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => api.get<Report>(`/bagcoin/reports/${id}`),
    enabled: !!id,
  })
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReportGenerateRequest) =>
      api.post<ReportGenerateResponse>("/bagcoin/reports", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Relatório gerado com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao gerar relatório")
    },
  })
}

export function useDeleteReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/bagcoin/reports/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] })
      toast.success("Relatório excluído com sucesso!")
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir relatório")
    },
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (reportId: number) => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const url = `${apiBase}/bagcoin/reports/${reportId}/download`
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) throw new Error("Erro ao baixar relatório")
      return res.blob()
    },
    onSuccess: (blob, reportId) => {
      const u = URL.createObjectURL(blob)
      window.open(u, "_blank")
      URL.revokeObjectURL(u)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao baixar relatório")
    },
  })
}