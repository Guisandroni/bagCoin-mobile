"use client"

import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { BottomNav } from "./bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}