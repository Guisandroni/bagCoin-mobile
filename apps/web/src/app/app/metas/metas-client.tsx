"use client"

import { useState, useCallback } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
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
import { Plus, Pencil, Trash2, AlertCircle, Target } from "lucide-react"
import {
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  type Goal,
  type GoalCreate,
  type GoalUpdate,
} from "@/hooks/use-goals"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativa", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (id: number) => void
}) {
  const percentage = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0
  const isComplete = goal.status === "completed"
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status === "active"
  const statusInfo = statusConfig[goal.status] || { label: goal.status, color: "" }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{goal.title}</CardTitle>
            <Badge className={statusInfo.color} variant="secondary">
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => onDelete(goal.id)}
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
            <span className="text-muted-foreground">Atual</span>
            <span className="font-medium">{currencyFormatter.format(goal.current_amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta</span>
            <span className="font-medium">{currencyFormatter.format(goal.target_amount)}</span>
          </div>
        </div>

        <div className="space-y-1">
          <Progress
            value={percentage}
            className={`h-2 ${isComplete ? "bg-blue-500" : percentage >= 100 ? "bg-green-500" : "bg-primary"}`}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{percentage.toFixed(1)}% concluído</span>
            {isOverdue && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                Atrasada
              </span>
            )}
          </div>
        </div>

        {goal.deadline && (
          <div className="text-sm text-muted-foreground">
            Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
          </div>
        )}

        {goal.target_amount - goal.current_amount > 0 && (
          <div className="text-sm">
            Faltam:{" "}
            <span className="font-medium">
              {currencyFormatter.format(goal.target_amount - goal.current_amount)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function GoalFormDialog({
  open,
  onOpenChange,
  editingGoal,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGoal: Goal | null
  onSuccess: (goal: Goal) => void
}) {
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const isEditing = !!editingGoal

  const [title, setTitle] = useState(editingGoal?.title || "")
  const [targetAmount, setTargetAmount] = useState(
    editingGoal ? String(editingGoal.target_amount) : ""
  )
  const [currentAmount, setCurrentAmount] = useState(
    editingGoal ? String(editingGoal.current_amount) : "0"
  )
  const [deadline, setDeadline] = useState(
    editingGoal?.deadline ? editingGoal.deadline.split("T")[0] : ""
  )
  const [status, setStatus] = useState<string>(editingGoal?.status || "active")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetAmount) return

    setSaving(true)
    try {
      if (isEditing && editingGoal) {
        const data: GoalUpdate = {
          title: title.trim(),
          target_amount: Number(targetAmount),
          current_amount: Number(currentAmount) || 0,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          status: status as "active" | "completed" | "cancelled",
        }
        const updated = await updateGoal.mutateAsync({ id: editingGoal.id, data })
        onSuccess(updated)
      } else {
        const data: GoalCreate = {
          title: title.trim(),
          target_amount: Number(targetAmount),
          current_amount: Number(currentAmount) || 0,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        }
        const created = await createGoal.mutateAsync(data)
        onSuccess(created)
      }
      onOpenChange(false)
    } catch {
      // handled by hook toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da meta abaixo."
              : "Defina uma nova meta financeira."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Viagem para Europa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Valor Alvo (R$)</Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current">Valor Atual (R$)</Label>
            <Input
              id="current"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: string | null) => v && setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !targetAmount}>
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Public types & component (receives goals from server) ──

/** Shape the server component passes down. Compatible with Goal at runtime. */
export interface MetasGoal {
  id: number
  title: string
  target_amount: number
  current_amount: number
  deadline: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string | null
}

interface MetasClientProps {
  initialGoals: MetasGoal[]
}

export function MetasClient({ initialGoals }: MetasClientProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals as Goal[])
  const deleteGoal = useDeleteGoal()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const handleGoalSuccess = useCallback((goal: Goal) => {
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id)
      if (idx >= 0) {
        return prev.map((g) => (g.id === goal.id ? goal : g))
      }
      return [...prev, goal]
    })
  }, [])

  const handleEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    try {
      await deleteGoal.mutateAsync(deleteId)
      setGoals((prev) => prev.filter((g) => g.id !== deleteId))
    } catch {
      // handled by hook toast
    }
    setDeleteId(null)
  }, [deleteId, deleteGoal])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingGoal(null)
    }
  }, [])

  const isEmpty = goals.length === 0

  return (
    <div className="space-y-6 pb-8 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Metas</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe suas metas financeiras
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="text-muted-foreground mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Nenhuma meta criada</p>
            <p className="text-muted-foreground mb-6 text-sm">
              Defina sua primeira meta financeira para acompanhar seu progresso.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goals grid */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingGoal={editingGoal}
        onSuccess={handleGoalSuccess}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGoal.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
