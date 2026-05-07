"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "warning" | "info"

interface ToastBannerProps {
  message: string
  variant?: ToastVariant
  isOpen: boolean
  onClose?: () => void
  duration?: number
  className?: string
}

const variantStyles: Record<ToastVariant, { bg: string; icon: typeof CheckCircle }> = {
  success: {
    bg: "bg-green-50 border-green-200 text-green-800",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-[var(--rls-error-container)] border-[var(--rls-error)] text-[var(--rls-on-error-container)]",
    icon: XCircle,
  },
  warning: {
    bg: "bg-amber-50 border-amber-200 text-amber-800",
    icon: AlertCircle,
  },
  info: {
    bg: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
  },
}

export function ToastBanner({
  message,
  variant = "success",
  isOpen,
  onClose,
  duration = 3000,
  className,
}: ToastBannerProps) {
  const [visible, setVisible] = useState(isOpen)
  const Icon = variantStyles[variant].icon

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!visible) return null

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[60]",
        "flex items-center gap-3 px-6 py-3 rounded-[var(--rls-radius-pill)] shadow-lg",
        "animate-[slide-down_200ms_ease-out]",
        variantStyles[variant].bg,
        className
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="rls-text-body-lg">{message}</span>
      {onClose && (
        <button
          onClick={() => {
            setVisible(false)
            onClose()
          }}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}