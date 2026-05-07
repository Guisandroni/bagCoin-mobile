"use client"

import { useState } from "react"
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { FadeInUp } from "@/components/ui/animation"
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
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, type AccountResponse, type AccountCreate, type AccountUpdate } from "@/hooks/use-accounts"
import { useCreditCards, useCreateCreditCard, useUpdateCreditCard, useDeleteCreditCard, type CreditCardResponse, type CreditCardCreate, type CreditCardUpdate } from "@/hooks/use-credit-cards"
import { formatCurrency } from "@/lib/utils"

function accountIcon(type: string, name: string): string {
  const t = type?.toLowerCase() ?? ""
  const n = name?.toLowerCase() ?? ""
  if (t.includes("checking") || t.includes("corrente") || n.includes("corrente")) return "🏦"
  if (t.includes("savings") || t.includes("poupan") || n.includes("poupan")) return "🐷"
  if (t.includes("investment") || t.includes("invest") || n.includes("invest")) return "📈"
  if (t.includes("cash") || t.includes("dinheiro") || n.includes("dinheiro") || n.includes("carteira")) return "💵"
  if (t.includes("salary") || t.includes("salario") || t.includes("salário") || n.includes("salario") || n.includes("salário")) return "💰"
  return "🏦"
}

// ── Account Form Dialog ─────────────────────────────────

