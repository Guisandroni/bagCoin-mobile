"use client"

import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import { User, Mail, Lock, LockKeyhole, ArrowRight } from "lucide-react"
import { registerSchema } from "@/lib/validations"
import { PillInput } from "./pill-input"
import { AuthCard, AuthHeader, AuthDivider, AuthFooter } from "./auth-card"
import { ToastBanner } from "./toast-banner"

interface RegisterCardProps {
  onRegister?: (data: {
    name: string
    email: string
    password: string
  }) => void
  onGoogleRegister?: (idToken: string) => void
  onLoginClick?: () => void
  isLoading?: boolean
  errorMessage?: string | null
  onDismissError?: () => void
}

export function RegisterCard({
  onRegister,
  onGoogleRegister,
  onLoginClick,
  isLoading,
  errorMessage,
  onDismissError,
}: RegisterCardProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [googleError, setGoogleError] = useState<string | null>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const result = registerSchema.safeParse({ name, email, password, confirmPassword })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string
        fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    onRegister?.({ name, email, password })
  }

  return (
    <div className="rls min-h-dvh bg-[var(--rls-background)] flex flex-col items-center justify-center p-[var(--rls-container-margin)]">
      <ToastBanner
        isOpen={!!(errorMessage || googleError)}
        message={errorMessage || googleError || ""}
        variant="error"
        onClose={() => {
          setGoogleError(null)
          onDismissError?.()
        }}
      />
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
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
            }}
          />

          <PillInput
            label="Email"
            icon={<Mail className="w-5 h-5" />}
            placeholder="seu@email.com"
            type="email"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
            }}
          />

          <PillInput
            label="Senha"
            icon={<Lock className="w-5 h-5" />}
            placeholder="Mínimo 8 caracteres"
            type="password"
            showPasswordToggle
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
            }}
          />

          <PillInput
            label="Confirmar Senha"
            icon={<LockKeyhole className="w-5 h-5" />}
            placeholder="Repita a senha"
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
            className="w-full h-14 bg-[var(--rls-primary-container)] text-white rls-text-title-lg rounded-[var(--rls-radius-pill)] hover:bg-[var(--rls-primary)] transition-colors active:scale-[0.98] shadow-md shadow-[var(--rls-primary-container)]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <AuthDivider text="ou cadastre-se com" />

        {googleClientId ? (
          <div className="flex w-full justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  onGoogleRegister?.(credentialResponse.credential)
                  return
                }
                setGoogleError("Não foi possível receber a credencial do Google.")
              }}
              onError={() => {
                setGoogleError("Erro ao entrar com Google.")
              }}
              text="continue_with"
              shape="pill"
              theme="outline"
              size="large"
            />
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="w-full h-14 bg-[var(--rls-surface-container-lowest)] border border-[var(--rls-outline-variant)] text-[var(--rls-on-surface)] rls-text-title-lg rounded-[var(--rls-radius-pill)] opacity-60 flex items-center justify-center gap-3"
          >
            Google indisponível
          </button>
        )}

        <AuthFooter
          text="Já tem uma conta?"
          linkText="Entre"
          onLinkClick={onLoginClick}
        />
      </AuthCard>
    </div>
  )
}
