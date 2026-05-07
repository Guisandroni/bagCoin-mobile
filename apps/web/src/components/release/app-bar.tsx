"use client"

import { type ReactNode } from "react"
import { ArrowLeft, Search, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppBarAction {
  icon: ReactNode
  onClick: () => void
  label?: string
}

interface AppBarProps {
  title?: string
  titleClassName?: string
  onBack?: () => void
  actions?: AppBarAction[]
  avatar?: ReactNode
  sticky?: boolean
}

export function AppBar({
  title,
  titleClassName,
  onBack,
  actions,
  avatar,
  sticky = true,
}: AppBarProps) {
  return (
    <header
      className={cn(
        "flex justify-between items-center w-full px-[var(--rls-container-margin)] py-[var(--rls-stack-gap-md)] bg-[var(--rls-surface)] z-40",
        sticky && "sticky top-0"
      )}
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          avatar
        ) : onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--rls-surface-container-high)] transition-colors active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-[var(--rls-on-surface)]" />
          </button>
        ) : null}
      </div>

      {title && (
        <h1
          className={cn(
            "rls-text-display-md text-[var(--rls-primary-container)] text-2xl flex-1 text-center",
            !onBack && !avatar && "text-left",
            titleClassName
          )}
        >
          {title}
        </h1>
      )}

      <div className="flex items-center gap-2">
        {actions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="w-10 h-10 flex items-center justify-center text-[var(--rls-primary)] hover:opacity-80 transition-opacity active:scale-95 rounded-full"
          >
            {action.icon}
          </button>
        ))}
        {!actions && !onBack && !avatar && <div className="w-10" />}
      </div>
    </header>
  )
}

export function AppBarSearchAction(onClick: () => void): AppBarAction {
  return { icon: <Search className="w-6 h-6" />, onClick, label: "Buscar" }
}

export function AppBarMoreAction(onClick: () => void): AppBarAction {
  return {
    icon: <MoreVertical className="w-6 h-6" />,
    onClick,
    label: "Mais",
  }
}