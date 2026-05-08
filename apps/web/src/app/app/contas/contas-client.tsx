"use client"

import { useState } from "react"
import { CreditCard, Plus, Pencil, Trash2 } from "lucide-react"
import { SectionHeader, AssetRow, PriceListItem, FilterChip } from "@/components/coinbase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/ui/empty-state"
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
import { revalidateAccounts, revalidateCreditCards } from "./actions"
import type { ServerAccount, ServerCreditCard } from "@/lib/api-server"

function utilizationSpark(id: number): number[] {
  const out: number[] = []
  for (let i = 0; i < 6; i++) {
    out.push(Math.min(1, 0.25 + (((id + i) * 17) % 50) / 100))
  }
  return out
}

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

function serverAccountToClient(account: ServerAccount): AccountResponse {
  return {
    id: typeof account.id === "string" ? parseInt(account.id, 10) || 0 : account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
    bank: account.bank,
    color: account.color,
    created_at: account.created_at,
  }
}

function serverCardToClient(card: ServerCreditCard): CreditCardResponse {
  return {
    id: typeof card.id === "string" ? parseInt(card.id, 10) || 0 : card.id,
    name: card.name,
    issuer: card.issuer,
    limit: card.limit,
    closing_day: card.closing_day,
    due_day: card.due_day,
    color: card.color,
    created_at: card.created_at,
  }
}

// ── Account Form Dialog ─────────────────────────

function AccountFormDialog({
  open,
  onOpenChange,
  editingAccount,
  onMutateSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAccount: AccountResponse | null
  onMutateSuccess: () => void
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
      await revalidateAccounts()
      onMutateSuccess()
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

// ── Credit Card Form Dialog ────────────────────

function CreditCardFormDialog({
  open,
  onOpenChange,
  editingCard,
  onMutateSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCard: CreditCardResponse | null
  onMutateSuccess: () => void
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
      await revalidateCreditCards()
      onMutateSuccess()
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

// ── Client Component ──────────────────────────

interface ContasClientProps {
  initialAccounts: AccountResponse[]
  initialCards: CreditCardResponse[]
}

export function ContasClient({ initialAccounts, initialCards }: ContasClientProps) {
  const { data: accountsData, isLoading: accountsLoading, isError: accountsError } = useAccounts()
  const { data: cardsData, isLoading: cardsLoading, isError: cardsError } = useCreditCards()
  const deleteAccount = useDeleteAccount()
  const deleteCreditCard = useDeleteCreditCard()

  const accounts = accountsLoading || accountsError
    ? initialAccounts
    : Array.isArray(accountsData) ? accountsData : initialAccounts
  const cards = cardsLoading || cardsError
    ? initialCards
    : Array.isArray(cardsData) ? cardsData : initialCards

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0)

  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null)
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardResponse | null>(null)
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
        await revalidateAccounts()
      } else {
        await deleteCreditCard.mutateAsync(deleteTarget.id)
        await revalidateCreditCards()
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

  const handleMutateSuccess = () => {
    // React Query invalidation handles client-side; server action handles server cache
  }

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <div className="p-4 lg:p-7">
        <EmptyState
          title="Nenhuma conta ou cartão"
          description="Adicione sua primeira conta ou cartão de crédito para começar."
          actionLabel="Adicionar conta"
          onAction={() => { setEditingAccount(null); setAccountDialogOpen(true) }}
        />
        <AccountFormDialog open={accountDialogOpen} onOpenChange={handleAccountDialogChange} editingAccount={editingAccount} onMutateSuccess={handleMutateSuccess} />
      </div>
    )
  }

  return (
    <div className="page-in space-y-6 pb-28 lg:pb-10">
      <h1 className="section-title">Contas</h1>

      {accounts.length > 0 && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Saldo em contas
            </p>
            <p className="amount-display mt-2">{formatCurrency(totalBalance)}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {accounts.length} conta(s) registrada(s)
            </p>
          </div>

          <SectionHeader
            title="Contas"
            actionLabel="Adicionar"
            onAction={() => {
              setEditingAccount(null)
              setAccountDialogOpen(true)
            }}
          />
          <div className="space-y-2">
            {accounts.map((account) => (
              <AssetRow
                key={account.id}
                icon={<span className="text-xl">{accountIcon(account.type, account.name)}</span>}
                title={account.name}
                subtitle={[account.bank, account.type].filter(Boolean).join(" · ") || "Conta"}
                amount={<span className="row-amount">{formatCurrency(account.balance)}</span>}
                trailing={
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      aria-label="Editar conta"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditAccount(account)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive"
                      aria-label="Excluir conta"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteTarget({ type: "account", id: account.id })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                }
                onClick={() => handleEditAccount(account)}
              />
            ))}
          </div>
        </>
      )}

      {cards.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Cartões de crédito"
            right={
              <div className="flex items-center gap-2">
                <FilterChip label="Activos">
                  <p className="max-w-[220px] px-3 py-2 text-[13px] text-muted-foreground">
                    Lista de cartões activos (placeholder até integração de fatura).
                  </p>
                </FilterChip>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 shrink-0 rounded-full"
                  aria-label="Adicionar cartão"
                  onClick={() => {
                    setEditingCard(null)
                    setCardDialogOpen(true)
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            }
          />
          <div className="rounded-2xl border border-border bg-card px-2 py-1">
            {cards.map((card) => {
              const utilPct = Math.min(95, ((card.id * 23) % 60) + 5)
              const delta = utilPct - 45
              return (
                <PriceListItem
                  key={card.id}
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  name={card.name}
                  ticker={`Fecha dia ${card.closing_day} · Vence dia ${card.due_day} · ${card.issuer}`}
                  priceLabel={formatCurrency(card.limit)}
                  deltaPercent={delta}
                  sparklineValues={utilizationSpark(card.id)}
                  onClick={() => handleEditCard(card)}
                />
              )
            })}
          </div>
        </section>
      )}

      <AccountFormDialog open={accountDialogOpen} onOpenChange={handleAccountDialogChange} editingAccount={editingAccount} onMutateSuccess={handleMutateSuccess} />
      <CreditCardFormDialog open={cardDialogOpen} onOpenChange={handleCardDialogChange} editingCard={editingCard} onMutateSuccess={handleMutateSuccess} />

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
