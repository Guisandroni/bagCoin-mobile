"use client"

import { useState, type FormEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES } from "@/lib/constants"
import { useAppStore } from "@/lib/store"
import { useCreateTransaction } from "@/hooks/use-transactions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function NewTransactionModal() {
  const { activeModal, closeModal } = useAppStore()
  const createMutation = useCreateTransaction()
  const open = activeModal === "new-transaction"
  const [type, setType] = useState<"despesa" | "receita">("despesa")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("2026-05-01")

  const filteredCategories = CATEGORIES.filter((c) =>
    type === "despesa" ? c.name !== "Salário" : c.name === "Salário" || c.name === "Educação"
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleanAmount = amount.replace(/[^\d,]/g, "").replace(",", ".")
    const numAmount = Number.parseFloat(cleanAmount) || 0

    try {
      await createMutation.mutateAsync({
        type: type === "receita" ? "INCOME" : "EXPENSE",
        amount: numAmount,
        description: description || (type === "despesa" ? "Nova despesa" : "Nova receita"),
        category_name: category || undefined,
        transaction_date: date,
        source: "manual",
      })

      setAmount("")
      setCategory("")
      setDescription("")
      setDate("2026-05-01")
      closeModal()
      toast.success("Transação criada com sucesso!")
    } catch {
      toast.error("Erro ao criar transação. Tente novamente.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeModal()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setType("despesa")}
                className={cn(
                  "flex-1 py-2.5 text-[14px] font-semibold transition-colors",
                  type === "despesa"
                    ? "bg-danger/10 text-danger"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType("receita")}
                className={cn(
                  "flex-1 py-2.5 text-[14px] font-semibold transition-colors",
                  type === "receita"
                    ? "bg-success/10 text-success"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Receita
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                Valor
              </Label>
              <Input
                type="text"
                placeholder="R$ 0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-heading text-[22px] font-semibold tracking-tight"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                Categoria
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-[14px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                Descrição
              </Label>
              <Input
                type="text"
                placeholder={
                  type === "despesa"
                    ? "Ex: Almoço no restaurante"
                    : "Ex: Freelance projeto X"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.05em] font-semibold">
                Data
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Registrando..."
                : type === "despesa"
                  ? "Registrar despesa"
                  : "Registrar receita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
