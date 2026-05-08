"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { LoginCard } from "@/components/release/login-card"
import { useAuthStore } from "@/lib/auth-store"

const GoogleProvider = dynamic(
  () => import("@/components/auth/google-provider").then((m) => m.GoogleProvider),
  { ssr: false }
)

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuthStore()

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
    router.push("/app")
  }

  const handleGoogleLogin = async (idToken: string) => {
    await loginWithGoogle(idToken)
    router.push("/app")
  }

  return (
    <GoogleProvider>
      <LoginCard
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onRegisterClick={() => router.push("/register")}
        onForgotPassword={() => router.push("/login")}
      />
    </GoogleProvider>
  )
}