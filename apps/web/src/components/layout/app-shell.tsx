"use client"

import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-[640px] min-w-0 flex-1 px-4 pt-4 sm:px-6">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
