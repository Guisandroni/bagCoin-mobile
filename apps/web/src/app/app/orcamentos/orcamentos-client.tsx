"use client"

import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, AlertCircle, Wallet } from "lucide-react"
import { CATEGORIES } from "@/lib/constants"
import { SectionHeader, FilterChip } from "@/components/coinbase"
import { cn } from "@/lib/utils"
import {
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  type Budget,
  type BudgetCreate,
  type BudgetUpdate,
} from "@/hooks/use-budgets"
import type { ServerBudget } from "@/lib/api-server"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const periodLabels: Record<string, string> = {
  monthly: "Mensal",
  weekly: "Semanal",
  yearly: "Anual",
  mensal: "Mensal",
  semanal: "Semanal",
  anual: "Anual",
}

const periodColors: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  weekly: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  yearly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  mensal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  semanal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  anual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

function budgetEmoji(budget: Budget): string {
  if (budget.category_name) {
    const c = CATEGORIES.find((x) => x.name === budget.category_name)
    if (c?.emoji) return c.emoji
  }
  return "📊"
}

function BudgetFlatCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget
  onEdit: (b: Budget) => void
  onDelete: (id: number) => void
}) {
  const percentage = Math.min(budget.percentage ?? 0, 100)
  const isOverBudget = (budget.percentage ?? 0) > 100
  const progressBarClass = isOverBudget
    ? "bg-danger"
    : (budget.percentage ?? 0) > 80
      ? "bg-warning"
      : "bg-success"

  const delta =
    budget.total_limit > 0
      ? (((budget.total_spent || 0) / budget.total_limit) * 100 - 100).toFixed(1)
      : "0"

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="text-2xl leading-none">{budgetEmoji(budget)}</span>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold leading-tight">{budget.name}</p>
            <Badge className={cn("text-[11px]", periodColors[budget.period] || "bg-muted")} variant="secondary">
              {periodLabels[budget.period] || budget.period}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="sm" className="touch-target h-9 w-9 p-0" onClick={() => onEdit(budget)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="touch-target h-9 w-9 p-0 text-destructive"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gasto</p>
          <p className="row-amount text-[16px]">{currencyFormatter.format(budget.total_spent || 0)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Limite</p>
          <p className="row-amount text-[16px] text-muted-foreground">
            {currencyFormatter.format(budget.total_limit)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", progressBarClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{(budget.percentage || 0).toFixed(1)}% do limite</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            Number(delta) > 0 ? "text-danger" : "text-success"
          )}
        >
          {Number(delta) > 0 ? `${delta}% vs limite` : "Dentro do limite"}
        </span>
      </div>
      {isOverBudget ? (
        <p className="mt-2 flex items-center gap-1 text-[12px] text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Orçamento excedido
        </p>
      ) : null}

      <p className="mt-3 text-[13px] text-muted-foreground">
        Restante:{" "}
        <span className={cn("font-semibold text-foreground", isOverBudget && "text-danger")}>
          {currencyFormatter.format(budget.total_remaining || 0)}
        </span>
      </p>
    </div>
  )
}

function BudgetFormDialog({
  open,
  onOpenChange,
  editingBudget,
  onCreated,
  onUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingBudget: Budget | null
  onCreated?: (budget: Budget) => void
  onUpdated?: (budget: Budget) => void
}) {
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const isEditing = !!editingBudget

  const [name, setName] = useState(editingBudget?.name || "")
  const [period, setPeriod] = useState<string>(editingBudget?.period || "monthly")
  const [totalLimit, setTotalLimit] = useState(
    editingBudget ? String(editingBudget.total_limit) : ""
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !totalLimit) return

    setSaving(true)
    try {
      if (isEditing && editingBudget) {
        const data: BudgetUpdate = {
          name: name.trim(),
          period,
          total_limit: Number(totalLimit),
        }
        const updated = await updateBudget.mutateAsync({ id: editingBudget.id, data })
        onUpdated?.(updated)
      } else {
        const data: BudgetCreate = {
          name: name.trim(),
          period,
          total_limit: Number(totalLimit),
          budget_type: "general",
        }
        const created = await createBudget.mutateAsync(data)
        onCreated?.(created)
      }
      onOpenChange(false)
    } catch {
      // error handled by hook toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do orçamento abaixo."
              : "Preencha os dados para criar um novo orçamento."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={period} onValueChange={(v: string | null) => v && setPeriod(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Valor Limite (R$)</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !totalLimit}>
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface OrcamentosClientProps {
  serverBudgets: ServerBudget[]
}

export default function OrcamentosClient({ serverBudgets }: OrcamentosClientProps) {
  const [budgets, setBudgets] = useState<ServerBudget[]>(serverBudgets)
  const deleteBudget = useDeleteBudget()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [periodFilter, setPeriodFilter] = useState<"all" | "monthly" | "weekly" | "yearly">("all")

  const filteredBudgets = useMemo(() => {
    if (periodFilter === "all") return budgets
    const match = (p: string) => {
      const x = p?.toLowerCase() ?? ""
      if (periodFilter === "monthly") return x === "monthly" || x === "mensal"
      if (periodFilter === "weekly") return x === "weekly" || x === "semanal"
      return x === "yearly" || x === "anual"
    }
    return budgets.filter((b) => match(b.period))
  }, [budgets, periodFilter])

  const periodChipLabel =
    periodFilter === "all"
      ? "Todos os períodos"
      : periodFilter === "monthly"
        ? "Mensal"
        : periodFilter === "weekly"
          ? "Semanal"
          : "Anual"

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteBudget.mutateAsync(deleteId)
      setBudgets((prev) => prev.filter((b) => b.id !== deleteId))
    } catch {
      // handled by hook toast
    }
    setDeleteId(null)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingBudget(null)
    }
  }

  const handleCreated = (budget: Budget) => {
    setBudgets((prev) => [...prev, budget])
  }

  const handleUpdated = (budget: Budget) => {
    setBudgets((prev) => prev.map((b) => (b.id === budget.id ? budget : b)))
  }

  return (
    <div className="page-in relative space-y-5 pb-32 lg:pb-10">
      <SectionHeader
        title="Orçamentos"
        right={
          <FilterChip label={periodChipLabel}>
            <div className="flex flex-col gap-0.5 p-1">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setPeriodFilter("all")}
              >
                Todos os períodos
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setPeriodFilter("monthly")}
              >
                Mensal
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setPeriodFilter("weekly")}
              >
                Semanal
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => setPeriodFilter("yearly")}
              >
                Anual
              </button>
            </div>
          </FilterChip>
        }
      />
      <p className="text-[14px] text-muted-foreground">Limites de gastos por período</p>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="text-muted-foreground mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Nenhum orçamento criado</p>
            <p className="text-muted-foreground mb-6 text-sm">
              Crie seu primeiro orçamento para começar a controlar seus gastos.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Button>
          </CardContent>
        </Card>
      )}

      {budgets.length > 0 && filteredBudgets.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum orçamento neste período. Ajuste o filtro.
        </p>
      )}

      {filteredBudgets.length > 0 && (
        <div className="grid gap-3">
          {filteredBudgets.map((budget) => (
            <BudgetFlatCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 h-14 w-14 rounded-full shadow-lg lg:bottom-8"
        onClick={() => setDialogOpen(true)}
        aria-label="Novo orçamento"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create/Edit Dialog */}
      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingBudget={editingBudget}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBudget.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
