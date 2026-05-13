"use client"

import { Sidebar as DesktopSidebar } from "./desktop/sidebar"
import { TopBar as DesktopTopBar } from "./desktop/top-bar"
import { TabletSidebar } from "./tablet/sidebar"
import { TabletTopBar } from "./tablet/top-bar"
import { MobileHeader } from "./mobile/header"
import { BottomNav as MobileBottomNav } from "./mobile/bottom-nav"
import { SettingsDrawer } from "./shared/settings-drawer"
import { useAppStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"

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
      <DesktopSidebar />
      <TabletSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          initials={initials}
          userName={user?.full_name || "Usuário"}
          onOpenDrawer={openDrawer}
        />

        <DesktopTopBar />
        <TabletTopBar />

        <div className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-y-auto px-5 pb-[var(--bottom-nav-h)] pt-2 sm:px-6 lg:pb-10">
          {children}
        </div>
      </div>

      <MobileBottomNav />
      <SettingsDrawer />
    </div>
  )
}
