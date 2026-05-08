"use client"

import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { BottomNav } from "./bottom-nav"
import { SettingsDrawer } from "./settings-drawer"
import { useAppStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const openDrawer = useAppStore((s) => s.openDrawer)
  const { user } = useAuthStore()

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header — profile drawer trigger */}
        <header className="flex items-center gap-3 px-5 pt-3 pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => openDrawer()}
            className="flex items-center gap-2.5 rounded-full transition-opacity active:opacity-80"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-[var(--primary)] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-[var(--on-surface)] truncate max-w-[140px]">
              {user?.full_name || "Usuário"}
            </span>
          </button>
        </header>

        {/* Desktop top bar */}
        <div className="hidden lg:block">
          <TopBar />
        </div>

        {/* Content area — scrollable on mobile */}
        <div className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-y-auto px-5 pb-24 pt-2 sm:px-6 lg:pb-10">
          {children}
        </div>
      </div>
      <BottomNav />
      <SettingsDrawer />
    </div>
  )
}