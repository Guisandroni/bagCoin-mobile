"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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

function BudgetCard({
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
  const progressColor = isOverBudget
    ? "bg-red-500"
    : (budget.percentage ?? 0) > 80
      ? "bg-yellow-500"
      : "bg-green-500"

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{budget.name}</CardTitle>
            <Badge className={periodColors[budget.period] || ""} variant="secondary">
              {periodLabels[budget.period] || budget.period}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(budget)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => onDelete(budget.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gasto</span>
            <span className="font-medium">{currencyFormatter.format(budget.total_spent || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Limite</span>
            <span className="font-medium">{currencyFormatter.format(budget.total_limit)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <Progress value={percentage} className={"h-2 " + progressColor} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {(budget.percentage || 0).toFixed(1)}% utilizado
            </span>
            {isOverBudget && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                Excedido
              </span>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Restante:{" "}
          <span className={isOverBudget ? "text-red-500 font-medium" : "font-medium"}>
            {currencyFormatter.format(budget.total_remaining || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6 pb-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Orçamentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie seus limites de gastos por período
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Empty state */}
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

      {/* Budgets grid */}
      {budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

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
