import {
  Utensils,
  Car,
  Home,
  Heart,
  BookOpen,
  Gamepad2,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  Banknote,
  Coffee,
  Plane,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"
import { createElement } from "react"

export interface CategoryDef {
  name: string
  emoji: string
  lucideIcon: LucideIcon
  color: string
  type: "income" | "expense"
}

const CATEGORY_MAP: Record<string, CategoryDef> = {
  alimentação: {
    name: "Alimentação",
    emoji: "🍽️",
    lucideIcon: Utensils,
    color: "#FF6B6B",
    type: "expense",
  },
  transporte: {
    name: "Transporte",
    emoji: "🚗",
    lucideIcon: Car,
    color: "#4ECDC4",
    type: "expense",
  },
  moradia: {
    name: "Moradia",
    emoji: "🏠",
    lucideIcon: Home,
    color: "#45B7D1",
    type: "expense",
  },
  saúde: {
    name: "Saúde",
    emoji: "❤️",
    lucideIcon: Heart,
    color: "#96CEB4",
    type: "expense",
  },
  educação: {
    name: "Educação",
    emoji: "📚",
    lucideIcon: BookOpen,
    color: "#FFEAA7",
    type: "expense",
  },
  lazer: {
    name: "Lazer",
    emoji: "🎬",
    lucideIcon: Gamepad2,
    color: "#DDA0DD",
    type: "expense",
  },
  compras: {
    name: "Compras",
    emoji: "🛍️",
    lucideIcon: ShoppingCart,
    color: "#F39C12",
    type: "expense",
  },
  restaurantes: {
    name: "Restaurantes",
    emoji: "☕",
    lucideIcon: Coffee,
    color: "#E74C3C",
    type: "expense",
  },
  supermercado: {
    name: "Supermercado",
    emoji: "🛒",
    lucideIcon: ShoppingCart,
    color: "#FF6B6B",
    type: "expense",
  },
  delivery: {
    name: "Delivery",
    emoji: "🍔",
    lucideIcon: Utensils,
    color: "#fb7185",
    type: "expense",
  },
  mercado: {
    name: "Mercado",
    emoji: "🛒",
    lucideIcon: ShoppingCart,
    color: "#FF6B6B",
    type: "expense",
  },
  restaurante: {
    name: "Restaurante",
    emoji: "🍽️",
    lucideIcon: Utensils,
    color: "#E74C3C",
    type: "expense",
  },
  restaurantejapones: {
    name: "Restaurante Japonês",
    emoji: "🍽️",
    lucideIcon: Utensils,
    color: "#E74C3C",
    type: "expense",
  },
  gasolina: {
    name: "Gasolina",
    emoji: "🚗",
    lucideIcon: Car,
    color: "#4ECDC4",
    type: "expense",
  },
  combustivel: {
    name: "Combustível",
    emoji: "🚗",
    lucideIcon: Car,
    color: "#4ECDC4",
    type: "expense",
  },
  estacionamento: {
    name: "Estacionamento",
    emoji: "🅿️",
    lucideIcon: Car,
    color: "#60a5fa",
    type: "expense",
  },
  uber: {
    name: "Uber",
    emoji: "🚗",
    lucideIcon: Car,
    color: "#4ECDC4",
    type: "expense",
  },
  aluguel: {
    name: "Aluguel",
    emoji: "🏠",
    lucideIcon: Home,
    color: "#45B7D1",
    type: "expense",
  },
  luz: {
    name: "Luz",
    emoji: "💡",
    lucideIcon: Home,
    color: "#facc15",
    type: "expense",
  },
  agua: {
    name: "Água",
    emoji: "💧",
    lucideIcon: Home,
    color: "#06b6d4",
    type: "expense",
  },
  internet: {
    name: "Internet",
    emoji: "🌐",
    lucideIcon: Home,
    color: "#0ea5e9",
    type: "expense",
  },
  telefone: {
    name: "Telefone",
    emoji: "📱",
    lucideIcon: Home,
    color: "#38bdf8",
    type: "expense",
  },
  netflix: {
    name: "Netflix",
    emoji: "🎬",
    lucideIcon: Gamepad2,
    color: "#DDA0DD",
    type: "expense",
  },
  cinema: {
    name: "Cinema",
    emoji: "🎬",
    lucideIcon: Gamepad2,
    color: "#DDA0DD",
    type: "expense",
  },
  farmacia: {
    name: "Farmácia",
    emoji: "❤️",
    lucideIcon: Heart,
    color: "#96CEB4",
    type: "expense",
  },
  planodesaude: {
    name: "Plano de Saúde",
    emoji: "🩺",
    lucideIcon: Heart,
    color: "#fb7185",
    type: "expense",
  },
  cursos: {
    name: "Cursos",
    emoji: "📚",
    lucideIcon: BookOpen,
    color: "#16a34a",
    type: "expense",
  },
  assinaturas: {
    name: "Assinaturas",
    emoji: "🎬",
    lucideIcon: Gamepad2,
    color: "#9333ea",
    type: "expense",
  },
  hospedagem: {
    name: "Hospedagem",
    emoji: "🏨",
    lucideIcon: Plane,
    color: "#0ea5e9",
    type: "expense",
  },
  vestuario: {
    name: "Vestuário",
    emoji: "👕",
    lucideIcon: ShoppingCart,
    color: "#db2777",
    type: "expense",
  },
  beleza: {
    name: "Beleza",
    emoji: "💅",
    lucideIcon: ShoppingCart,
    color: "#f472b6",
    type: "expense",
  },
  tecnologia: {
    name: "Tecnologia",
    emoji: "💻",
    lucideIcon: ShoppingCart,
    color: "#64748b",
    type: "expense",
  },
  pet: {
    name: "Pet",
    emoji: "🐾",
    lucideIcon: Heart,
    color: "#f97316",
    type: "expense",
  },
  doacoes: {
    name: "Doações",
    emoji: "🤝",
    lucideIcon: Heart,
    color: "#84cc16",
    type: "expense",
  },
  impostos: {
    name: "Impostos",
    emoji: "🧾",
    lucideIcon: Banknote,
    color: "#dc2626",
    type: "expense",
  },
  bancosetarifas: {
    name: "Bancos e Tarifas",
    emoji: "🏦",
    lucideIcon: Banknote,
    color: "#64748b",
    type: "expense",
  },
  seguros: {
    name: "Seguros",
    emoji: "🛡️",
    lucideIcon: Briefcase,
    color: "#0891b2",
    type: "expense",
  },
  salariomaio: {
    name: "Salário Maio",
    emoji: "💰",
    lucideIcon: Briefcase,
    color: "#98D8C8",
    type: "income",
  },
  freelancedesign: {
    name: "Freelance Design",
    emoji: "💼",
    lucideIcon: Briefcase,
    color: "#00bcd4",
    type: "income",
  },
  salário: {
    name: "Salário",
    emoji: "💰",
    lucideIcon: Briefcase,
    color: "#98D8C8",
    type: "income",
  },
  investimentos: {
    name: "Investimentos",
    emoji: "📈",
    lucideIcon: TrendingUp,
    color: "#F7DC6F",
    type: "income",
  },
  freelance: {
    name: "Freelance",
    emoji: "💼",
    lucideIcon: Briefcase,
    color: "#10b981",
    type: "income",
  },
  rendaextra: {
    name: "Renda Extra",
    emoji: "💵",
    lucideIcon: Banknote,
    color: "#14b8a6",
    type: "income",
  },
  reembolso: {
    name: "Reembolso",
    emoji: "↩️",
    lucideIcon: Banknote,
    color: "#2dd4bf",
    type: "income",
  },
  receita: {
    name: "Receita",
    emoji: "💵",
    lucideIcon: Banknote,
    color: "#2ECC71",
    type: "income",
  },
  viagem: {
    name: "Viagem",
    emoji: "✈️",
    lucideIcon: Plane,
    color: "#3498DB",
    type: "expense",
  },
  veículo: {
    name: "Veículo",
    emoji: "🚙",
    lucideIcon: Car,
    color: "#1ABC9C",
    type: "expense",
  },
  outro: {
    name: "Outro",
    emoji: "📁",
    lucideIcon: MoreHorizontal,
    color: "#95A5A6",
    type: "expense",
  },
}

function normalize(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "")
}

