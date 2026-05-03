"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, Plus, Wallet, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { MOBILE_NAV_ITEMS } from "@/lib/constants"

const iconMap: Record<string, React.ElementType> = {
  Home,
  List,
  Plus,
  Wallet,
  Settings,
}

export function BottomNav() {
  const pathname = usePathname()
  const openModal = useAppStore((s) => s.openModal)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive =
            item.id === "dashboard"
              ? pathname === "/app"
              : item.id === "new"
                ? false
                : pathname.startsWith(`/app/${item.id}`)

          if (item.id === "new") {
            return (
              <button
                key={item.id}
                onClick={() => openModal("new-transaction")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            )
          }

          const href = item.id === "dashboard" ? "/app" : `/app/${item.id}`

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-semibold transition-colors",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}