import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico para o padrão monetário brasileiro (pt-BR).
 * Ex: formatCurrency(8500) => "R$ 8.500,00"
 *     formatCurrency(-287.5) => "-R$ 287,50"
 */
export function formatCurrency(v: number): string {
  const abs = Math.abs(v)
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
  return (v < 0 ? "-R$ " : "R$ ") + formatted
}
