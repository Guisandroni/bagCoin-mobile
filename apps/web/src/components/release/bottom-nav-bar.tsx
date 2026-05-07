"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ReleaseNavItem } from "./types"
import {
  Home,
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Settings,
} from "lucide-react"

const iconMap: Record<string, ReactNode> = {
  home: <Home className="w-5 h-5" />,
  portfolio: <Wallet className="w-5 h-5" />,
  transferir: <ArrowLeftRight className="w-5 h-5" />,
  mercado: <BarChart3 className="w-5 h-5" />,
  ajustes: <Settings className="w-5 h-5" />,
}

interface BottomNavBarProps {
  items: ReleaseNavItem[]
  onNavigate: (href: string) => void
  className?: string
}

export function BottomNavBar({ items, onNavigate, className }: BottomNavBarProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 w-full z-50",
        "flex justify-around items-center px-2 pb-6 pt-3",
        "bg-[var(--rls-surface-container-lowest)] shadow-[0_-4px_12px_rgba(0,0,0,0.08)]",
        "md:hidden rounded-t-md",
        className
      )}
    >
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => onNavigate(item.href)}
          className={cn(
            "flex flex-col items-center justify-center px-4 py-2 transition-all",
            item.isActive
              ? "bg-[var(--rls-primary-container)] text-[var(--rls-on-primary)] rounded-[var(--rls-radius-pill)]"
              : "text-[var(--rls-on-surface-variant)] hover:bg-[var(--rls-surface-container-high)]"
          )}
        >
          <span className={cn(item.isActive && "text-white")}>
            {iconMap[item.icon] || iconMap.ajustes}
          </span>
          <span
            className={cn(
              "rls-text-label-lg mt-1 text-[10px]",
              item.isActive ? "font-bold" : ""
            )}
          >
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}