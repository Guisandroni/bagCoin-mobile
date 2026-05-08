"use client"

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
  const { register, loginWithGoogle } = useAuthStore()

  const handleRegister = async (data: { name: string; email: string; password: string }) => {
    await register(data.email, data.password, data.name)
    router.push("/login?registered=true")
  }

  const handleGoogleRegister = async (idToken: string) => {
    await loginWithGoogle(idToken)
    router.push("/app")
  }

  return (
    <GoogleProvider>
      <RegisterCard
        onRegister={handleRegister}
        onGoogleRegister={handleGoogleRegister}
        onLoginClick={() => router.push("/login")}
      />
    </GoogleProvider>
  )
}