function resolveCategory(categoryKey: string): CategoryDef | undefined {
  const key = normalize(categoryKey)
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key]

  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (normalize(v.name) === key) return v
    if (normalize(k) === key) return k === v.name.toLowerCase() ? v : undefined
  }
  return undefined
}

export function getCategoryEmoji(name: string): string {
  return resolveCategory(name)?.emoji ?? "💳"
}

export function getCategoryColor(name: string): string {
  return resolveCategory(name)?.color ?? "#1652F0"
}

export function getCategoryLucideIcon(name: string): LucideIcon {
  return resolveCategory(name)?.lucideIcon ?? MoreHorizontal
}

export function getCategoryDef(name: string): CategoryDef {
  return resolveCategory(name) ?? {
    name,
    emoji: "💳",
    lucideIcon: MoreHorizontal,
    color: "#95A5A6",
    type: "expense",
  }
}

export function CategoryIcon({
  name,
  size = 18,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const Icon = getCategoryLucideIcon(name)
  return createElement(Icon, { size, className })
}

export const CATEGORY_LIST = Object.values(CATEGORY_MAP).map((c) => c.name)
export const EXPENSE_CATEGORIES = Object.values(CATEGORY_MAP)
  .filter((c) => c.type === "expense")
  .map((c) => c.name)
export const INCOME_CATEGORIES = Object.values(CATEGORY_MAP)
  .filter((c) => c.type === "income")
  .map((c) => c.name)
export const CATEGORIES_WITH_EMOJI = Object.values(CATEGORY_MAP).map((c) => ({
  label: c.name,
  emoji: c.emoji,
  color: c.color,
}))

export { CATEGORY_MAP }

export const CATEGORIES = Object.values(CATEGORY_MAP).map((c) => ({
  label: c.name,
  icon: c.emoji,
  name: c.name,
  color: c.color,
  emoji: c.emoji,
  type: c.type,
}))
