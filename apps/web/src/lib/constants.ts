import type { Category } from "@/types"

export const CATEGORIES: Category[] = [
  { name: "Alimentação", color: "#ff6b35", emoji: "🍔" },
  { name: "Transporte", color: "#0052ff", emoji: "🚗" },
  { name: "Moradia", color: "#7c3aed", emoji: "🏠" },
  { name: "Saúde", color: "#00c853", emoji: "💊" },
  { name: "Lazer", color: "#ffab00", emoji: "🎮" },
  { name: "Educação", color: "#2196f3", emoji: "📚" },
  { name: "Compras", color: "#e91e63", emoji: "🛍️" },
  { name: "Salário", color: "#00c853", emoji: "💰" },
]

export const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "Detectado via WhatsApp",
  auto: "Automático",
  manual: "Lançamento manual",
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendente",
}

export const BRAND = {
  name: "Bagcoin",
  pre: "Bag",
  suf: "coin",
}

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutGrid" },
  { id: "transacoes", label: "Transações", icon: "List" },
  { id: "contas", label: "Contas", icon: "Wallet" },
  { id: "configuracoes", label: "Configurações", icon: "Settings" },
] as const

export const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Início", icon: "Home" },
  { id: "transacoes", label: "Transações", icon: "List" },
  { id: "new", label: "Novo", icon: "Plus" },
  { id: "contas", label: "Contas", icon: "Wallet" },
  { id: "configuracoes", label: "Mais", icon: "Settings" },
] as const