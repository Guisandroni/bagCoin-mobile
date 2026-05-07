"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateReport, useDeleteReport, type Report, type ReportGenerateRequest } from "@/hooks/use-reports"
import { AlertCircle, FileText, Download, Calendar, Clock, Plus, Trash2, Loader2 } from "lucide-react"

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

// ── ReportCard ─────────────────────────────────────────

function ReportCard({ report, onDelete }: { report: Report; onDelete: (id: number) => void }) {
  const hasDownload = !!report.file_url
  const [deleting, setDeleting] = useState(false)

  const handleDownload = () => {
    if (report.file_url) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
      const url = `${apiBase}/bagcoin/reports/${report.id}/download`
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => { const u = URL.createObjectURL(blob); window.open(u, "_blank"); URL.revokeObjectURL(u) })
        .catch(() => window.open(url, "_blank"))
    }
  }

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <FileText className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
            <div>
              <CardTitle className="text-base">Relatório Financeiro</CardTitle>
              <Badge variant="secondary" className="mt-1">
                <Calendar className="mr-1 h-3 w-3" />
                {formatPeriod(report.period_start, report.period_end)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Gerado em {dateFormatter.format(new Date(report.created_at))}
        </div>
        <div className="flex gap-2">
          {hasDownload && (
            <Button variant="default" className="flex-1" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />Download PDF
            </Button>
          )}
          <Button variant="outline" size="icon" className="shrink-0 text-destructive hover:text-destructive"
            onClick={() => { setDeleting(true); onDelete(report.id); setDeleting(false) }}
            disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
        {!hasDownload && (
          <p className="text-xs text-muted-foreground text-center">
            Relatório em processamento. O download estará disponível em breve.
          </p>
        )}
      </CardContent>
    </Card>
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

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const newReport = await createReport.mutateAsync({
        report_type: reportType as ReportGenerateRequest["report_type"],
        month: parseInt(month),
        year: new Date().getFullYear(),
      })
      setReports((prev) => [newReport as unknown as Report, ...prev])
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = (id: number) => {
    deleteReport.mutate(id)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6 pb-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Relatórios</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Relatórios financeiros gerados pelo assistente
        </p>
      </div>

      {/* Generate Report Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v ?? "monthly")}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Mês</label>
              <Select value={month} onValueChange={(v) => setMonth(v ?? String(new Date().getMonth() + 1))}>
                <SelectTrigger><SelectValue placeholder="Selecione o mês" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating || createReport.isPending} className="w-full sm:w-auto">
              {generating || createReport.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>) : (<><FileText className="mr-2 h-4 w-4" />Gerar Relatório</>)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="text-muted-foreground mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Nenhum relatório gerado</p>
            <p className="text-muted-foreground mt-2 mb-6 text-sm text-center max-w-md">
              Use o formulário acima para gerar um relatório financeiro ou peça ao assistente no WhatsApp/Telegram.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (<ReportCard key={report.id} report={report} onDelete={handleDelete} />))}
        </div>
      )}
    </div>
  )
}
