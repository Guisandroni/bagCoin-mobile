"use client"

import { useState } from "react"
import { ChangePasswordModal, ToastBanner } from "@/components/release"

export default function AlterarSenhaPreview() {
  const [isOpen, setIsOpen] = useState(true)
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="rls min-h-screen bg-[var(--rls-background)] flex flex-col items-center justify-center gap-8 p-[var(--rls-container-margin)]">
      <h2 className="rls-text-headline-sm text-[var(--rls-on-surface)]">
        Preview: Modal Alterar Senha
      </h2>

      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-[var(--rls-primary-container)] text-white rls-text-body-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors"
      >
        Abrir Modal
      </button>

      <button
        onClick={() => setShowToast(true)}
        className="px-6 py-3 bg-green-600 text-white rls-text-body-lg rounded-[var(--rls-radius-pill)] hover:bg-green-700 transition-colors"
      >
        Mostrar Toast de Sucesso
      </button>

      <ChangePasswordModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => {
          console.log("Password change:", data)
          setIsOpen(false)
          setShowToast(true)
        }}
      />

      <ToastBanner
        message="Senha alterada com sucesso!"
        variant="success"
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />
    </div>
  )
}