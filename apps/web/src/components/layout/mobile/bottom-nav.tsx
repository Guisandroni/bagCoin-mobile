"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, List, Wallet, Target, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "dashboard", label: "Início", icon: Home, href: "/app" },
  { id: "transacoes", label: "Transações", icon: List, href: "/app/transacoes" },
  { id: "orcamentos", label: "Orçamentos", icon: Wallet, href: "/app/orcamentos" },
  { id: "metas", label: "Metas", icon: Target, href: "/app/metas" },
  { id: "categorias", label: "Categorias", icon: LayoutGrid, href: "/app/categorias" },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around items-center px-2 pb-[env(safe-area-inset-bottom)] pt-3 bg-[var(--surface-container-lowest)] shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
      {navItems.map((item) => {
        const isActive =
          item.id === "dashboard"
            ? pathname === "/app"
            : pathname.startsWith(item.href)

        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all",
              isActive
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className={cn("text-[10px] mt-1 font-medium", isActive && "font-bold")}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
