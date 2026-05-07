export const BRAND = {
  pre: "bag",
  suf: "Coin",
}

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutGrid" },
  { id: "transacoes", label: "Transações", icon: "List" },
  { id: "orcamentos", label: "Orçamentos", icon: "BarChart3" },
  { id: "metas", label: "Metas", icon: "Target" },
  { id: "confirmacoes", label: "Confirmações", icon: "MessageSquare" },
  { id: "relatorios", label: "Relatórios", icon: "FileText" },
]

/** Bottom bar: Início, Histórico, FAB central, Chat, Planejar (Compass), Resumo — Coinbase-style */
export const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Início", icon: "Home" },
  { id: "transacoes", label: "Histórico", icon: "List" },
  { id: "new", label: "Novo", icon: "Plus" },
  { id: "confirmacoes", label: "Chat", icon: "MessageSquare" },
  { id: "orcamentos", label: "Planejar", icon: "Compass" },
  { id: "relatorios", label: "Resumo", icon: "BarChart3" },
]

/** DialogContent: anchor to bottom on small screens (sheet-like) */
export const DIALOG_SHEET_MOBILE =
  "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:max-h-[min(92dvh,800px)] max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-b-none max-sm:rounded-t-2xl"

export const CATEGORIES = [
  { label: "Alimentação", icon: "🍔", name: "Alimentação", color: "#FF6B6B", emoji: "🍔" },
  { label: "Transporte", icon: "🚗", name: "Transporte", color: "#4ECDC4", emoji: "🚗" },
  { label: "Moradia", icon: "🏠", name: "Moradia", color: "#45B7D1", emoji: "🏠" },
  { label: "Saúde", icon: "🏥", name: "Saúde", color: "#96CEB4", emoji: "🏥" },
  { label: "Educação", icon: "📚", name: "Educação", color: "#FFEAA7", emoji: "📚" },
  { label: "Lazer", icon: "🎮", name: "Lazer", color: "#DDA0DD", emoji: "🎮" },
  { label: "Salário", icon: "💼", name: "Salário", color: "#98D8C8", emoji: "💼" },
  { label: "Investimentos", icon: "📈", name: "Investimentos", color: "#F7DC6F", emoji: "📈" },
]

export const PERIODS = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
]

export const SOURCE_LABELS: Record<string, string> = {
  text: "Texto",
  audio: "Áudio",
  image: "Imagem",
  document: "Documento",
  api: "API",
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
}
