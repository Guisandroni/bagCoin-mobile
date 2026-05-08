"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface MobileHeaderProps {
  initials: string
  userName: string
  onOpenDrawer: () => void
}

export function MobileHeader({ initials, userName, onOpenDrawer }: MobileHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-5 pt-3 pb-1 lg:hidden">
      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex items-center gap-2.5 rounded-full transition-opacity active:opacity-80"
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-[var(--primary)] text-white text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold text-[var(--on-surface)] truncate max-w-[140px]">
          {userName}
        </span>
      </button>
    </header>
  )
}
