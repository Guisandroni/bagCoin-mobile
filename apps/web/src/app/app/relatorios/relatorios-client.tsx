"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateReport, useDeleteReport, type Report, type ReportGenerateRequest } from "@/hooks/use-reports"
import { FileText, Plus, Trash2, Loader2 } from "lucide-react"
import { BottomSheet } from "@/components/coinbase/bottom-sheet"
import { AssetRow, SectionHeader, FilterChip } from "@/components/coinbase"
import { cn } from "@/lib/utils"

// ── Constants ──────────────────────────────────────────

const MONTHS = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
]

const REPORT_TYPES = [
  { value: "monthly", label: "Mensal" },
  { value: "category", label: "Por Categoria" },
  { value: "budget", label: "Orçamento" },
]

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
const dateShortFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

function formatPeriod(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  return `${dateShortFormatter.format(s)} — ${dateShortFormatter.format(e)}`
}

function ReportAssetRow({
  report,
  onDelete,
}: {
  report: Report
  onDelete: (id: number) => void
}) {
  const hasDownload = !!report.file_url
  const [deleting, setDeleting] = useState(false)

  const handleDownload = () => {
    if (report.file_url) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const url = `${apiBase}/bagcoin/reports/${report.id}/download`
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const u = URL.createObjectURL(blob)
          window.open(u, "_blank")
          URL.revokeObjectURL(u)
        })
        .catch(() => window.open(url, "_blank"))
    }
  }

  return (
    <AssetRow
      icon={<FileText className="h-5 w-5 text-primary" />}
      title="Relatório financeiro"
      subtitle={`${formatPeriod(report.period_start, report.period_end)} · Gerado em ${dateFormatter.format(new Date(report.created_at))}`}
      trailing={
        <button
          type="button"
          className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
          aria-label="Excluir relatório"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDeleting(true)
            onDelete(report.id)
            setDeleting(false)
          }}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      }
      amount={
        hasDownload ? (
          <span className="row-amount text-[13px] font-semibold text-primary">PDF</span>
        ) : (
          <span className="row-amount text-[12px] text-muted-foreground">Processando</span>
        )
      }
      onClick={() => {
        if (hasDownload) handleDownload()
      }}
    />
  )
}

// ── Main Client Component ──────────────────────────────

interface Props {
  initialReports: Report[]
}

export function RelatoriosClient({ initialReports }: Props) {
  const createReport = useCreateReport()
  const deleteReport = useDeleteReport()

  const [reports, setReports] = useState<Report[]>(initialReports)
  const [reportType, setReportType] = useState("monthly")
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [generating, setGenerating] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [listFilter, setListFilter] = useState<"all" | "month">("all")

  const filteredReports = useMemo(() => {
    if (listFilter === "all") return reports
    const now = new Date()
    return reports.filter((r) => {
      const c = new Date(r.created_at)
      return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear()
    })
  }, [reports, listFilter])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const newReport = await createReport.mutateAsync({
        report_type: reportType as ReportGenerateRequest["report_type"],
        month: parseInt(month),
        year: new Date().getFullYear(),
      })
      setReports((prev) => [newReport as unknown as Report, ...prev])
      setSheetOpen(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = (id: number) => {
    deleteReport.mutate(id)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <SectionHeader
        title="Relatórios"
        right={
          <FilterChip label={listFilter === "all" ? "Todos" : "Este mês"}>
            <div className="flex flex-col gap-0.5 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                  listFilter === "all" && "bg-[var(--primary-tint)] font-semibold text-primary"
                )}
                onClick={() => setListFilter("all")}
              >
                Todos
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                  listFilter === "month" && "bg-[var(--primary-tint)] font-semibold text-primary"
                )}
                onClick={() => setListFilter("month")}
              >
                Este mês
              </button>
            </div>
          </FilterChip>
        }
      />
      <p className="text-[14px] text-muted-foreground">
        Relatórios financeiros gerados pelo assistente
      </p>

      <Button
        type="button"
        className="h-12 w-full rounded-full font-semibold"
        onClick={() => setSheetOpen(true)}
      >
        <Plus className="mr-2 h-5 w-5" />
        Gerar novo relatório
      </Button>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Gerar relatório"
        description="Escolha o tipo e o mês de referência."
        illustration={<FileText className="mx-auto h-14 w-14 text-primary opacity-90" />}
      >
        <div className="space-y-4 pb-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de relatório</label>
            <Select value={reportType} onValueChange={(v) => setReportType(v ?? "monthly")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mês</label>
            <Select value={month} onValueChange={(v) => setMonth(v ?? String(new Date().getMonth() + 1))}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="h-12 w-full rounded-full font-semibold"
            onClick={() => void handleGenerate()}
            disabled={generating || createReport.isPending}
          >
            {generating || createReport.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar relatório
              </>
            )}
          </Button>
        </div>
      </BottomSheet>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Nenhum relatório gerado</p>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Toque em Gerar novo relatório ou peça ao assistente no WhatsApp/Telegram.
          </p>
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-border bg-card px-1 py-1">
          {filteredReports.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum relatório neste filtro.
            </p>
          ) : (
            filteredReports.map((report) => (
              <ReportAssetRow key={report.id} report={report} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
