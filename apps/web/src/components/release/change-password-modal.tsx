"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { changePasswordSchema } from "@/lib/validations"
import { PillInput } from "./pill-input"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => void
  isLoading?: boolean
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const result = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string
        fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    onSubmit?.({ currentPassword, newPassword, confirmPassword })
  }

  return (
    <div className="rls">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[rgba(27,28,30,0.4)] backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
        <div className="w-full max-w-lg bg-[var(--rls-surface-container-lowest)] rounded-t-[var(--rls-radius-lg)] shadow-sheet">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-[var(--rls-outline-variant)] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center px-[var(--rls-inline-padding-md)] pb-4 border-b border-[var(--rls-outline-variant)]">
            <h2 className="rls-text-headline-sm text-[var(--rls-on-surface)]">
              Alterar Senha
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--rls-surface-container-high)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--rls-on-surface)]" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-[var(--rls-inline-padding-md)] pb-[var(--rls-inline-padding-lg)] flex flex-col gap-[var(--rls-stack-gap-md)]"
          >
            <PillInput
              label="Senha Atual"
              placeholder="Digite sua senha atual"
              type="password"
              showPasswordToggle
              value={currentPassword}
              error={errors.currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: "" }))
              }}
            />

            <PillInput
              label="Nova Senha"
              placeholder="Mínimo 8 caracteres"
              type="password"
              showPasswordToggle
              value={newPassword}
              error={errors.newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }))
              }}
            />

            <PillInput
              label="Confirmar Nova Senha"
              placeholder="Repita a nova senha"
              type="password"
              showPasswordToggle
              value={confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }))
              }}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}