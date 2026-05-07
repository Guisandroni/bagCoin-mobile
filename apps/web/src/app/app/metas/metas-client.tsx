"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  Card,
  CardContent,
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
import { Plus, Pencil, Trash2, AlertCircle, Target } from "lucide-react"
import { HCarousel, HCarouselCard, SectionHeader } from "@/components/coinbase"
import { cn, formatCurrency } from "@/lib/utils"
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

function ContributeDialog({
  goal,
  open,
  onOpenChange,
  onSuccess,
}: {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (goal: Goal) => void
}) {
  const updateGoal = useUpdateGoal()
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (goal) setAmount("")
  }, [goal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal) return
    const add = Number(amount.replace(",", "."))
    if (!add || add <= 0) return
    setSaving(true)
    try {
      const updated = await updateGoal.mutateAsync({
        id: goal.id,
        data: { current_amount: goal.current_amount + add },
      })
      onSuccess(updated)
      onOpenChange(false)
    } catch {
      // toast via hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Aportar na meta</DialogTitle>
          <DialogDescription>
            {goal ? `Adicionar valor a "${goal.title}"` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aport">Valor (R$)</Label>
            <Input
              id="aport"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !amount}>
              {saving ? "Salvando..." : "Confirmar aporte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativa", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  completed: { label: "Concluída", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  cancelled: { label: "Cancelada", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
}

function GoalStackRow({
  goal,
  onEdit,
  onDelete,
  onContribute,
}: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (id: number) => void
  onContribute: (g: Goal) => void
}) {
  const percentage =
    goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0
  const isComplete = goal.status === "completed"
  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status === "active"
  const statusInfo = statusConfig[goal.status] || { label: goal.status, color: "" }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold leading-tight">{goal.title}</p>
          <Badge className={statusInfo.color} variant="secondary">
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => onEdit(goal)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[13px]">
        <span className="text-muted-foreground">Atual</span>
        <span className="font-medium tabular-nums">{currencyFormatter.format(goal.current_amount)}</span>
      </div>
      <div className="flex justify-between text-[13px]">
        <span className="text-muted-foreground">Meta</span>
        <span className="font-medium tabular-nums">{currencyFormatter.format(goal.target_amount)}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isComplete ? "bg-primary" : percentage >= 100 ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{percentage.toFixed(1)}% concluído</span>
        {isOverdue ? (
          <span className="flex items-center gap-1 text-danger">
            <AlertCircle className="h-3 w-3" />
            Atrasada
          </span>
        ) : null}
      </div>

      {goal.deadline ? (
        <p className="mt-2 text-[12px] text-muted-foreground">
          Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
        </p>
      ) : null}

      {goal.target_amount - goal.current_amount > 0 && goal.status === "active" ? (
        <p className="mt-1 text-[13px]">
          Faltam:{" "}
          <span className="font-semibold">
            {currencyFormatter.format(goal.target_amount - goal.current_amount)}
          </span>
        </p>
      ) : null}

      {goal.status === "active" ? (
        <Button
          type="button"
          className="mt-4 w-full rounded-full font-semibold"
          variant="secondary"
          onClick={() => onContribute(goal)}
        >
          Aportar
        </Button>
      ) : null}
    </div>
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
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals])
  const completedGoalsList = useMemo(() => goals.filter((g) => g.status === "completed"), [goals])

  const heroStats = useMemo(() => {
    const saved = activeGoals.reduce((s, g) => s + g.current_amount, 0)
    const target = activeGoals.reduce((s, g) => s + g.target_amount, 0)
    const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0
    return { saved, target, pct }
  }, [activeGoals])

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
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="section-title">Metas</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">Acompanhe suas metas financeiras</p>
        </div>
        <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova
        </Button>
      </div>

      {!isEmpty && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Progresso agregado
          </p>
          <p className="amount-display mt-2 text-[clamp(2rem,8vw,2.75rem)]">
            {formatCurrency(heroStats.saved)}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            de {formatCurrency(heroStats.target)} nas metas ativas
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${heroStats.pct}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] font-medium text-muted-foreground">
            {heroStats.pct.toFixed(1)}% do total planejado
          </p>
        </div>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="text-muted-foreground mb-4 h-16 w-16" />
            <p className="text-lg font-medium">Nenhuma meta criada</p>
            <p className="text-muted-foreground mb-6 text-sm">
              Defina sua primeira meta financeira para acompanhar seu progresso.
            </p>
            <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
        <section className="space-y-3">
          <SectionHeader title="Metas ativas" />
          <div className="grid gap-3">
            {activeGoals.map((goal) => (
              <GoalStackRow
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteId(id)}
                onContribute={setContributeGoal}
              />
            ))}
          </div>
        </section>
      )}

      {completedGoalsList.length > 0 ? (
        <HCarousel title="Metas concluídas">
          {completedGoalsList.map((g) => (
            <HCarouselCard key={g.id} className="border-dashed">
              <p className="line-clamp-2 text-[14px] font-bold line-through decoration-muted-foreground">
                {g.title}
              </p>
              <p className="mt-2 text-[12px] text-success">Concluída</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {formatCurrency(g.current_amount)} acumulados
              </p>
            </HCarouselCard>
          ))}
        </HCarousel>
      ) : null}

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingGoal={editingGoal}
        onSuccess={handleGoalSuccess}
      />

      <ContributeDialog
        goal={contributeGoal}
        open={contributeGoal !== null}
        onOpenChange={(o) => {
          if (!o) setContributeGoal(null)
        }}
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
