"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  List,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND, NAV_ITEMS } from "@/lib/constants"
import { useAuthStore } from "@/lib/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  List,
  Wallet,
  Settings,
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U"

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="px-4 pb-3 pt-6">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-brand">
          {BRAND.pre}
          <span className="text-foreground">{BRAND.suf}</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Organização
        </p>
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = iconMap[item.icon]
          const href = item.id === "dashboard" ? "/app" : `/app/${item.id}`
          const isActive = item.id === "dashboard" ? pathname === "/app" : pathname.startsWith(`/app/${item.id}`)
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-[18px] w-[18px]" />}
              {item.label}
            </Link>
          )
        })}

        <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Controle Financeiro
        </p>
        <Link
          href="/app/contas"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
            pathname.startsWith("/app/contas")
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Wallet className="h-[18px] w-[18px]" />
          Contas
        </Link>

        <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Sistema
        </p>
        <Link
          href="/app/configuracoes"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
            pathname.startsWith("/app/configuracoes")
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Configurações
        </Link>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-[13px] font-semibold text-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{user?.full_name || "Usuário"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email || ""}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <Button variant="secondary" className="flex-1 gap-2 text-[13px]" size="sm">
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}