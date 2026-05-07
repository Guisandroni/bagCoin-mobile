"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  List,
  BarChart3,
  MessageSquare,
  Plus,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { MOBILE_NAV_ITEMS } from "@/lib/constants"

const iconMap: Record<string, React.ElementType> = {
  Home,
  List,
  BarChart3,
  MessageSquare,
  Plus,
  Compass,
}

export function BottomNav() {
  const pathname = usePathname()
  const openModal = useAppStore((s) => s.openModal)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-end justify-between gap-1 px-2">
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
              <div key={item.id} className="relative flex flex-1 justify-center pb-1">
                <button
                  type="button"
                  onClick={() => openModal("new-transaction")}
                  className="absolute -top-7 flex h-14 w-14 min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-4 ring-background transition-transform active:scale-95"
                  aria-label="Novo lançamento"
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </button>
                <span className="mt-8 text-[10px] font-semibold text-muted-foreground">{item.label}</span>
              </div>
            )
          }

          const href = item.id === "dashboard" ? "/app" : `/app/${item.id}`

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {Icon && <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 2} />}
              <span className="leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
