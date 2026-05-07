"use client"

import { useState } from "react"
import { User, Mail, Lock, LockKeyhole, ArrowRight } from "lucide-react"
import { PillInput } from "./pill-input"
import { AuthCard, AuthHeader, AuthDivider, AuthFooter, DecorativeBlobs } from "./auth-card"
import type { ReleaseBudgetType } from "./types"

interface RegisterCardProps {
  onRegister?: (data: {
    name: string
    email: string
    password: string
  }) => void
  onGoogleRegister?: () => void
  onLoginClick?: () => void
  isLoading?: boolean
}

export function RegisterCard({
  onRegister,
  onGoogleRegister,
  onLoginClick,
  isLoading,
}: RegisterCardProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRegister?.({ name, email, password })
  }

  return (
    <div className="rls min-h-screen flex flex-col items-center justify-center p-[var(--rls-container-margin)]">
      <DecorativeBlobs />
      <AuthCard>
        <AuthHeader
          title="Crie sua conta"
          subtitle="Junte-se à próxima geração de finanças."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--rls-stack-gap-md)] w-full">
          <PillInput
            label="Nome Completo"
            icon={<User className="w-5 h-5" />}
            placeholder="Ex: João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <PillInput
            label="Email"
            icon={<Mail className="w-5 h-5" />}
            placeholder="seu@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PillInput
            label="Senha"
            icon={<Lock className="w-5 h-5" />}
            placeholder="Mínimo 8 caracteres"
            type="password"
            showPasswordToggle
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PillInput
            label="Confirmar Senha"
            icon={<LockKeyhole className="w-5 h-5" />}
            placeholder="Repita a senha"
            type="password"
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <AuthDivider text="ou cadastre-se com" />

        <button
          type="button"
          onClick={onGoogleRegister}
          className="w-full h-14 bg-[var(--rls-surface-container-lowest)] border border-[var(--rls-outline-variant)] text-[var(--rls-on-surface)] rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-surface-container-low)] transition-colors active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com Google
        </button>

        <AuthFooter
          text="Já tem uma conta?"
          linkText="Entre"
          onLinkClick={onLoginClick}
        />
      </AuthCard>
    </div>
  )
}