function AccountFormDialog({
  open,
  onOpenChange,
  editingAccount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAccount: AccountResponse | null
}) {
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isEditing = !!editingAccount

  const [name, setName] = useState(editingAccount?.name || "")
  const [type, setType] = useState<string>(editingAccount?.type || "CHECKING")
  const [balance, setBalance] = useState(editingAccount ? String(editingAccount.balance) : "0")
  const [bank, setBank] = useState(editingAccount?.bank || "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (isEditing && editingAccount) {
        const data: AccountUpdate = {
          name: name.trim(),
          type: type as "CHECKING" | "SAVINGS",
          balance: Number(balance) || 0,
          bank: bank.trim() || undefined,
        }
        await updateAccount.mutateAsync({ id: editingAccount.id, data })
      } else {
        const data: AccountCreate = {
          name: name.trim(),
          type: type as "CHECKING" | "SAVINGS",
          balance: Number(balance) || 0,
          bank: bank.trim() || undefined,
        }
        await createAccount.mutateAsync(data)
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
          <DialogTitle>{isEditing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere os dados da conta abaixo." : "Adicione uma nova conta bancária."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Ex: NuBank" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" placeholder="Ex: NuBank" value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v: string | null) => v && setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                <SelectItem value="SAVINGS">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Saldo (R$)</Label>
            <Input id="balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Credit Card Form Dialog ────────────────────────────

function CreditCardFormDialog({
  open,
  onOpenChange,
  editingCard,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCard: CreditCardResponse | null
}) {
  const createCard = useCreateCreditCard()
  const updateCard = useUpdateCreditCard()
  const isEditing = !!editingCard

  const [name, setName] = useState(editingCard?.name || "")
  const [issuer, setIssuer] = useState(editingCard?.issuer || "")
  const [limit, setLimit] = useState(editingCard ? String(editingCard.limit) : "")
  const [closingDay, setClosingDay] = useState(editingCard ? String(editingCard.closing_day) : "1")
  const [dueDay, setDueDay] = useState(editingCard ? String(editingCard.due_day) : "1")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !issuer.trim() || !limit) return
    setSaving(true)
    try {
      const base = {
        name: name.trim(),
        issuer: issuer.trim(),
        limit: Number(limit),
        closing_day: Number(closingDay),
        due_day: Number(dueDay),
      }
      if (isEditing && editingCard) {
        await updateCard.mutateAsync({ id: editingCard.id, data: base as CreditCardUpdate })
      } else {
        await createCard.mutateAsync(base as CreditCardCreate)
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
          <DialogTitle>{isEditing ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Altere os dados do cartão abaixo." : "Adicione um novo cartão de crédito."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">Nome</Label>
            <Input id="card-name" placeholder="Ex: Nubank" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer">Bandeira</Label>
            <Input id="issuer" placeholder="Ex: Visa, Mastercard" value={issuer} onChange={(e) => setIssuer(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Limite (R$)</Label>
            <Input id="limit" type="number" step="0.01" min="0" placeholder="0,00" value={limit} onChange={(e) => setLimit(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="closing">Fechamento</Label>
              <Input id="closing" type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Vencimento</Label>
              <Input id="due" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !name.trim() || !issuer.trim() || !limit}>
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Page Component ─────────────────────────────────────

export default function ContasPage() {
  const { data: accountsData, isLoading: accountsLoading, isError: accountsError } = useAccounts()
  const { data: cardsData, isLoading: cardsLoading, isError: cardsError } = useCreditCards()
  const deleteAccount = useDeleteAccount()
  const deleteCreditCard = useDeleteCreditCard()

  const accounts = Array.isArray(accountsData) ? accountsData : []
  const cards = Array.isArray(cardsData) ? cardsData : []

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0)
  const isLoading = accountsLoading || cardsLoading
  const hasError = accountsError || cardsError

  // Account dialog state
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null)

  // Credit card dialog state
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardResponse | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "account" | "card"; id: number } | null>(null)

  const handleEditAccount = (account: AccountResponse) => {
    setEditingAccount(account)
    setAccountDialogOpen(true)
  }

  const handleEditCard = (card: CreditCardResponse) => {
    setEditingCard(card)
    setCardDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === "account") {
        await deleteAccount.mutateAsync(deleteTarget.id)
      } else {
        await deleteCreditCard.mutateAsync(deleteTarget.id)
      }
    } catch {
      // handled by hook toast
    }
    setDeleteTarget(null)
  }

  const handleAccountDialogChange = (open: boolean) => {
    setAccountDialogOpen(open)
    if (!open) setEditingAccount(null)
  }

  const handleCardDialogChange = (open: boolean) => {
    setCardDialogOpen(open)
    if (!open) setEditingCard(null)
  }

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="p-4 lg:p-7">
        <FadeInUp>
          <div className="mb-6 rounded-2xl bg-[#0a0b0d] p-6 lg:p-7">
            <Skeleton className="h-3 w-28 bg-white/10" />
            <Skeleton className="mt-3 h-9 w-48 bg-white/10" />
            <Skeleton className="mt-1 h-3 w-32 bg-white/10" />
          </div>
          <div className="mb-8">
            <Skeleton className="mb-4 h-5 w-20" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-2xl border-border/60 shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="mt-3 h-6 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-muted p-5">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="mt-4 h-3 w-24" />
                  <Skeleton className="mt-1 h-6 w-32" />
                  <Skeleton className="mt-3 h-1.5 w-full" />
                  <div className="mt-2 flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      </div>
    )
  }

  // ── Error ──

  if (hasError) {
    return (
      <div className="p-4 lg:p-7">
        <EmptyState
          title="Erro ao carregar"
          description="Não foi possível carregar suas contas e cartões. Tente novamente."
        />
      </div>
    )
  }

  // ── Empty ──

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <div className="p-4 lg:p-7">
        <EmptyState
          title="Nenhuma conta ou cartão"
          description="Adicione sua primeira conta ou cartão de crédito para começar."
          actionLabel="Adicionar conta"
          onAction={() => { setEditingAccount(null); setAccountDialogOpen(true) }}
        />
        <AccountFormDialog open={accountDialogOpen} onOpenChange={handleAccountDialogChange} editingAccount={editingAccount} />
      </div>
    )
  }

  // ── Content ──

  return (
    <div className="p-4 lg:p-7">
      {accounts.length > 0 && (
        <>
          <div className="mb-6 rounded-2xl bg-[#0a0b0d] p-6 text-white lg:p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
              Patrimônio total
            </p>
            <p className="mt-3 font-heading text-[36px] font-semibold tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
            <p className="mt-1 text-[13px] text-white/50">
              {accounts.length} contas registradas
            </p>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-semibold">Contas</h2>
              <Button variant="secondary" size="sm" className="gap-1.5 text-[12px]"
                onClick={() => { setEditingAccount(null); setAccountDialogOpen(true) }}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accounts.map((account) => (
                <Card key={account.id} className="rounded-2xl border-border/60 shadow-none group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{accountIcon(account.type, account.name)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{account.name}</p>
                        <p className="text-[12px] text-muted-foreground">{account.bank}</p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditAccount(account)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteTarget({ type: "account", id: account.id })} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 font-heading text-[20px] font-semibold tracking-tight">
                      {formatCurrency(account.balance)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {cards.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-[16px] font-semibold">Cartões de crédito</h2>
            <Button variant="secondary" size="sm" className="gap-1.5 text-[12px]"
              onClick={() => { setEditingCard(null); setCardDialogOpen(true) }}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl p-5 text-white relative group"
                style={{ backgroundColor: card.color }}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="h-6 w-6 text-white/70" />
                  <div className="flex gap-1">
                    <button onClick={() => handleEditCard(card)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "card", id: card.id })} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-4 font-heading text-[11px] font-medium uppercase tracking-wider text-white/70">
                  {card.name}
                </p>
                <p className="mt-1 font-heading text-[20px] font-semibold tracking-tight">
                  {formatCurrency(0)}
                  <span className="text-[12px] font-normal text-white/50">
                    {" "}de {formatCurrency(card.limit)}
                  </span>
                </p>
                <div className="mt-3">
                  <Progress value={0} className="h-1.5 bg-white/20 [&>div]:bg-white/40" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-white/50">
                  <span>Fechamento: dia {card.closing_day}</span>
                  <span>Vencimento: dia {card.due_day}</span>
                </div>
                <p className="mt-1 text-[10px] text-white/40 uppercase tracking-wider">
                  {card.issuer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AccountFormDialog open={accountDialogOpen} onOpenChange={handleAccountDialogChange} editingAccount={editingAccount} />
      <CreditCardFormDialog open={cardDialogOpen} onOpenChange={handleCardDialogChange} editingCard={editingCard} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "account" ? "Excluir Conta" : "Excluir Cartão"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteTarget?.type === "account" ? "esta conta" : "este cartão"}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteAccount.isPending || deleteCreditCard.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
