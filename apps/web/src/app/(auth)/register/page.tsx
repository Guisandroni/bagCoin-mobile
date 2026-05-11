"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { RegisterCard } from "@/components/release/register-card"
import { useAuthStore } from "@/lib/auth-store"

const GoogleProvider = dynamic(
  () => import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false }
)

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle, clearError, isLoading } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRegister = async (data: { name: string; email: string; password: string }) => {
    setErrorMessage(null)
    try {
      await register(data.email, data.password, data.name)
      router.push("/login?registered=true")
    } catch (error) {
      setErrorMessage(resolveAuthError(error, "Não foi possível criar sua conta. Tente novamente."))
    }
  }

  const handleGoogleRegister = async (idToken: string) => {
    setErrorMessage(null)
    try {
      await loginWithGoogle(idToken)
      router.push("/app")
    } catch (error) {
      setErrorMessage(resolveAuthError(error, "Não foi possível entrar com Google."))
    }
  }

  return (
    <GoogleProvider>
      <RegisterCard
        onRegister={handleRegister}
        onGoogleRegister={handleGoogleRegister}
        onLoginClick={() => router.push("/login")}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onDismissError={() => {
          setErrorMessage(null)
          clearError()
        }}
      />
    </GoogleProvider>
  )
}

function resolveAuthError(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { error?: { message?: string }; detail?: string } }; message?: string }
  const detail = err.response?.data?.detail
  if (typeof detail === "string") return detail
  return err.response?.data?.error?.message || err.message || fallback
}
